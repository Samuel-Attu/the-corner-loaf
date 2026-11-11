// The Corner Loaf: responsive navigation and live opening-hours panel.

(function initializeNavigation() {
  var menuToggle = document.querySelector('.menu-toggle');
  var navigation = document.getElementById('primary-navigation');
  if (!menuToggle || !navigation) return;

  // Keep this breakpoint in sync with the navigation media query in styles.css.
  var mobileNavigation = window.matchMedia('(max-width: 40rem)');

  function setNavigationMode() {
    var isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.hidden = !mobileNavigation.matches;
    navigation.hidden = mobileNavigation.matches && !isExpanded;
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
})();

(function initializeTodayPanel() {
  var panel = document.getElementById('today-panel');
  if (!panel) return;

  // Accra uses UTC year-round, so UTC getters give the local Accra time.
  // Index 0 is Sunday. Each entry is [opens, closes] in 24-hour hours, or null.
  var OPENING_HOURS = [null, [7, 17], [7, 17], [7, 17], [7, 17], [7, 17], [7, 14]];
  var DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function formatHour(hour) {
    return (hour % 12 || 12) + (hour < 12 ? 'am' : 'pm');
  }

  function getTodayState(now) {
    var day = now.getUTCDay();
    var minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    var todayHours = OPENING_HOURS[day];

    // The bakery opens at the opening minute and closes at the closing minute.
    if (todayHours && minutes < todayHours[0] * 60) {
      return { kind: 'before', day: day, opens: todayHours[0] };
    }
    if (todayHours && minutes < todayHours[1] * 60) {
      return { kind: 'open', day: day, closes: todayHours[1] };
    }

    for (var daysAhead = 1; daysAhead <= 7; daysAhead++) {
      var nextDay = (day + daysAhead) % 7;
      if (OPENING_HOURS[nextDay]) {
        return {
          kind: 'closed',
          day: nextDay,
          opens: OPENING_HOURS[nextDay][0],
          daysAhead: daysAhead
        };
      }
    }

    return { kind: 'closed-all-week' };
  }

  function createElement(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function render(state) {
    var section = state.day === undefined ? null : document.getElementById(DAY_IDS[state.day]);
    var menuList = section && section.querySelector('.menu-list');
    var note = section && section.querySelector('.note');
    var status = createElement('p', 'today-status');
    var strong = createElement('strong');
    var detail = '';
    var title;
    var menuLinkText;

    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');

    if (state.kind === 'open') {
      status.className += ' is-open';
      strong.textContent = "We're open now";
      detail = 'Closes at ' + formatHour(state.closes) + '.';
      title = "Today's bakes";
      menuLinkText = "View today's menu and pre-order";
    } else if (state.kind === 'before') {
      status.className += ' is-before';
      strong.textContent = "We're closed now";
      detail = 'We open today at ' + formatHour(state.opens) + '.';
      title = "Today's bakes";
      menuLinkText = "View today's menu and pre-order";
    } else if (state.kind === 'closed') {
      status.className += ' is-closed';
      strong.textContent = "We're closed now";
      var when = state.daysAhead === 1 ? 'tomorrow' : DAY_NAMES[state.day];
      detail = 'We reopen ' + when + ' at ' + formatHour(state.opens) + '.';
      title = (state.daysAhead === 1 ? "Tomorrow's" : DAY_NAMES[state.day] + "'s") + ' bakes';
      menuLinkText = "View " + when + "'s menu and pre-order";
    } else {
      status.className += ' is-closed';
      strong.textContent = "We're closed this week";
      detail = 'Please check back for updated hours.';
      title = "This week's bakes";
      menuLinkText = 'View the weekly menu';
    }

    status.appendChild(strong);
    status.appendChild(createElement('span', 'today-status-detail', detail));

    var fragment = document.createDocumentFragment();
    fragment.appendChild(status);
    fragment.appendChild(createElement('h2', 'today-title', title));

    if (menuList) {
      var itemNames = Array.prototype.map.call(menuList.querySelectorAll('.name'), function (item) {
        return item.textContent.trim();
      });
      if (itemNames.length) {
        var itemList = createElement('ul', 'today-items');
        itemNames.forEach(function (name) {
          itemList.appendChild(createElement('li', '', name));
        });
        fragment.appendChild(itemList);
      } else {
        fragment.appendChild(createElement('p', 'note', "Check the weekly menu for today's selection."));
      }
      if (note) fragment.appendChild(createElement('p', 'note', note.textContent));
    } else {
      fragment.appendChild(createElement('p', 'note', 'Check the weekly menu for the full selection.'));
    }

    var more = createElement('p', 'today-more');
    var link = createElement(
      'a',
      '',
      menuLinkText
    );
    link.href = state.day === undefined ? '#menu' : '#' + DAY_IDS[state.day];
    more.appendChild(link);
    fragment.appendChild(more);

    panel.replaceChildren(fragment);
  }

  var lastRenderedStateKey = '';
  function update() {
    var state = getTodayState(new Date());
    var stateKey = [
      state.kind,
      state.day === undefined ? '' : state.day,
      state.daysAhead || ''
    ].join('-');
    if (stateKey === lastRenderedStateKey) return;
    lastRenderedStateKey = stateKey;
    render(state);
  }

  var updateTimer = null;
  function startUpdates() {
    if (updateTimer === null && !document.hidden) {
      updateTimer = window.setInterval(update, 60 * 1000);
    }
  }

  function stopUpdates() {
    if (updateTimer !== null) {
      window.clearInterval(updateTimer);
      updateTimer = null;
    }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopUpdates();
    } else {
      update();
      startUpdates();
    }
  });
  window.addEventListener('pagehide', stopUpdates);
  window.addEventListener('pageshow', function () {
    update();
    startUpdates();
  });

  update();
  startUpdates();
})();
