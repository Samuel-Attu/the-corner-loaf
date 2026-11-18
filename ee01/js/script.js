// The Corner Loaf: responsive navigation, live opening-hours panel, slideshow, autofill forms, and scroll reveal.

(function initializeScrollReveal() {
  var elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.add('is-visible');
    }
    return;
  }

  document.documentElement.classList.add('js-ready');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -24px 0px'
  });

  elements.forEach(function (el) {
    observer.observe(el);
  });
})();

(function initializeNavigation() {
  var siteHeader = document.querySelector('.site-header');
  var menuToggle = document.querySelector('.menu-toggle');
  var navigation = document.getElementById('primary-navigation');
  if (!menuToggle || !navigation) return;

  // Keep this breakpoint in sync with the navigation media query in styles.css.
  var mobileNavigation = window.matchMedia('(max-width: 44rem)');

  function syncHeaderOffset() {
    if (!siteHeader) return;
    var height = siteHeader.offsetHeight;
    if (height > 0) {
      document.documentElement.style.setProperty('--header-offset', (height + 16) + 'px');
    }
  }

  function setNavigationMode() {
    var isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.hidden = !mobileNavigation.matches;
    navigation.hidden = mobileNavigation.matches && !isExpanded;
    syncHeaderOffset();
  }

  function closeMobileMenu(restoreFocus) {
    if (!mobileNavigation.matches) return;
    if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
    menuToggle.setAttribute('aria-expanded', 'false');
    navigation.hidden = true;
    if (restoreFocus) {
      menuToggle.focus();
    }
  }

  menuToggle.addEventListener('click', function () {
    var isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isExpanded));
    navigation.hidden = isExpanded;
  });

  navigation.addEventListener('click', function (event) {
    if (event.target.closest('a') && mobileNavigation.matches) {
      closeMobileMenu(false);
    }
  });

  navigation.addEventListener('keydown', function (event) {
    if (event.key === ' ' || event.key === 'Spacebar') {
      var link = event.target.closest('a');
      if (link) {
        event.preventDefault();
        link.click();
      }
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeMobileMenu(true);
    }
  });

  mobileNavigation.addEventListener('change', setNavigationMode);
  window.addEventListener('resize', syncHeaderOffset);
  setNavigationMode();
})();

