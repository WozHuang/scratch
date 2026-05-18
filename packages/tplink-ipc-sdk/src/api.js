import axios from 'axios'
import { encryptPassword } from './auth.js'

export class TPIPCApiError extends Error {
  constructor(message, errorCode = null, response = null) {
    super(message)
    this.name = 'TPIPCApiError'
    this.errorCode = errorCode
    this.response = response
  }
}

export class TPLinkIPCApiClient {
  static PAYLOAD_GET_LENSMASK = { method: 'get', lens_mask: { name: ['lens_mask_info'] } }
  static PAYLOAD_SET_LENSMASK_ON = { method: 'set', lens_mask: { lens_mask_info: { enabled: 'on' } } }
  static PAYLOAD_SET_LENSMASK_OFF = { method: 'set', lens_mask: { lens_mask_info: { enabled: 'off' } } }

  constructor(host, username, password) {
    if (host.includes('http')) {
      throw new Error("Hostname should not contain 'http://' or 'https://'")
    }
    this.baseUrl = `http://${host}`
    this.username = username
    this.password = password
    this.stok = null
    this.http = axios.create({ timeout: 10000 })
  }

  async _getAuthInfo() {
    const url = `${this.baseUrl}/pc/Content.htm`
    try {
      const response = await this.http.get(url, { timeout: 5000, validateStatus: () => true })
      const data = response.data
      const authData = data?.data ?? {}
      const nonce = authData.nonce
      const key = authData.key
      const encryptType = authData.encrypt_type

      if (!nonce) {
        const code = authData.code
        if (code === -40404) {
          const secLeft = authData.sec_left ?? 0
          throw new TPIPCApiError(`Device is locked due to too many failed attempts. Try again in ${secLeft} seconds.`, code, data)
        }
        throw new TPIPCApiError('Failed to get nonce from device.', null, data)
      }
      if (!key) {
        throw new TPIPCApiError('Failed to get public key from device.', null, data)
      }

      return {
        nonce,
        key: decodeURIComponent(key),
        encryptType,
      }
    } catch (err) {
      if (err instanceof TPIPCApiError) throw err
      throw new TPIPCApiError(`Network error while getting auth info: ${err.message}`)
    }
  }

  async _login() {
    const authInfo = await this._getAuthInfo()
    const { nonce, key, encryptType } = authInfo

    const { encrypted, encryptType: encryptTypeToUse } = encryptPassword(
      this.password,
      nonce,
      key,
      encryptType,
    )

    const payload = {
      method: 'do',
      login: {
        username: this.username,
        password: encrypted,
        encrypt_type: encryptTypeToUse,
      },
    }

    if (encryptTypeToUse === '3') {
      payload.login.md5_encrypt_type = '1'
    }

    try {
      const response = await this.http.post(`${this.baseUrl}/`, payload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'TP-LINK_APP',
        },
        validateStatus: () => true,
      })
      const data = response.data
      const stok = data?.stok
      if (!stok) {
        throw new TPIPCApiError("Login failed: 'stok' not found in response.", null, data)
      }
      this.stok = stok
    } catch (err) {
      if (err instanceof TPIPCApiError) throw err
      throw new TPIPCApiError(`Network error during login: ${err.message}`)
    }
  }

  async request(payload, retry = true) {
    if (!this.stok) {
      await this._login()
    }

    const url = `${this.baseUrl}/stok=${this.stok}/ds`
    try {
      const response = await this.http.post(url, payload, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'User-Agent': 'TP-LINK_APP',
        },
        validateStatus: () => true,
      })
      const data = response.data
      const errorCode = data?.error_code ?? 0

      if (errorCode === -40401 && retry) {
        this.stok = null
        return this.request(payload, false)
      }

      if (errorCode !== 0) {
        console.warn(`API returned error: ${JSON.stringify(data)}`)
      }

      return data
    } catch (err) {
      if (err instanceof TPIPCApiError) throw err
      throw new TPIPCApiError(`Network error during request: ${err.message}`)
    }
  }

  async getLensMaskStatus() {
    const result = await this.request(TPLinkIPCApiClient.PAYLOAD_GET_LENSMASK)
    const status = result?.lens_mask?.lens_mask_info?.enabled
    if (status === undefined || status === null) {
      throw new TPIPCApiError('Could not determine lens mask status from response.', null, result)
    }
    return status === 'on'
  }

  async setLensMaskOn() {
    return this.request(TPLinkIPCApiClient.PAYLOAD_SET_LENSMASK_ON)
  }

  async setLensMaskOff() {
    return this.request(TPLinkIPCApiClient.PAYLOAD_SET_LENSMASK_OFF)
  }

  async syncTime() {
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const payload = {
      method: 'do',
      system: {
        boot_set_date: {
          seconds_from_1970: currentTimestamp,
        },
      },
    }
    return this.request(payload)
  }
}
