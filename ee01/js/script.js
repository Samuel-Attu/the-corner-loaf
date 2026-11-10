// The Corner Loaf: today panel
// Shows whether the shop is open and what is baking, on the first screen.
// It reads the weekly menu already in the page, so the menu is only written once.
(function () {
  var menuToggle = document.querySelector('.menu-toggle');
  var navigation = document.getElementById('primary-navigation');
  if (menuToggle && navigation) {
    var mobileNavigation = window.matchMedia('(max-width: 40rem)');

    function setNavigationMode() {
      menuToggle.hidden = !mobileNavigation.matches;
      menuToggle.setAttribute('aria-expanded', 'false');
      navigation.hidden = mobileNavigation.matches;
    }

    menuToggle.addEventListener('click', function () {
      var isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isExpanded));
      navigation.hidden = isExpanded;
    });

    navigation.addEventListener('click', function (event) {
      if (event.target.closest('a') && mobileNavigation.matches) {
        menuToggle.setAttribute('aria-expanded', 'false');
        navigation.hidden = true;
      }
    });

    mobileNavigation.addEventListener('change', setNavigationMode);
    setNavigationMode();
  }

  var panel = document.getElementById('today-panel');
  if (!panel) return;

  // Accra is UTC+0 all year with no daylight saving, so UTC time is Accra time.
  // Index 0 is Sunday. Each entry is [opens, closes] in 24-hour hours, or null.
  var HOURS = [null, [7, 17], [7, 17], [7, 17], [7, 17], [7, 17], [7, 14]];
  var IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function formatHour(h) {
    return (h % 12 || 12) + (h < 12 ? 'am' : 'pm');
  }

  function getState(now) {
    var day = now.getUTCDay();
    var mins = now.getUTCHours() * 60 + now.getUTCMinutes();
    var today = HOURS[day];

    if (today && mins < today[0] * 60) return { kind: 'before', day: day, opens: today[0] };
    if (today && mins < today[1] * 60) return { kind: 'open', day: day, closes: today[1] };

    for (var i = 1; i <= 7; i++) {
      var next = (day + i) % 7;
      if (HOURS[next]) return { kind: 'closed', day: next, opens: HOURS[next][0], daysAhead: i };
    }
    return null;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function render(state) {
    var section = document.getElementById(IDS[state.day]);
    var list = section && section.querySelector('.menu-list');
    var note = section && section.querySelector('.note');

    var status = el('p', 'today-status');
    var strong = el('strong');
    var rest = '';
    var title;

    if (state.kind === 'open') {
      status.className += ' is-open';
      strong.textContent = "We're open now";
      rest = ' until ' + formatHour(state.closes);
      title = "Today's bakes";
    } else if (state.kind === 'before') {
      status.className += ' is-before';
      strong.textContent = 'We open';
      rest = ' today at ' + formatHour(state.opens);
      title = "Today's bakes";
    } else {
      status.className += ' is-closed';
      var when = state.daysAhead === 1 ? 'tomorrow' : NAMES[state.day];
      strong.textContent = "We're closed";
      rest = '. Back ' + when + ' at ' + formatHour(state.opens);
      title = (state.daysAhead === 1 ? "Tomorrow's" : NAMES[state.day] + "'s") + ' bakes';
    }
    status.appendChild(strong);
    status.appendChild(el('span', 'today-status-detail', rest));

    var frag = document.createDocumentFragment();
    frag.appendChild(status);
    frag.appendChild(el('h2', 'today-title', title));

    if (list) {
      frag.appendChild(list.cloneNode(true));
      if (note) frag.appendChild(el('p', 'note', note.textContent));
    } else {
      frag.appendChild(el('p', 'note', 'See the weekly menu below.'));
    }

    var more = el('p', 'today-more');
    var link = el('a', '', "See the week's menu");
    link.href = '#menu';
    more.appendChild(link);
    frag.appendChild(more);

    panel.replaceChildren(frag);
  }

  var lastKey = '';
  function update() {
    var state = getState(new Date());
    if (!state) return;
    var key = state.kind + '-' + state.day;
    if (key === lastKey) return; // only redraw when something changes
    lastKey = key;
    render(state);
  }

  update();
  setInterval(update, 60 * 1000);
})();