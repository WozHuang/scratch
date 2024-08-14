import $ from 'jquery';
import moment from 'moment';
import './style.css';

$(() => {
  $(document.body).append(
    `
    <div class="calendar">
        <div class="header">
            <button id="prevMonth">Previous</button>
            <h2 id="monthYear"></h2>
            <button id="nextMonth">Next</button>
        </div>
        <div class="weekdays">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
        </div>
        <div class="days" id="days"></div>
    </div>
`
  );

  const $daysElement = $('#days');
  const $monthYearElement = $('#monthYear');
  const $prevMonthButton = $('#prevMonth');
  const $nextMonthButton = $('#nextMonth');

  let currentDate = moment();

  function renderCalendar(date: moment.Moment) {
    $daysElement.empty();
    $monthYearElement.text(date.format('MMMM YYYY'));

    const startOfMonth = date.clone().startOf('month');
    const endOfMonth = date.clone().endOf('month');
    const startOfWeek = startOfMonth.clone().startOf('week');
    const endOfWeek = endOfMonth.clone().endOf('week');

    let day = startOfWeek.clone();

    while (day.isBefore(endOfWeek, 'day')) {
      const $day = $('<div></div>').text(day.date());
      if (day.month() !== date.month()) {
        $day.addClass(day.isBefore(startOfMonth, 'day') ? 'prev-month' : 'next-month');
      }
      $daysElement.append($day);
      day.add(1, 'day');
    }
  }

  $prevMonthButton.on('click', function() {
    currentDate.subtract(1, 'month');
    renderCalendar(currentDate);
  });

  $nextMonthButton.on('click', function() {
    currentDate.add(1, 'month');
    renderCalendar(currentDate);
  });

  renderCalendar(currentDate);
});
