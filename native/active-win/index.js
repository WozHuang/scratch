/**
 * 使用 active-win 获取当前窗口
 */

const activeWindow = require('active-win');

const main =async () => {
  const options = {};
  console.log(await activeWindow(options));
}

setTimeout(main, 1000);
