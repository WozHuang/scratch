import $ from 'jquery';

console.log('11223344');
const $div = document.createElement('div');
$div.innerText = '11223344';
document.body.appendChild($div);

$(document.body).append('<div>jquery</div>')
