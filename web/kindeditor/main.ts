import $ from 'jquery';

$(() => {
  $.getScript('./node_modules/kindeditor/kindeditor-all.js', () => {
    // @ts-ignore
    window.KindEditor.create($('#root').get(0), {
      basePath: './node_modules/kindeditor/',
    });
  });
});
