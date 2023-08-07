import $ from 'jquery';
import './index.less';
import cssText from '!css-loader!less-loader!./index.less';

console.log('11223344');
const $div = document.createElement('div');
$div.innerText = 'time:' + new Date().toLocaleTimeString();
document.body.appendChild($div);

$(document.body).append('<div>jquery</div>');
$(document.body).append(`<div class="a"><p>cssText:</p><p><pre class="b">${cssText}</pre></p></div>`);
