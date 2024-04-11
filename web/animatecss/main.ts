import $ from 'jquery';
import 'animate.css';

$(() => {
  $(document.body).append(
`<div>
  <button id="btn" style="margin-bottom: 30px">toggle</button>
  <div id="content" class="animate__animated animate__fadeInDown">12345</div>
</div>`
);
  $('#btn').on('click', () => {
    $('#content').toggleClass('animate__fadeInDown animate__fadeOutDown');
  });
});
