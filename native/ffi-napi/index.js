const ffi = require('ffi-napi');
const ref = require('ref-napi');
const iconvLite = require('iconv-lite');

const user32 = new ffi.Library('user32', {
  FindWindowA: ['int32', ['string', 'string']],
  FindWindowW: ['int32', ['string', 'string']],
  FindWindowExW: ['int', ['string', 'string']],
  GetWindowTextA: ['int', ['int', 'string', 'int']],
  GetWindowTextW: ['int', ['int', 'string', 'int']],
  GetWindowTextLengthW: ['int', ['int']],
  GetWindowTextLengthA: ['int', ['int']],
  EnumWindows: ['bool', [ref.refType(ref.types.void), 'int32']]
});

function findAndLog() {
  const handle = user32.FindWindowA(
    null,
    iconvLite.encode('电池指示器', 'gbk')
  );
  // 这个 handle2 时好时不好的就很诡异。。。
  const handle2 = user32.FindWindowW(
    null,
    Buffer.from('电池指示器', 'utf16le')
  );
  console.log('handle:', handle);
  console.log('handle2:', handle2);
  logTextA(handle);
  logTextW(handle);
}

function logTextA(hwnd) {
  const bufA = Buffer.alloc(255);
  // const lenA = user32.GetWindowTextLengthA(hwnd);
  const lenA = user32.GetWindowTextA(hwnd, bufA, 255);
  // console.log('GetWindowTextA-CString', ref.readCString(bufA, 0));
  if (bufA[0] === 0) return;
  console.log('GetWindowTextA-GBK', toGBK(bufA.subarray(0, lenA)));
  return bufA;
}

function logTextW(hwnd) {
  const bufW = Buffer.alloc(255);
  const lenW = user32.GetWindowTextLengthW(hwnd);
  const lenW2 = user32.GetWindowTextW(hwnd, bufW, lenW + 1);
  if (bufW[0] === 0) return;
  const subBuf = bufW.subarray(0, lenW * 2);
  console.log('GetWindowTextW-utf16', iconvLite.decode(subBuf, 'utf16'));
  console.log('GetWindowTextW-utf16le', subBuf.toString('utf16le'));
  return bufW;
}

const windowProc = ffi.Callback(
  'bool',
  ['long', 'int32'],
  function (hwnd, lParam) {
    const bufA = logTextA(hwnd);
    const bufW = logTextW(hwnd);
    bufA && console.log('----------------------------');
    return true;
  }
);

/**
 * @param buf {Buffer}
 */
function toGBK(buf) {
  return iconvLite.decode(buf, 'gbk');
}

(function main() {
  findAndLog();
  let r2 = user32.EnumWindows(windowProc, 0);
  process.exit(0);
})();
