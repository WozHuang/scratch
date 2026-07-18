# @woz-scratch/tplink-ipc-sdk

TP-Link 摄像头 JS SDK，支持认证登录和镜头遮蔽控制。

同时提供基于 Express 5 的多摄像头 HTTP 服务，可构建为本地 Docker 镜像并通过 Home Assistant REST Switch 控制隐私模式。

## 安装

```bash
npm install @woz-scratch/tplink-ipc-sdk
```

或直接引用本地路径：

```json
{
  "dependencies": {
    "@woz-scratch/tplink-ipc-sdk": "file:../hass-tplink-ipc/js-sdk"
  }
}
```

## 使用

```js
import { TPLinkIPCApiClient } from '@woz-scratch/tplink-ipc-sdk';

const client = new TPLinkIPCApiClient('192.168.1.100', 'admin', 'your_password');

// 查询遮蔽状态
const isMasked = await client.getLensMaskStatus();
console.log(isMasked); // true: 已遮蔽, false: 未遮蔽

// 开启遮蔽（隐私模式，镜头被遮挡）
await client.setLensMaskOn();

// 关闭遮蔽（恢复正常拍摄）
await client.setLensMaskOff();

// 同步摄像头时间
await client.syncTime();
```

## API

### `new TPLinkIPCApiClient(host, username, password)`

| 参数     | 类型   | 说明                           |
| -------- | ------ | ------------------------------ |
| host     | string | 摄像头 IP 地址，不含 `http://` |
| username | string | 用户名，通常为 `admin`         |
| password | string | 密码                           |

### 方法

| 方法                  | 返回值             | 说明                          |
| --------------------- | ------------------ | ----------------------------- |
| `getLensMaskStatus()` | `Promise<boolean>` | 查询遮蔽状态，`true` 为已遮蔽 |
| `setLensMaskOn()`     | `Promise<object>`  | 开启遮蔽                      |
| `setLensMaskOff()`    | `Promise<object>`  | 关闭遮蔽                      |
| `syncTime()`          | `Promise<object>`  | 同步摄像头时间为当前系统时间  |

### 错误处理

```js
import { TPLinkIPCApiClient, TPIPCApiError } from '@woz-scratch/tplink-ipc-sdk';

try {
  await client.setLensMaskOn();
} catch (err) {
  if (err instanceof TPIPCApiError) {
    console.error('API 错误:', err.message);
    console.error('错误码:', err.errorCode);
  }
}
```

## CLI

项目内也提供了命令行工具，需要配置 `.env` 文件：

```bash
cp .env.example .env
# 编辑 .env 填入 TPLINK_HOST、TPLINK_USERNAME、TPLINK_PASSWORD
```

```bash
# 查看遮蔽状态
node src/cli.js status

# 开启遮蔽
node src/cli.js on

# 关闭遮蔽
node src/cli.js off
```

或通过 npm scripts：

```bash
npm run mask:status
npm run mask:on
npm run mask:off
```

## Home Assistant Docker 服务

### 1. 准备配置

```bash
cd packages/tplink-ipc-sdk
cp cameras.example.json cameras.json
cp docker-compose.example.yml docker-compose.yml
```

编辑 `cameras.json`。每台摄像头需要唯一的 `id`，`host` 只填写 IP 或主机名，不包含协议：

```json
{
  "cameras": [
    {
      "id": "living_room",
      "name": "客厅摄像头",
      "host": "192.168.1.100",
      "username": "admin",
      "password": "camera-password"
    }
  ]
}
```

创建 `.env` 并设置服务访问令牌：

```dotenv
TPLINK_IPC_API_TOKEN=replace-with-a-long-random-token
```

### 2. 加入 Home Assistant 网络

查看 Home Assistant 使用的网络：

```bash
docker network ls
docker inspect homeassistant --format '{{json .NetworkSettings.Networks}}'
```

如果网络名不是 `homeassistant`，修改 `docker-compose.yml` 中 `networks.homeassistant.name`。服务没有配置宿主机端口映射，只能由同一 Docker 网络内的容器通过 `http://tplink-ipc:3000` 访问。

### 3. 构建并启动

```bash
docker compose build tplink-ipc
docker compose up -d tplink-ipc
docker compose ps
docker compose logs tplink-ipc
```

容器健康检查只访问 `/healthz`，不会登录摄像头。

### 4. 配置 Home Assistant

在 Home Assistant 的 `secrets.yaml` 中保存认证头，令牌与 `.env` 一致：

```yaml
tplink_ipc_authorization: 'Bearer replace-with-a-long-random-token'
```

将 `home-assistant.example.yaml` 中的开关配置合并到 `configuration.yaml`。多台摄像头复制开关条目，并替换名称以及 URL 中的摄像头 `id`。完成后检查配置并重启 Home Assistant。

### HTTP API

| 方法   | 路径                         | 鉴权         | 说明                                                          |
| ------ | ---------------------------- | ------------ | ------------------------------------------------------------- |
| `GET`  | `/healthz`                   | 否           | 服务健康状态，不访问摄像头                                    |
| `GET`  | `/api/cameras/:id/lens-mask` | Bearer Token | 查询隐私模式                                                  |
| `POST` | `/api/cameras/:id/lens-mask` | Bearer Token | 使用 `{"enabled":true}` 或 `{"enabled":false}` 设置并确认状态 |

除健康检查外，所有接口都需要 `Authorization: Bearer <token>`。服务启动时会校验配置；配置或 `API_TOKEN` 无效时，容器直接退出且不会输出凭据。

## 测试

```bash
npm install

# 单元测试（不需要设备）
npm run test:auth

# 集成测试（需要 .env 配置真实设备信息）
npm run test:api

# 全部测试
npm test
```

## 依赖

| 包           | 用途                      |
| ------------ | ------------------------- |
| `node-forge` | RSA 加密、MD5、ASN.1 解析 |
| `axios`      | HTTP 请求                 |
| `express`    | Home Assistant HTTP 服务  |
