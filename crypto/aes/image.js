const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const fs = require('fs');

const config = {
  originalFile: './data/encrypted-image.jpg',
  key: 'B2F3842866F9583D1ECE61C4E055C255',
  iv: 'E01EDE6331D37AFCC7BE05597D654D22',
};

// 读取密文 Buffer
let originalImgBuf = fs.readFileSync(config.originalFile);

// 使用 CryptoJS 解密
function decryptByCryptoJS(arraybuffer) {
  const key = config.key,
    iv = config.iv,
    wordArray = CryptoJS.lib.WordArray.create(arraybuffer);
  const keyBuf = CryptoJS.enc.Hex.parse(key)
  const ivBuf = CryptoJS.enc.Hex.parse(iv)
  return CryptoJS.AES.decrypt({ ciphertext: wordArray }, keyBuf, {
    iv: ivBuf,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
}
const decryptImgBuf = decryptByCryptoJS(originalImgBuf);
// 直接输出文件
fs.writeFileSync('./data/decrypted-crypto-js.jpg', Buffer.from(decryptImgBuf.toString(CryptoJS.enc.Hex), 'hex'));
// 解密后，以 base64 编码并插入网页
fs.writeFileSync(
  './data/decrypted-base64.html',
  `<img alt="bdyjy" src="data:image/jpg;base64,${decryptImgBuf.toString(CryptoJS.enc.Base64)}" />`
);

// 使用 NodeJS 的 crypto 模块解密并输出
const inStream = fs.createReadStream(config.originalFile);
const outStream = fs.createWriteStream('./data/decrypted-crypto.jpg');
const algorithm = 'aes-128-cbc';
const keyBuf = Buffer.from(config.key, 'hex');
const ivBuf = Buffer.from(config.iv, 'hex');
const cipher = crypto.createDecipheriv(algorithm, keyBuf, ivBuf);
inStream.pipe(cipher).pipe(outStream);
