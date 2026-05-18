import { describe, it, expect } from 'vitest'
import {
  securityEncode,
  orgAuthPwd,
  base64EncodeHex,
  encryptPassword,
} from '../src/auth.js'

describe('securityEncode', () => {
  it('should XOR encode with magic key and table', () => {
    const result = securityEncode('test', 'RDpbLfCPsJZ7fiv', 'yLwVl0zKqws7LgKPRQ84Mdt708T1qQ3Ha7xv3H7NyU84p21BriUWBU43odz3iP4rBL3cD02KZciXTysVXiV8ngg6vL48rPJyAUw0HurW20xqxv9aYb4M9wK1Ae0wlro510qXeU07kV57fQMc8L6aLgMLwygtc0F10a0Dg70TOoouyFhdysuRMO51yY5ZlOZZLEal1h0t9YQW0Ko7oBwmCAHoic4HYbUyVeU3sfQ1xtXcPcf1aT303wAQhv66qzW')
    expect(typeof result).toBe('string')
    expect(result.length).toBe(15)
  })

  it('should handle password longer than key', () => {
    const longPwd = 'a'.repeat(20)
    const result = securityEncode(longPwd, 'abc', 'xyz')
    expect(result.length).toBe(20)
  })

  it('should handle key longer than password', () => {
    const result = securityEncode('a', 'abcdefghijklmnop', 'xyz')
    expect(result.length).toBe(16)
  })
})

describe('orgAuthPwd', () => {
  it('should return a string of same length as max(password, magicKey)', () => {
    const result = orgAuthPwd('admin123')
    expect(typeof result).toBe('string')
    expect(result.length).toBe(15)
  })

  it('should match Python org_auth_pwd output', () => {
    const result = orgAuthPwd('admin123')
    expect(result).toBe('WaQ7x6b09TefbwK')
  })

  it('should be deterministic', () => {
    const a = orgAuthPwd('mypassword')
    const b = orgAuthPwd('mypassword')
    expect(a).toBe(b)
  })

  it('should produce different output for different inputs', () => {
    const a = orgAuthPwd('password1')
    const b = orgAuthPwd('password2')
    expect(a).not.toBe(b)
  })
})

describe('base64EncodeHex', () => {
  it('should encode 2-char hex', () => {
    // 'ab' hex = 0xab = 171, 171>>2=42, (171&3)<<4=48 → M[42]='q', M[48]='w'
    const result = base64EncodeHex('ab')
    expect(result).toBe('qw==')
  })

  it('should encode 3-char hex', () => {
    // 'abc' hex = 0xabc = 2748, 2748>>6=42, 2748&63=60 → M[42]='q', M[60]='8'
    const result = base64EncodeHex('abc')
    expect(result).toBe('q8==')
  })

  it('should encode 6-char hex', () => {
    // 'abcdef' → loop: 'abc'→'q8', 'def'→'3v' → total 'q83v'
    const result = base64EncodeHex('abcdef')
    expect(result).toBe('q83v')
    expect(result.length % 4).toBe(0)
  })

  it('should produce valid base64-like output length', () => {
    // 'aabbccdd' → loop: 'aab'→'qr', 'bcc'→'vM', remaining 'dd' → '3Q==' → total 'qrvM3Q=='
    const result = base64EncodeHex('aabbccdd')
    expect(result).toBe('qrvM3Q==')
    expect(result.length % 4).toBe(0)
  })
})

describe('encryptPassword', () => {
  const nonce = 'test_nonce_123'
  const password = 'admin'

  it('should return MD5 hex for type 3', () => {
    const { encrypted, encryptType } = encryptPassword(password, nonce, '', '3')
    expect(encryptType).toBe('3')
    expect(encrypted).toMatch(/^[0-9a-f]{32}$/)
  })

  it('should return MD5 hex for type 3 (default)', () => {
    const { encrypted, encryptType } = encryptPassword(password, nonce, '', null)
    expect(encryptType).toBe('3')
    expect(encrypted).toMatch(/^[0-9a-f]{32}$/)
  })

  it('MD5 type 3 should match Python hashlib output', () => {
    const { encrypted } = encryptPassword('admin', 'test_nonce_123', '', '3')
    expect(encrypted).toBe('e44647be1e3b98d12b12a6e6730a92e5')
  })

  it('should return same MD5 for same inputs', () => {
    const a = encryptPassword(password, nonce, '', '3')
    const b = encryptPassword(password, nonce, '', '3')
    expect(a.encrypted).toBe(b.encrypted)
  })

  it('should return different MD5 for different passwords', () => {
    const a = encryptPassword('pass1', nonce, '', '3')
    const b = encryptPassword('pass2', nonce, '', '3')
    expect(a.encrypted).not.toBe(b.encrypted)
  })

  it('should pick type 2 from array if available', () => {
    // type 2 needs a real RSA key, so we just verify the routing logic
    // by checking that it throws when key is invalid (proves it went down type 2 path)
    expect(() => {
      encryptPassword(password, nonce, 'invalid_key', ['2', '3'])
    }).toThrow()
  })

  it('should fall back to first element if type 2 not in array', () => {
    const { encryptType } = encryptPassword(password, nonce, '', ['3'])
    expect(encryptType).toBe('3')
  })
})
