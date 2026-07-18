import { config } from 'dotenv'
import { describe, it, expect, beforeAll } from 'vitest'
import { TPLinkIPCApiClient, TPIPCApiError } from '../src/api.js'

config()

const host = process.env.TPLINK_HOST
const user = process.env.TPLINK_USERNAME
const pass = process.env.TPLINK_PASSWORD

const skipIfNoEnv = !host || !user || !pass

describe.skipIf(skipIfNoEnv)('TPLinkIPCApiClient - 集成测试（需要真实设备）', () => {
  let client

  beforeAll(() => {
    client = new TPLinkIPCApiClient(host, user, pass)
  })

  it('应能登录并获取 stok', async () => {
    const result = await client.request({ method: 'get', lens_mask: { name: ['lens_mask_info'] } })
    expect(result).toBeDefined()
    expect(result.error_code).toBeDefined()
  })

  it('查询镜头遮蔽状态应返回 boolean', async () => {
    const status = await client.getLensMaskStatus()
    expect(typeof status).toBe('boolean')
  })

  it('开启遮蔽 → 查询确认为 true', async () => {
    await client.setLensMaskOn()
    const status = await client.getLensMaskStatus()
    expect(status).toBe(true)
  })

  it('关闭遮蔽 → 查询确认为 false', async () => {
    await client.setLensMaskOff()
    const status = await client.getLensMaskStatus()
    expect(status).toBe(false)
  })

  it('同步时间不应报错', async () => {
    const result = await client.syncTime()
    expect(result).toBeDefined()
  })
})

describe.skipIf(!skipIfNoEnv)('TPLinkIPCApiClient - 缺少 .env 配置', () => {
  it('跳过集成测试，请在 .env 中配置 TPLINK_HOST/TPLINK_USERNAME/TPLINK_PASSWORD', () => {
    console.warn('⚠️  缺少 .env 配置，集成测试已跳过。请复制 .env.example 为 .env 并填写真实信息。')
  })
})

describe('TPLinkIPCApiClient - 构造函数校验', () => {
  it('host 包含 http 时应抛出异常', () => {
    expect(() => new TPLinkIPCApiClient('http://192.168.1.1', 'admin', 'pass')).toThrow()
  })

  it('正常构造不应抛出异常', () => {
    expect(() => new TPLinkIPCApiClient('192.168.1.1', 'admin', 'pass')).not.toThrow()
  })
})

describe('TPLinkIPCApiClient - API 错误', () => {
  it('设备返回非零 error_code 时抛出 TPIPCApiError', async () => {
    const client = new TPLinkIPCApiClient('192.168.1.1', 'admin', 'pass')
    client.stok = 'test-stok'
    client.http.post = async () => ({ data: { error_code: -1 } })

    await expect(client.request({ method: 'get' })).rejects.toMatchObject({
      name: 'TPIPCApiError',
      errorCode: -1
    })
    await expect(client.request({ method: 'get' })).rejects.toBeInstanceOf(TPIPCApiError)
  })
})
