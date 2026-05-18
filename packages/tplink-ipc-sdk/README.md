# @woz-scratch/tplink-ipc-sdk

TP-Link 摄像头 JS SDK，支持认证登录和镜头遮蔽控制。

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
import { TPLinkIPCApiClient } from '@woz-scratch/tplink-ipc-sdk'

const client = new TPLinkIPCApiClient('192.168.1.100', 'admin', 'your_password')

// 查询遮蔽状态
const isMasked = await client.getLensMaskStatus()
console.log(isMasked) // true: 已遮蔽, false: 未遮蔽

// 开启遮蔽（隐私模式，镜头被遮挡）
await client.setLensMaskOn()

// 关闭遮蔽（恢复正常拍摄）
await client.setLensMaskOff()

// 同步摄像头时间
await client.syncTime()
```

## API

### `new TPLinkIPCApiClient(host, username, password)`

| 参数 | 类型 | 说明 |
|------|------|------|
| host | string | 摄像头 IP 地址，不含 `http://` |
| username | string | 用户名，通常为 `admin` |
| password | string | 密码 |

### 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getLensMaskStatus()` | `Promise<boolean>` | 查询遮蔽状态，`true` 为已遮蔽 |
| `setLensMaskOn()` | `Promise<object>` | 开启遮蔽 |
| `setLensMaskOff()` | `Promise<object>` | 关闭遮蔽 |
| `syncTime()` | `Promise<object>` | 同步摄像头时间为当前系统时间 |

### 错误处理

```js
import { TPLinkIPCApiClient, TPIPCApiError } from '@woz-scratch/tplink-ipc-sdk'

try {
  await client.setLensMaskOn()
} catch (err) {
  if (err instanceof TPIPCApiError) {
    console.error('API 错误:', err.message)
    console.error('错误码:', err.errorCode)
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

| 包 | 用途 |
|----|------|
| `node-forge` | RSA 加密、MD5、ASN.1 解析 |
| `axios` | HTTP 请求 |
