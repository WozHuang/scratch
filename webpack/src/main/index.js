import $ from 'jquery';
// import './index.less';
// import(/* webpackChunkName: "E"  */ './other.extract.less'); // 单独的样式
// import './other.extract.less'; // 单独的样式
import cssText from '!css-loader!less-loader!./index.less';
import md from '../../readme.md';

console.log(md);

$(() => {
  console.log('11223344');
  const $div = document.createElement('div');
  $div.innerText = 'time:' + new Date().toLocaleTimeString();
  document.body.appendChild($div);

  $(document.body).append('<div>jquery</div>');
  $(document.body).append(`<div class="a"><p>cssText:</p><p><pre class="b">${cssText}</pre></p></div>`);
})