import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ILinkClient, loginWithQR, MessageItemType } from "weixin-ilink";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CURSOR_FILE = path.join(__dirname, "cursor.dat");
const CREDS_FILE = path.join(__dirname, "ilink-creds.json");

function loadSavedCreds() {
  if (!fs.existsSync(CREDS_FILE)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(CREDS_FILE, "utf-8"));
    if (typeof data.botToken !== "string" || typeof data.baseUrl !== "string") {
      return null;
    }
    return {
      botToken: data.botToken,
      baseUrl: data.baseUrl,
      accountId: typeof data.accountId === "string" ? data.accountId : "",
      userId: typeof data.userId === "string" ? data.userId : undefined,
    };
  } catch {
    return null;
  }
}

function saveCreds(creds) {
  const payload = {
    botToken: creds.botToken,
    baseUrl: creds.baseUrl,
    accountId: creds.accountId,
    ...(creds.userId !== undefined ? { userId: creds.userId } : {}),
  };
  fs.writeFileSync(CREDS_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function restoreCursor(client) {
  if (!fs.existsSync(CURSOR_FILE)) return;
  client.cursor = fs.readFileSync(CURSOR_FILE, "utf-8");
  console.log("已恢复 sync cursor（避免重复处理历史消息）。");
}

async function loginViaQR() {
  console.log("请使用微信扫描下方链接打开的二维码完成登录（链接可能多次刷新）。");
  const creds = await loginWithQR({
    onQRCode: (url) => console.log(`扫码链接: ${url}`),
    onStatusChange: (s) => console.log(`登录状态: ${s}`),
  });
  saveCreds(creds);
  console.log(`登录成功，accountId: ${creds.accountId}（凭据已写入 ${path.basename(CREDS_FILE)}）`);
  return creds;
}

async function obtainCreds() {
  const saved = loadSavedCreds();
  if (saved) {
    console.log(
      `使用已保存的登录信息（删除 ${path.basename(CREDS_FILE)} 可强制重新扫码）。`
    );
    if (saved.accountId) console.log("accountId:", saved.accountId);
    return saved;
  }
  return loginViaQR();
}

function makeClient(creds) {
  return new ILinkClient({
    baseUrl: creds.baseUrl,
    token: creds.botToken,
  });
}

async function main() {
  let creds = await obtainCreds();
  let client = makeClient(creds);
  restoreCursor(client);

  const persistCursor = () => fs.writeFileSync(CURSOR_FILE, client.cursor, "utf-8");
  process.on("SIGINT", () => {
    persistCursor();
    process.exit(0);
  });

  console.log("开始长轮询，按 Ctrl+C 退出并保存 cursor。");

  while (true) {
    try {
      const { msgs } = await client.poll();
      persistCursor();

      for (const msg of msgs ?? []) {
        if (!msg.from_user_id || !msg.context_token) continue;

        const item = msg.item_list?.[0];
        if (item?.type === MessageItemType.TEXT && item.text_item?.text) {
          await client.sendText(
            msg.from_user_id,
            `Echo: ${item.text_item.text}`,
            msg.context_token
          );
        }
      }
    } catch (err) {
      console.error(err);
      if (fs.existsSync(CREDS_FILE)) {
        fs.unlinkSync(CREDS_FILE);
        console.warn(
          "已删除本地凭据（可能 token 已失效）。正在重新走扫码登录…"
        );
      }
      creds = await loginViaQR();
      client = makeClient(creds);
      restoreCursor(client);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
