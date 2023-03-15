const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const fs = require('fs');

decrypt();

function decrypt() {
  const encryptedText = fs.readFileSync('./data/response.txt', 'utf-8');
  const iv = fs.readFileSync('./data/iv.txt', 'utf-8');
  const key = '322b63a3be0567ae7cae7a2f368ee38a';

  const decryptedStr = decryptAESByCryptoJS(encryptedText, iv, key);

  const decrypt2 = decryptAESbyCrypto(encryptedText, iv, key);

  console.assert(decryptedStr === decrypt2);

  let res;
  try {
    res = JSON.stringify(JSON.parse(decryptedStr), null, '  ');
  } catch (e) {
    res = decryptedStr;
  }

  fs.writeFileSync('./data/decrypted-str.json', res, {
    encoding: 'utf-8',
  });

  console.log('decrypt finished');
}

// 使用 crypto-js 解密
function decryptAESByCryptoJS(response, iv, key) {
  return (
    (key = CryptoJS.enc.Utf8.parse(key)),
      (iv = CryptoJS.MD5(iv).toString().substr(8, 16)),
      (iv = CryptoJS.enc.Utf8.parse(iv)),
      CryptoJS.AES.decrypt(response, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }).toString(CryptoJS.enc.Utf8)
  );
}

// 使用 node 内置的 crypto 模块解密 AES
function decryptAESbyCrypto(response, iv, key) {
  const ivDigest = crypto.createHash('md5').update(iv).digest().toString('hex');

  const ivBuf = Buffer.from(ivDigest.substr(8, 16), 'utf-8');
  const keyBuf = Buffer.from(key, 'utf-8');

  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuf, ivBuf);

  const mode = 1;

  if (mode === 1) {
    // 写法1：手动转换成Buffer后执行解密，再将结果编码成 utf8
    const responseBuf = Buffer.from(response, 'base64');  // 注意这里要用base64，因为一般网络传输加密后的数据会时默认会使用base64编码得到密文字符串
    let decryptedBufArr = [];
    decryptedBufArr.push(decipher.update(responseBuf));
    decryptedBufArr.push(decipher.final());
    const decryptedBuf = Buffer.concat(decryptedBufArr);
    return decryptedBuf.toString('utf8');
  } else if (mode === 2) {
    // 写法2：在解密是传入字符串和对应编码
    let decrypted = decipher.update(response, 'base64', 'utf8'); // 密文使用base64解码，解密结果使用utf8编码
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