(function initializeBakeCarousel() {
  var carousel = document.getElementById('bake-carousel');
  var prevBtn = document.getElementById('carousel-prev');
  var nextBtn = document.getElementById('carousel-next');
  var dotsContainer = document.getElementById('carousel-dots');
  if (!carousel || !prevBtn || !nextBtn) return;

  var slides = carousel.querySelectorAll('[data-slide]');
  var dots = dotsContainer ? dotsContainer.querySelectorAll('[data-slide-to]') : [];
  var total = slides.length;
  if (!total) return;

  var currentIndex = 0;
  var timer = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Autoplay pauses only while a mouse is over the carousel or a keyboard
  // user has focus inside it. Taps and clicks never pause it.
  var pausedByHover = false;
  var pausedByFocus = false;

  function showSlide(index) {
    currentIndex = (index + total) % total;
    for (var i = 0; i < total; i++) {
      var isActive = i === currentIndex;
      slides[i].hidden = !isActive;
      slides[i].classList.toggle('is-active', isActive);
      if (dots[i]) {
        dots[i].classList.toggle('is-active', isActive);
        if (isActive) {
          dots[i].setAttribute('aria-current', 'true');
        } else {
          dots[i].removeAttribute('aria-current');
        }
      }
    }
  }

  function stopAutoPlay() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function startAutoPlay() {
    if (reducedMotion.matches || document.hidden || timer !== null) return;
    if (pausedByHover || pausedByFocus) return;
    timer = window.setInterval(function () {
      showSlide(currentIndex + 1);
    }, 4500);
  }

  // After a manual change, give the new slide a full interval before advancing.
  function restartAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  // Mouse clicks and taps do not match :focus-visible; keyboard focus does.
  // Browsers without :focus-visible fall back to pausing on any focus.
  function isKeyboardFocus(element) {
    try {
      return element.matches(':focus-visible');
    } catch (error) {
      return true;
    }
  }

  prevBtn.addEventListener('click', function () {
    showSlide(currentIndex - 1);
    restartAutoPlay();
  });

  nextBtn.addEventListener('click', function () {
    showSlide(currentIndex + 1);
    restartAutoPlay();
  });

  if (dotsContainer) {
    dotsContainer.addEventListener('click', function (event) {
      var dot = event.target.closest('[data-slide-to]');
      if (!dot) return;
      var targetIndex = parseInt(dot.getAttribute('data-slide-to'), 10);
      if (!isNaN(targetIndex)) {
        showSlide(targetIndex);
        restartAutoPlay();
      }
    });
  }

  // pointerType filters out the fake mouse events touch screens send on tap.
  carousel.addEventListener('pointerenter', function (event) {
    if (event.pointerType !== 'mouse') return;
    pausedByHover = true;
    stopAutoPlay();
  });
  carousel.addEventListener('pointerleave', function (event) {
    if (event.pointerType !== 'mouse') return;
    pausedByHover = false;
    startAutoPlay();
  });
  carousel.addEventListener('focusin', function (event) {
    if (!isKeyboardFocus(event.target)) return;
    pausedByFocus = true;
    stopAutoPlay();
  });
  carousel.addEventListener('focusout', function (event) {
    if (!carousel.contains(event.relatedTarget)) {
      pausedByFocus = false;
      startAutoPlay();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  });

  reducedMotion.addEventListener('change', function () {
    if (reducedMotion.matches) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  });

  showSlide(0);
  startAutoPlay();
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

(function initializeFormsAndAutofill() {
  var STORAGE_KEY = 'corner_loaf_customer';
  var preorderName = document.getElementById('preorder-name');
  var preorderContact = document.getElementById('preorder-contact');
  var contactName = document.getElementById('contact-name');
  var contactEmail = document.getElementById('contact-email');

  function loadSavedCustomer() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCustomer(patch) {
    try {
      var current = loadSavedCustomer();
      var next = {
        name: patch.name !== undefined ? patch.name : (current.name || ''),
        tel: patch.tel !== undefined ? patch.tel : (current.tel || ''),
        email: patch.email !== undefined ? patch.email : (current.email || '')
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    } catch (e) {
      return {};
    }
  }

  function applySavedAutofill() {
    var saved = loadSavedCustomer();
    if (saved.name) {
      if (preorderName && !preorderName.value) preorderName.value = saved.name;
      if (contactName && !contactName.value) contactName.value = saved.name;
    }
    if (saved.tel && preorderContact && !preorderContact.value) {
      preorderContact.value = saved.tel;
    }
    if (saved.email && contactEmail && !contactEmail.value) {
      contactEmail.value = saved.email;
    }
  }

  if (preorderName && contactName) {
    preorderName.addEventListener('change', function () {
      var val = preorderName.value.trim();
      if (val) {
        saveCustomer({ name: val });
        if (!contactName.value) contactName.value = val;
      }
    });
    contactName.addEventListener('change', function () {
      var val = contactName.value.trim();
      if (val) {
        saveCustomer({ name: val });
        if (!preorderName.value) preorderName.value = val;
      }
    });
  }

  if (preorderContact) {
    preorderContact.addEventListener('change', function () {
      var val = preorderContact.value.trim();
      if (val) saveCustomer({ tel: val });
    });
  }

  if (contactEmail) {
    contactEmail.addEventListener('change', function () {
      var val = contactEmail.value.trim();
      if (val) saveCustomer({ email: val });
    });
  }

  // Pre-order form
  var preorderForm = document.getElementById('preorder-form');
  var itemSelect = document.getElementById('preorder-item');
  var quantityInput = document.getElementById('preorder-quantity');
  var daySelect = document.getElementById('preorder-day');
  var preorderStatus = document.getElementById('preorder-status');
  var resultsBox = document.getElementById('preorder-results');
  var list = document.getElementById('preorder-list');

  if (preorderForm && daySelect && itemSelect) {
    var DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function isBakedOnDay(itemValue, dayId) {
      if (!itemValue) return true;
      var section = document.getElementById(dayId);
      if (!section) return true;
      var names = section.querySelectorAll('.menu-list .name');
      if (!names.length) return false;
      var cleanItem = itemValue.split(' (')[0].trim().toLowerCase();
      for (var i = 0; i < names.length; i++) {
        if (names[i].textContent.trim().toLowerCase() === cleanItem) {
          return true;
        }
      }
      return false;
    }

    function populateCollectionDays() {
      var selectedItem = itemSelect.value.trim();
      var previousDay = daySelect.value;
      var now = new Date();
      var fragment = document.createDocumentFragment();
      var placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select collection date';
      fragment.appendChild(placeholder);

      var hasPreviousDay = false;

      for (var offset = 1; offset <= 7; offset++) {
        var target = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + offset
        ));
        var dayIndex = target.getUTCDay();
        if (dayIndex === 0) continue; // Closed on Sunday
        if (!isBakedOnDay(selectedItem, DAY_IDS[dayIndex])) continue;

        var dayName = DAY_NAMES[dayIndex];
        var dateLabel = target.getUTCDate() + ' ' + MONTHS[target.getUTCMonth()];
        var relativeLabel = offset === 1 ? 'Tomorrow' : 'in ' + offset + ' days';
        var optionValue = dayName + ', ' + dateLabel;
        var option = document.createElement('option');
        option.value = optionValue;
        option.setAttribute('data-day-id', DAY_IDS[dayIndex]);
        option.textContent = dayName + ', ' + dateLabel + ' (' + relativeLabel + ')';
        if (optionValue === previousDay) {
          hasPreviousDay = true;
        }
        fragment.appendChild(option);
      }

      daySelect.replaceChildren(fragment);
      if (hasPreviousDay) {
        daySelect.value = previousDay;
      }
    }

    populateCollectionDays();
    itemSelect.addEventListener('change', populateCollectionDays);

    var preorderFields = [itemSelect, quantityInput, daySelect, preorderName, preorderContact];
    preorderFields.forEach(function (field) {
      if (!field) return;
      field.addEventListener('input', function () {
        field.removeAttribute('aria-invalid');
      });
      field.addEventListener('change', function () {
        field.removeAttribute('aria-invalid');
      });
    });

    preorderForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var itemVal = itemSelect.value.trim();
      var qtyVal = parseInt(quantityInput.value, 10);
      var dayVal = daySelect.value.trim();
      var nameVal = preorderName.value.trim();
      var contactVal = preorderContact.value.trim();

      preorderFields.forEach(function (field) {
        if (field) field.removeAttribute('aria-invalid');
      });

      if (!itemVal) {
        itemSelect.setAttribute('aria-invalid', 'true');
        preorderStatus.className = 'form-status is-error';
        preorderStatus.textContent = 'Please select a bakery item to pre-order.';
        itemSelect.focus();
        return;
      }
      if (!qtyVal || qtyVal < 1) {
        quantityInput.setAttribute('aria-invalid', 'true');
        preorderStatus.className = 'form-status is-error';
        preorderStatus.textContent = 'Please enter a quantity of 1 or more.';
        quantityInput.focus();
        return;
      }
      if (!dayVal) {
        daySelect.setAttribute('aria-invalid', 'true');
        preorderStatus.className = 'form-status is-error';
        preorderStatus.textContent = 'Please select a collection date.';
        daySelect.focus();
        return;
      }
      if (!nameVal) {
        preorderName.setAttribute('aria-invalid', 'true');
        preorderStatus.className = 'form-status is-error';
        preorderStatus.textContent = 'Please enter your name so we can label your order.';
        preorderName.focus();
        return;
      }
      if (!contactVal) {
        preorderContact.setAttribute('aria-invalid', 'true');
        preorderStatus.className = 'form-status is-error';
        preorderStatus.textContent = 'Please enter a phone number so we can confirm your order.';
        preorderContact.focus();
        return;
      }

      saveCustomer({ name: nameVal, tel: contactVal });

      var entry = document.createElement('li');
      entry.textContent = nameVal + ' (' + contactVal + ') — ' + qtyVal + ' × ' + itemVal + ' for ' + dayVal;
      list.appendChild(entry);
      resultsBox.hidden = false;

      preorderStatus.className = 'form-status is-success';
      preorderStatus.textContent = 'Pre-order received for ' + nameVal + ': ' + qtyVal + ' × ' + itemVal + ' on ' + dayVal + '. We will be in touch to confirm your collection time.';
      itemSelect.value = '';
      populateCollectionDays();
      daySelect.value = '';
      quantityInput.value = '1';
      applySavedAutofill();
    });
  }

  // Contact form
  var contactForm = document.getElementById('contact-form');
  var messageInput = document.getElementById('contact-message');
  var contactStatus = document.getElementById('contact-status');

  if (contactForm && contactName && contactEmail && messageInput && contactStatus) {
    var contactFields = [contactName, contactEmail, messageInput];
    contactFields.forEach(function (field) {
      field.addEventListener('input', function () {
        field.removeAttribute('aria-invalid');
      });
    });

    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var nameVal = contactName.value.trim();
      var emailVal = contactEmail.value.trim();
      var messageVal = messageInput.value.trim();
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      contactFields.forEach(function (field) {
        field.removeAttribute('aria-invalid');
      });

      if (!nameVal) {
        contactName.setAttribute('aria-invalid', 'true');
        contactStatus.className = 'form-status is-error';
        contactStatus.textContent = 'Please enter your name.';
        contactName.focus();
        return;
      }
      if (!emailVal || !emailPattern.test(emailVal)) {
        contactEmail.setAttribute('aria-invalid', 'true');
        contactStatus.className = 'form-status is-error';
        contactStatus.textContent = 'Please enter a valid email address (for example, kofi@email.com).';
        contactEmail.focus();
        return;
      }
      if (!messageVal) {
        messageInput.setAttribute('aria-invalid', 'true');
        contactStatus.className = 'form-status is-error';
        contactStatus.textContent = 'Please enter your message before sending.';
        messageInput.focus();
        return;
      }

      saveCustomer({ name: nameVal, email: emailVal });

      contactStatus.className = 'form-status is-success';
      contactStatus.textContent = 'Thank you, ' + nameVal + '. Your message has been sent and we will reply to ' + emailVal + ' soon.';
      messageInput.value = '';
      applySavedAutofill();
    });
  }

  applySavedAutofill();
})();

(function resetScrollOnRefresh() {
  var navigationEntry = performance.getEntriesByType('navigation')[0];
  if (!navigationEntry || navigationEntry.type !== 'reload') return;

  window.history.scrollRestoration = 'manual';
  if (window.location.hash) {
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search
    );
  }

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) return;
    window.requestAnimationFrame(function () {
      window.scrollTo(0, 0);
    });
  });
})();
