# weixin-ilink Demo

基于 [weixin-ilink](https://github.com/crazynomad/weixin-ilink) 的最小示例：扫码登录 iLink 机器人后，对用户发来的**文本**消息做回显（`Echo: …`）。

## 前置条件

- Node.js **≥ 18**（需要全局 `fetch`）
- 依赖已安装在 **`nodejs` 根目录**（`weixin-ilink` 在 `../node_modules`）

## 安装依赖（若尚未安装）

在仓库中的 **`nodejs`** 目录执行：

```bash
cd /path/to/scratch/nodejs
pnpm install
```

（若你使用 npm，且 `nodejs` 为独立包目录，也可在该目录执行 `npm install`。）

## 运行

方式一（推荐，在 `nodejs` 根目录）：

```bash
cd /path/to/scratch/nodejs
node weixin-ilink-demo/index.js
```

方式二（在 demo 子目录）：

```bash
cd /path/to/scratch/nodejs/weixin-ilink-demo
npm start
```

启动后终端会打印**扫码链接**，用微信打开并完成登录；之后向机器人发文字消息即可看到回声。

## 本地文件

- **`ilink-creds.json`**：上次扫码登录得到的 `botToken`、`baseUrl` 等，**下次启动会直接复用、跳过扫码**。若 token 失效，程序会在轮询失败时删掉该文件并提示重新扫码；你也可以手动删除后重启以强制重新登录。**不要提交到 Git**（内含敏感凭据）。
- **`cursor.dat`**：同步游标，用于重启后尽量不重复拉取旧消息；**不要提交到 Git**。退出前可按一次 `Ctrl+C`，脚本会保存当前 cursor。

## 说明

- 完整协议与 API 见上游仓库文档。
- 本示例仅供学习，使用前请遵守微信 / 平台相关要求。
