import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';
import 'core-js/es/symbol';

console.log('Symbol.for', Symbol.for);
console.log(`u=Symbol.for("react.context")`, Symbol.for("react.context"));
// import ('./render');
require('./render');
import { Error } from './mobx';
//
// const e = new Error({});
// const a = {a:1};
// Object.assign(a, {b:2})
//
// console.log(a);
