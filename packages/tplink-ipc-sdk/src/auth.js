import forge from 'node-forge'

const MAGIC_KEY = 'RDpbLfCPsJZ7fiv'
const MAGIC_TABLE = 'yLwVl0zKqws7LgKPRQ84Mdt708T1qQ3Ha7xv3H7NyU84p21BriUWBU43odz3iP4rBL3cD02KZciXTysVXiV8ngg6vL48rPJyAUw0HurW20xqxv9aYb4M9wK1Ae0wlro510qXeU07kV57fQMc8L6aLgMLwygtc0F10a0Dg70TOoouyFhdysuRMO51yY5ZlOZZLEal1h0t9YQW0Ko7oBwmCAHoic4HYbUyVeU3sfQ1xtXcPcf1aT303wAQhv66qzW'

/**
 * XOR 混淆算法，与 TP-Link WebUI JS 逻辑一致
 */
export function securityEncode(a, c, b) {
  let d = ''
  const f = a.length
  const g = c.length
  const h = b.length
  const e = Math.max(f, g)
  for (let l = 0; l < e; l++) {
    const k = l < f ? a.charCodeAt(l) : 187
    const m = l < g ? c.charCodeAt(l) : 187
    d += b[(k ^ m) % h]
  }
  return d
}

/**
 * 对原始密码做 XOR 混淆
 */
export function orgAuthPwd(password) {
  return securityEncode(password, MAGIC_KEY, MAGIC_TABLE)
}

/**
 * 自定义 Base64 编码（3 位 hex → 2 个 Base64 字符，与 TP-Link WebUI 一致）
 */
export function base64EncodeHex(hexStr) {
  const M = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const X = '='
  let d = ''
  let c = 0
  while (c + 3 <= hexStr.length) {
    const b = parseInt(hexStr.substring(c, c + 3), 16)
    d += M[b >> 6] + M[b & 63]
    c += 3
  }
  if (c + 1 === hexStr.length) {
    const b = parseInt(hexStr.substring(c, c + 1), 16)
    d += M[b << 2]
  } else if (c + 2 === hexStr.length) {
    const b = parseInt(hexStr.substring(c, c + 2), 16)
    d += M[b >> 2] + M[(b & 3) << 4]
  }
  while (d.length & 3) {
    d += X
  }
  return d
}

/**
 * 从 TP-Link DER 格式提取 RSA 公钥（宽容版本，支持非标准 161 字节格式）
 */
function extractTpLinkKey(keyBase64) {
  const derBytes = forge.util.decode64(keyBase64)
  const asn1 = forge.asn1.fromDer(derBytes)
  return forge.pki.publicKeyFromAsn1(asn1)
}

/**
 * RSA 加密，hex 长度必须为 64 的倍数，不满足则重新加密（最多 50 次）
 */
export function rsaEncryptTpLink(plainText, keyBase64) {
  const publicKey = extractTpLinkKey(keyBase64)
  const encrypted = publicKey.encrypt(plainText, 'RSAES-PKCS1-V1_5')
  let encryptedHex = forge.util.bytesToHex(encrypted)

  for (let i = 0; i < 50; i++) {
    if (encryptedHex.length % 64 === 0) {
      return base64EncodeHex(encryptedHex)
    }
    const reEncrypted = publicKey.encrypt(plainText, 'RSAES-PKCS1-V1_5')
    encryptedHex = forge.util.bytesToHex(reEncrypted)
  }

  return base64EncodeHex(encryptedHex)
}

/**
 * 密码加密入口，支持 type 2 (RSA) 和 type 3 (MD5)
 * @param {string} password
 * @param {string} nonce
 * @param {string} key - Base64 编码的 RSA 公钥
 * @param {string|string[]|null} encryptType
 * @returns {{ encrypted: string, encryptType: string }}
 */
export function encryptPassword(password, nonce, key, encryptType) {
  let encryptTypeToUse
  if (Array.isArray(encryptType)) {
    encryptTypeToUse = encryptType.includes('2') ? '2' : String(encryptType[0])
  } else {
    encryptTypeToUse = encryptType ? String(encryptType) : '3'
  }

  if (encryptTypeToUse === '2') {
    const orgPwd = orgAuthPwd(password)
    const plainText = `${orgPwd}:${nonce}`
    const encrypted = rsaEncryptTpLink(plainText, key)
    return { encrypted, encryptType: encryptTypeToUse }
  } else {
    const md = forge.md.md5.create()
    md.update(`${password}:${nonce}`)
    const encrypted = md.digest().toHex()
    return { encrypted, encryptType: encryptTypeToUse }
  }
}
