import axios from 'axios';
import $ from 'jquery';

const url = 'http://192.168.202.37:9528/webadmin/v1/org/list:';
const data = { start: 0, limit: 10 };

const $form = $(`<form action="${url}">
    <input type="hidden" name="start" value="0">
    <input type="hidden" name="limit" value="10">
</form>`);

const $iframe = $(`<iframe></iframe>`).appendTo('body');
const $contents = $iframe.contents();

// $form.appendTo($contents.find('body'));
// ($form.get(0) as HTMLFormElement).submit();

// $form.appendTo($('body'));
// ($form.get(0) as HTMLFormElement).submit()
// $form.on('submit', function (e) {
//   e.preventDefault();
// })

// axios
//   .post(url, data, {
//     withCredentials: true
//   })
//   .then((res) => {
//     const pre = document.createElement('pre');
//     pre.innerText = JSON.stringify(res.data, null, '  ');
//     document.body.appendChild(pre);
//   })
//   .catch((e) => {
//     console.error(e);
//   });

axios
  .get(url, {
    withCredentials: true
  })
  .then((res) => {
    const pre = document.createElement('pre');
    pre.innerText = JSON.stringify(res.data, null, '  ');
    document.body.appendChild(pre);
  })
  .catch((e) => {
    console.error(e);
  });
