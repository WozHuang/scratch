import $ from 'jquery';
import { injectGlobal } from '@emotion/css';

injectGlobal(`
.collapsible {
  border: 1px solid #ccc;
  margin: 20px;
}

.collapsible-button {
  background-color: #f1f1f1;
  border: none;
  padding: 10px;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.collapsible-content {
  height: 0;
  overflow: hidden;
  transition: height 0.3s ease-in-out;
}
`);

$(() => {
  $('#root').append(`
  <div class="collapsible">
    <button class="collapsible-button">点击折叠</button>
    <div class="collapsible-content">
      <p>这是可折叠的内容。</p>
    </div>
  </div>
    <p>其他的内容</p>
`);
  const $button = $('.collapsible-button');
  const $content = $('.collapsible-content');
  $button.on('click', () => {
    const height = $content.get(0)?.style.height;
    $content.css('height', height ? '' : `${$content[0]?.scrollHeight}px`);
  });
});
