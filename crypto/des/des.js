const CryptoJS = require("crypto-js");

// CryptoJS自动添加的密文后缀，对应原文后缀 '0808080808080808'
const postfixHexText = "f391dd89b1736b72";

function encryptByDES(message, key) {
  const keyHex = CryptoJS.enc.Hex.parse(key);
  const messageHex = CryptoJS.enc.Hex.parse(message);
  const encrypted = CryptoJS.DES.encrypt(messageHex, keyHex, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  const encryptedHex = encrypted.ciphertext.toString();
  return encryptedHex.substring(0, encryptedHex.length - postfixHexText.length)
}

function decryptByDES(cipherText, key) {
  const keyHex = CryptoJS.enc.Hex.parse(key);
  const cipherTextHex = CryptoJS.enc.Hex.parse(cipherText + postfixHexText);
  const decrypted = CryptoJS.DES.decrypt({
    ciphertext: cipherTextHex
  }, keyHex, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypted.toString(CryptoJS.enc.Hex);
}

const message = '1234800000000000';
const key = '9955551111555599';

const ciphertext = encryptByDES(message, key);
const plaintext = decryptByDES(ciphertext, key);

console.log('原文：', message)
console.log('密钥：', key)
console.log('密文：', ciphertext)
console.log('密文解密：', plaintext)
