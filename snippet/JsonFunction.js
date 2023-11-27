// 序列化一个带有函数的 JSON 对象
// 目前只保存了一个，有需要可以做进一步替换
// 自己实现的话参考：https://stackoverflow.com/questions/3685703/javascript-stringify-object-including-members-of-type-function
// 不自己实现的话直接用 serialize-javascript

const stringify = obj => {
  const fn = [];
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'function') {
      fn.push(value.toString());
      return `{{fn[${fn.length - 1}]}}`;
    }
    return value;
  }, '  ').replaceAll(/"{{fn\[(\d+)]}}"/g, (matched, idx) => fn[idx]);
}

const obj = {
  a: 1,
  b: function () {
    return 2;
  },
  c: {
    d: 3,
    e () {
      return 5;
    }
  }
};
console.log(stringify(obj));

const serialize = require('serialize-javascript');
console.log('\n\n', serialize(obj));
