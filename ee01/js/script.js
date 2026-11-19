// @ts-check
/**
 * The Corner Loaf: responsive navigation, live opening-hours panel,
 * accessible bake carousel, autofill pre-order/contact forms, and scroll controls.
 */

/**
 * @typedef {Object} TodayState
 * @property {'open' | 'before' | 'closed' | 'closed-all-week'} kind
 * @property {number} [day] Day index (0 = Sunday, 6 = Saturday) in Accra/UTC time.
 * @property {number} [opens] Opening hour in 24-hour format.
 * @property {number} [closes] Closing hour in 24-hour format.
 * @property {number} [daysAhead] Number of days until the bakery reopens.
 */

/**
 * @typedef {Object} SavedCustomer
 * @property {string} [name]
 * @property {string} [tel]
 * @property {string} [email]
 */

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
  /** @type {HTMLElement | null} */
  var siteHeader = document.querySelector('.site-header');
  /** @type {HTMLButtonElement | null} */
  var menuToggle = document.querySelector('.menu-toggle');
  var navigation = document.getElementById('primary-navigation');
  if (!menuToggle || !navigation) return;

  // Keep this breakpoint in sync with the navigation media query in styles.css.
  var mobileNavigation = window.matchMedia('(max-width: 44rem)');

  /**
   * Synchronizes the CSS `--header-offset` custom property with the rendered
   * sticky header height so in-page anchor targets clear the header cleanly.
   * @returns {void}
   */
  function syncHeaderOffset() {
    if (!siteHeader) return;
    var height = siteHeader.offsetHeight;
    if (height > 0) {
      document.documentElement.style.setProperty('--header-offset', (height + 16) + 'px');
    }
  }

  /**
   * Updates toggle and navigation visibility for mobile vs. desktop viewports.
   * @returns {void}
   */
  function setNavigationMode() {
    var isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.hidden = !mobileNavigation.matches;
    navigation.hidden = mobileNavigation.matches && !isExpanded;
    syncHeaderOffset();
  }

  /**
   * Closes the mobile disclosure menu and optionally restores focus to its trigger.
   * @param {boolean} restoreFocus Whether to move keyboard focus back to `.menu-toggle`.
   * @returns {void}
   */
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
    var target = /** @type {HTMLElement | null} */ (event.target);
    if (target && target.closest('a') && mobileNavigation.matches) {
      closeMobileMenu(false);
    }
  });

  navigation.addEventListener('keydown', function (event) {
    if (event.key === ' ' || event.key === 'Spacebar') {
      var target = /** @type {HTMLElement | null} */ (event.target);
      var link = target ? /** @type {HTMLAnchorElement | null} */ (target.closest('a')) : null;
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
  var toggleBtn = document.getElementById('carousel-toggle');
  var dotsContainer = document.getElementById('carousel-dots');
  if (!carousel || !prevBtn || !nextBtn) return;

  /** @type {NodeListOf<HTMLElement>} */
  var slides = carousel.querySelectorAll('[data-slide]');
  /** @type {NodeListOf<HTMLButtonElement> | never[]} */
  var dots = dotsContainer ? dotsContainer.querySelectorAll('[data-slide-to]') : [];
  var total = slides.length;
  if (!total) return;

  var currentIndex = 0;
  /** @type {number | null} */
  var timer = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pausedByUser = reducedMotion.matches;
  var pausedByHover = false;
  var pausedByFocus = false;

  /**
   * Updates the Pause/Play button state and icons to reflect `pausedByUser`.
   * @returns {void}
   */
  function syncToggleButton() {
    if (!toggleBtn) return;
    var pauseIcon = toggleBtn.querySelector('.icon-pause');
    var playIcon = toggleBtn.querySelector('.icon-play');
    toggleBtn.setAttribute('aria-pressed', String(pausedByUser));
    toggleBtn.setAttribute('aria-label', pausedByUser ? 'Play slide rotation' : 'Pause slide rotation');
    if (pauseIcon) pauseIcon.toggleAttribute('hidden', pausedByUser);
    if (playIcon) playIcon.toggleAttribute('hidden', !pausedByUser);
  }

  /**
   * Displays the slide at `index` (wrapping modulo `total`) and syncs dot indicators.
   * @param {number} index Target slide index.
   * @returns {void}
   */
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

  /**
   * Stops the automatic slide advance interval if active.
   * @returns {void}
   */
  function stopAutoPlay() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  /**
   * Starts automatic slide rotation when not paused by user, hover, focus,
   * document visibility, or `prefers-reduced-motion`.
   * @returns {void}
   */
  function startAutoPlay() {
    if (reducedMotion.matches || document.hidden || timer !== null) return;
    if (pausedByUser || pausedByHover || pausedByFocus) return;
    timer = window.setInterval(function () {
      showSlide(currentIndex + 1);
    }, 4500);
  }

  /**
   * Resets the rotation timer after a manual slide change.
   * @returns {void}
   */
  function restartAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  /**
   * Returns true when `element` has keyboard-driven focus (`:focus-visible`).
   * @param {EventTarget | null} element Focused element.
   * @returns {boolean}
   */
  function isKeyboardFocus(element) {
    if (!(element instanceof Element)) return false;
    try {
      return element.matches(':focus-visible');
    } catch (_error) {
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

  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      pausedByUser = !pausedByUser;
      syncToggleButton();
      if (pausedByUser) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });
  }

  if (dotsContainer) {
    dotsContainer.addEventListener('click', function (event) {
      var target = /** @type {HTMLElement | null} */ (event.target);
      var dot = target ? target.closest('[data-slide-to]') : null;
      if (!dot) return;
      var targetIndex = parseInt(dot.getAttribute('data-slide-to') || '', 10);
      if (!isNaN(targetIndex)) {
        showSlide(targetIndex);
        restartAutoPlay();
      }
    });
  }

  // pointerType filters out synthetic mouse events fired by touch screens on tap.
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
    var related = /** @type {Node | null} */ (event.relatedTarget);
    if (!carousel.contains(related)) {
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
  window.addEventListener('pagehide', stopAutoPlay);
  window.addEventListener('pageshow', startAutoPlay);

  reducedMotion.addEventListener('change', function () {
    pausedByUser = reducedMotion.matches;
    syncToggleButton();
    if (pausedByUser) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  });

  syncToggleButton();
  showSlide(0);
  startAutoPlay();
})();

(function initializeTodayPanel() {
  var panel = document.getElementById('today-panel');
  if (!panel) return;

  // Accra uses UTC year-round, so UTC getters give the local Accra time.
  // Index 0 is Sunday. Each entry is [opens, closes] in 24-hour hours, or null.
  /** @type {Array<[number, number] | null>} */
  var OPENING_HOURS = [null, [7, 17], [7, 17], [7, 17], [7, 17], [7, 17], [7, 14]];
  var DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  /**
   * Formats a 24-hour integer into 12-hour clock text (e.g., `17` -> `'5pm'`).
   * @param {number} hour Hour in 0..23 range.
   * @returns {string}
   */
  function formatHour(hour) {
    return (hour % 12 || 12) + (hour < 12 ? 'am' : 'pm');
  }

  /**
   * Computes the current open/closed status and target baking day for Accra time.
   * @param {Date} now Current timestamp.
   * @returns {TodayState}
   */
  function getTodayState(now) {
    var day = now.getUTCDay();
    var minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    var todayHours = OPENING_HOURS[day];

    // Opening minute is inclusive (>= opens); closing minute is exclusive (< closes).
    if (todayHours && minutes < todayHours[0] * 60) {
      return { kind: 'before', day: day, opens: todayHours[0] };
    }
    if (todayHours && minutes < todayHours[1] * 60) {
      return { kind: 'open', day: day, closes: todayHours[1] };
    }

    for (var daysAhead = 1; daysAhead <= 7; daysAhead++) {
      var nextDay = (day + daysAhead) % 7;
      var nextHours = OPENING_HOURS[nextDay];
      if (nextHours) {
        return {
          kind: 'closed',
          day: nextDay,
          opens: nextHours[0],
          daysAhead: daysAhead
        };
      }
    }

    return { kind: 'closed-all-week' };
  }

  /**
   * Creates an HTML element with optional class name and text content.
   * @template {keyof HTMLElementTagNameMap} K
   * @param {K} tag HTML tag name.
   * @param {string} [className] Optional CSS class name.
   * @param {string} [text] Optional textContent.
   * @returns {HTMLElementTagNameMap[K]}
   */
  function createElement(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /**
   * Renders the `#today-panel` status banner, today's/next day's bakes, and jump link.
   * @param {TodayState} state Current bakery schedule state.
   * @returns {void}
   */
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

    if (state.kind === 'open' && state.closes !== undefined) {
      status.className += ' is-open';
      strong.textContent = "We're open now";
      detail = 'Closes at ' + formatHour(state.closes) + '.';
      title = "Today's bakes";
      menuLinkText = "View today's menu and pre-order";
    } else if (state.kind === 'before' && state.opens !== undefined) {
      status.className += ' is-before';
      strong.textContent = "We're closed now";
      detail = 'We open today at ' + formatHour(state.opens) + '.';
      title = "Today's bakes";
      menuLinkText = "View today's menu and pre-order";
    } else if (state.kind === 'closed' && state.day !== undefined && state.opens !== undefined) {
      status.className += ' is-closed';
      strong.textContent = "We're closed now";
      var when = state.daysAhead === 1 ? 'tomorrow' : DAY_NAMES[state.day];
      detail = 'We reopen ' + when + ' at ' + formatHour(state.opens) + '.';
      title = (state.daysAhead === 1 ? "Tomorrow's" : DAY_NAMES[state.day] + "'s") + ' bakes';
      menuLinkText = 'View ' + when + "'s menu and pre-order";
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
        return (item.textContent || '').trim();
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
      if (note) fragment.appendChild(createElement('p', 'note', note.textContent || ''));
    } else {
      fragment.appendChild(createElement('p', 'note', 'Check the weekly menu for the full selection.'));
    }

    var more = createElement('p', 'today-more');
    var link = createElement('a', '', menuLinkText);
    link.href = state.day === undefined ? '#menu' : '#' + DAY_IDS[state.day];
    more.appendChild(link);
    fragment.appendChild(more);

    panel.replaceChildren(fragment);
  }

  var lastRenderedStateKey = '';

  /**
   * Recomputes `TodayState` and re-renders only when the state key changes.
   * @returns {void}
   */
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

  /** @type {number | null} */
  var updateTimer = null;

  /** @returns {void} */
  function startUpdates() {
    if (updateTimer === null && !document.hidden) {
      updateTimer = window.setInterval(update, 60 * 1000);
    }
  }

  /** @returns {void} */
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
  var preorderName = /** @type {HTMLInputElement | null} */ (document.getElementById('preorder-name'));
  var preorderContact = /** @type {HTMLInputElement | null} */ (document.getElementById('preorder-contact'));
  var contactName = /** @type {HTMLInputElement | null} */ (document.getElementById('contact-name'));
  var contactEmail = /** @type {HTMLInputElement | null} */ (document.getElementById('contact-email'));

  /**
   * Reads saved customer autofill details from `localStorage`.
   * @returns {SavedCustomer}
   */
  function loadSavedCustomer() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? /** @type {SavedCustomer} */ (JSON.parse(raw)) : {};
    } catch (_error) {
      return {};
    }
  }

  /**
   * Merges and persists customer details in `localStorage` for repeat visits.
   * @param {SavedCustomer} patch Partial customer fields to save.
   * @returns {SavedCustomer}
   */
  function saveCustomer(patch) {
    try {
      var current = loadSavedCustomer();
      /** @type {SavedCustomer} */
      var next = {
        name: patch.name !== undefined ? patch.name : (current.name || ''),
        tel: patch.tel !== undefined ? patch.tel : (current.tel || ''),
        email: patch.email !== undefined ? patch.email : (current.email || '')
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    } catch (_error) {
      return {};
    }
  }

  /**
   * Pre-fills empty personal form fields from `localStorage`.
   * @returns {void}
   */
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

  /**
   * Marks a form field invalid, links it to its live status message, and moves focus.
   * @param {HTMLElement} field Form control with the validation error.
   * @param {HTMLElement} statusEl Live status paragraph element.
   * @param {string} message Human-readable error message.
   * @returns {void}
   */
  function showFieldError(field, statusEl, message) {
    field.setAttribute('aria-invalid', 'true');
    if (statusEl.id) {
      field.setAttribute('aria-describedby', statusEl.id);
    }
    statusEl.className = 'form-status is-error';
    statusEl.textContent = message;
    field.focus();
  }

  /**
   * Clears validation ARIA attributes from a form field.
   * @param {HTMLElement | null} field Form control to clear.
   * @returns {void}
   */
  function clearFieldError(field) {
    if (!field) return;
    field.removeAttribute('aria-invalid');
    field.removeAttribute('aria-describedby');
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
  var preorderForm = /** @type {HTMLFormElement | null} */ (document.getElementById('preorder-form'));
  var itemSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById('preorder-item'));
  var quantityInput = /** @type {HTMLInputElement | null} */ (document.getElementById('preorder-quantity'));
  var daySelect = /** @type {HTMLSelectElement | null} */ (document.getElementById('preorder-day'));
  var preorderStatus = document.getElementById('preorder-status');
  var resultsBox = document.getElementById('preorder-results');
  var list = document.getElementById('preorder-list');

  if (preorderForm && daySelect && itemSelect && quantityInput && preorderName && preorderContact && preorderStatus && resultsBox && list) {
    var DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    /**
     * Checks whether `itemValue` is listed in the weekly schedule for `dayId`.
     * @param {string} itemValue Selected `<option>` value from `#preorder-item`.
     * @param {string} dayId Section ID (`'mon'`..`'sat'`).
     * @returns {boolean}
     */
    function isBakedOnDay(itemValue, dayId) {
      if (!itemValue) return true;
      var section = document.getElementById(dayId);
      if (!section) return true;
      var names = section.querySelectorAll('.menu-list .name');
      if (!names.length) return false;
      var cleanItem = itemValue.split(' (')[0].trim().toLowerCase();
      for (var i = 0; i < names.length; i++) {
        if ((names[i].textContent || '').trim().toLowerCase() === cleanItem) {
          return true;
        }
      }
      return false;
    }

    /**
     * Populates `#preorder-day` with valid open collection dates from tomorrow
     * up to 7 days ahead, skipping Sundays and days the selected bake is not made.
     * @returns {void}
     */
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

    /** @type {HTMLElement[]} */
    var preorderFields = [itemSelect, quantityInput, daySelect, preorderName, preorderContact];
    preorderFields.forEach(function (field) {
      field.addEventListener('input', function () {
        clearFieldError(field);
      });
      field.addEventListener('change', function () {
        clearFieldError(field);
      });
    });

    preorderForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var itemVal = itemSelect.value.trim();
      var qtyVal = parseInt(quantityInput.value, 10);
      var dayVal = daySelect.value.trim();
      var nameVal = preorderName.value.trim();
      var contactVal = preorderContact.value.trim();
      var phoneDigits = contactVal.replace(/\D/g, '');

      preorderFields.forEach(clearFieldError);

      if (!itemVal) {
        showFieldError(itemSelect, preorderStatus, 'Please select a bakery item to pre-order.');
        return;
      }
      if (isNaN(qtyVal) || qtyVal < 1 || qtyVal > 30) {
        showFieldError(quantityInput, preorderStatus, 'Please enter a quantity between 1 and 30.');
        return;
      }
      if (!dayVal) {
        showFieldError(daySelect, preorderStatus, 'Please select a collection date.');
        return;
      }
      if (!nameVal) {
        showFieldError(preorderName, preorderStatus, 'Please enter your name so we can label your order.');
        return;
      }
      if (!contactVal || phoneDigits.length < 7) {
        showFieldError(preorderContact, preorderStatus, 'Please enter a valid phone number (for example, 0551 000 000).');
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
  var contactForm = /** @type {HTMLFormElement | null} */ (document.getElementById('contact-form'));
  var messageInput = /** @type {HTMLTextAreaElement | null} */ (document.getElementById('contact-message'));
  var contactStatus = document.getElementById('contact-status');

  if (contactForm && contactName && contactEmail && messageInput && contactStatus) {
    /** @type {HTMLElement[]} */
    var contactFields = [contactName, contactEmail, messageInput];
    contactFields.forEach(function (field) {
      field.addEventListener('input', function () {
        clearFieldError(field);
      });
    });

    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var nameVal = contactName.value.trim();
      var emailVal = contactEmail.value.trim();
      var messageVal = messageInput.value.trim();
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      contactFields.forEach(clearFieldError);

      if (!nameVal) {
        showFieldError(contactName, contactStatus, 'Please enter your name.');
        return;
      }
      if (!emailVal || !emailPattern.test(emailVal)) {
        showFieldError(contactEmail, contactStatus, 'Please enter a valid email address (for example, kofi@email.com).');
        return;
      }
      if (!messageVal) {
        showFieldError(messageInput, contactStatus, 'Please enter your message before sending.');
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
  var navigationEntry = /** @type {PerformanceNavigationTiming | undefined} */ (
    performance.getEntriesByType('navigation')[0]
  );
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

(function initializeScrollToTop() {
  var scrollTopBtn = document.getElementById('scroll-top-btn');
  var footer = document.querySelector('.site-footer');
  if (!scrollTopBtn) return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isShown = false;

  /**
   * Toggles button visibility after scrolling past 320px and offsets it above the footer.
   * @returns {void}
   */
  function updateScrollTopVisibility() {
    var shouldShow = window.scrollY > 320;
    if (shouldShow !== isShown) {
      isShown = shouldShow;
      if (shouldShow) {
        scrollTopBtn.hidden = false;
        window.requestAnimationFrame(function () {
          scrollTopBtn.classList.add('is-visible');
        });
      } else {
        scrollTopBtn.classList.remove('is-visible');
        scrollTopBtn.hidden = true;
      }
    }

    if (shouldShow && footer) {
      var footerRect = footer.getBoundingClientRect();
      var overlap = window.innerHeight - footerRect.top;
      if (overlap > 0) {
        scrollTopBtn.style.bottom = (overlap + 12) + 'px';
      } else {
        scrollTopBtn.style.bottom = '';
      }
    }
  }

  scrollTopBtn.addEventListener('click', function () {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? 'auto' : 'smooth'
    });
    if (window.location.hash) {
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + window.location.search
      );
    }
    var brandLink = /** @type {HTMLAnchorElement | null} */ (document.querySelector('.brand'));
    if (brandLink) {
      brandLink.focus({ preventScroll: true });
    }
  });

  window.addEventListener('scroll', updateScrollTopVisibility, { passive: true });
  window.addEventListener('resize', updateScrollTopVisibility);
  updateScrollTopVisibility();
})();
