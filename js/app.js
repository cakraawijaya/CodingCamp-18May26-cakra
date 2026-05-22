/* ============================================================
   Todo-Life Dashboard — app.js
   Vanilla JavaScript, no frameworks, no build tools.
   Works via file:// protocol.
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────
   StorageManager
   Centralised localStorage read / write.
   ────────────────────────────────────────────── */
const StorageManager = {
  KEYS: {
    TASKS:         'tdl_tasks',
    LINKS:         'tdl_links',
    THEME:         'tdl_theme',
    USERNAME:      'tdl_username',
    TIMER_MINUTES: 'tdl_timer_minutes',
    SORT:          'tdl_sort',
  },

  /**
   * Load and parse a JSON array from localStorage.
   * Returns [] on missing key, null, or malformed JSON.
   * @param {string} key
   * @returns {Array}
   */
  load(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === undefined || raw === '') return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn(`[StorageManager] Failed to load key "${key}":`, err);
      return [];
    }
  },

  /**
   * Load a plain string value from localStorage.
   * @param {string} key
   * @param {string} [fallback='']
   * @returns {string}
   */
  loadString(key, fallback = '') {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? raw : fallback;
    } catch {
      return fallback;
    }
  },

  /**
   * Save a plain string value to localStorage.
   * @param {string} key
   * @param {string} value
   */
  saveString(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      console.error(`[StorageManager] Failed to save key "${key}":`, err);
    }
  },

  /**
   * Serialize and save an array to localStorage.
   * Shows a toast on QuotaExceededError.
   * @param {string} key
   * @param {Array} array
   */
  save(key, array) {
    try {
      localStorage.setItem(key, JSON.stringify(array));
    } catch (err) {
      console.error(`[StorageManager] Failed to save key "${key}":`, err);
      if (err.name === 'QuotaExceededError') {
        Toast.show('Storage is full. Some data may not be saved.', 4000);
      }
    }
  },
};

/* ──────────────────────────────────────────────
   Toast
   Lightweight notification overlay.
   ────────────────────────────────────────────── */
const Toast = {
  _timer: null,

  /**
   * Show a toast message for `duration` ms.
   * @param {string} message
   * @param {number} [duration=3000]
   */
  show(message, duration = 3000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(this._timer);
    this._timer = setTimeout(() => el.classList.remove('show'), duration);
  },
};

/* ──────────────────────────────────────────────
   ThemeManager  [NEW FEATURE 1]
   Light / Dark mode toggle, persisted.
   ────────────────────────────────────────────── */
const ThemeManager = {
  _dark: false,

  init(storage) {
    const saved = storage.loadString(storage.KEYS.THEME, 'light');
    this._dark = saved === 'dark';
    this._apply(storage);

    document.getElementById('btn-theme').addEventListener('click', () => {
      this._dark = !this._dark;
      storage.saveString(storage.KEYS.THEME, this._dark ? 'dark' : 'light');
      this._apply(storage);
    });
  },

  _apply() {
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon');
    if (this._dark) {
      html.classList.add('dark');
      if (icon) { icon.className = 'fa-solid fa-sun'; }
    } else {
      html.classList.remove('dark');
      if (icon) { icon.className = 'fa-solid fa-moon'; }
    }
  },
};

/* ──────────────────────────────────────────────
   GreetingWidget
   Displays current time, date, and greeting.
   Supports custom user name.  [NEW FEATURE 2]
   ────────────────────────────────────────────── */
const GreetingWidget = {
  _intervalId: null,
  _name: '',

  init(storage) {
    // Load saved name
    this._name = storage.loadString(storage.KEYS.USERNAME, '');
    const input    = document.getElementById('username-input');
    const inputRow = document.getElementById('name-input-row');

    // Pre-fill input if name already saved (from a previous session)
    if (input && this._name) input.value = this._name;

    // Save name button — hide input row immediately after save, no toast
    document.getElementById('btn-save-name').addEventListener('click', () => {
      const val = (input.value || '').trim();
      this._name = val;
      storage.saveString(storage.KEYS.USERNAME, val);

      // Update name display
      const nameDisp = document.getElementById('username-display');
      if (nameDisp) nameDisp.textContent = val ? `${val}` : '';

      // Hide input row until next page reload
      if (inputRow) inputRow.classList.add('hidden');
    });

    // Save on Enter key in name input
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-save-name').click();
      }
    });

    this._tick();
    this._intervalId = setInterval(() => this._tick(), 60_000);
  },

  _tick() {
    const now = new Date();
    const timeEl    = document.getElementById('time');
    const dateEl    = document.getElementById('date');
    const greetEl   = document.getElementById('greeting-text');
    const nameDisp  = document.getElementById('username-display');

    if (timeEl)   timeEl.textContent  = this.formatTime(now);
    if (dateEl)   dateEl.textContent  = this.formatDate(now);
    if (greetEl)  greetEl.textContent = this.getGreeting(now.getHours());
    // Name shown separately, smaller, below the greeting phrase
    if (nameDisp) nameDisp.textContent = this._name ? `${this._name}` : '';
  },

  /**
   * Format a Date as "HH:MM".
   * @param {Date} date
   * @returns {string}
   */
  formatTime(date) {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  },

  /**
   * Format a Date as "Weekday, DD Month YYYY".
   * @param {Date} date
   * @returns {string}
   */
  formatDate(date) {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  },

  /**
   * Return a greeting phrase based on hour (0–23).
   * Name is rendered separately in #username-display.
   * @param {number} hour
   * @returns {string}
   */
  getGreeting(hour) {
    if (hour >= 5 && hour <= 11)  return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 20) return 'Good Evening';
    return 'Good Night';
  },
};

/* ──────────────────────────────────────────────
   FocusTimer
   Pomodoro countdown state machine.
   Supports custom duration.  [NEW FEATURE 3]
   States: idle → running → paused → idle
   ────────────────────────────────────────────── */
const FocusTimer = {
  DEFAULT_MINUTES: 25,
  INITIAL_SECONDS: 25 * 60,
  state: 'idle',
  remainingSeconds: 25 * 60,
  _intervalId: null,

  init(storage) {
    // Load saved duration
    const savedMin = parseInt(storage.loadString(storage.KEYS.TIMER_MINUTES, '25'), 10);
    const minutes = (savedMin >= 1 && savedMin <= 60) ? savedMin : 25;
    this.INITIAL_SECONDS = minutes * 60;
    this.remainingSeconds = this.INITIAL_SECONDS;

    const minInput = document.getElementById('timer-minutes');
    if (minInput) minInput.value = minutes;

    // Set duration button
    document.getElementById('btn-set-timer').addEventListener('click', () => {
      if (this.state !== 'idle') {
        Toast.show('Reset timer before changing duration.', 2500);
        return;
      }
      const val = parseInt(minInput.value, 10);
      if (!val || val < 1 || val > 60) {
        Toast.show('Duration must be 1–60 minutes.', 2500);
        return;
      }
      this.INITIAL_SECONDS = val * 60;
      this.remainingSeconds = this.INITIAL_SECONDS;
      storage.saveString(storage.KEYS.TIMER_MINUTES, String(val));
      this._render();
      Toast.show(`⏱ Timer set to ${val} min.`, 2000);
    });

    // Allow Enter key in duration input
    minInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btn-set-timer').click(); }
    });

    document.getElementById('btn-start').addEventListener('click', () => this.start());
    document.getElementById('btn-stop').addEventListener('click', () => this.stop());
    document.getElementById('btn-reset').addEventListener('click', () => this.reset());
    this._render();
  },

  start() {
    if (this.state === 'running') return;
    this.state = 'running';
    this._intervalId = setInterval(() => this._tick(), 1000);
    this._render();
  },

  stop() {
    if (this.state !== 'running') return;
    clearInterval(this._intervalId);
    this._intervalId = null;
    this.state = 'paused';
    this._render();
  },

  reset() {
    clearInterval(this._intervalId);
    this._intervalId = null;
    this.state = 'idle';
    this.remainingSeconds = this.INITIAL_SECONDS;
    this._render();
  },

  _tick() {
    this.remainingSeconds -= 1;
    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = 0;
      clearInterval(this._intervalId);
      this._intervalId = null;
      this.state = 'idle';
      this._render();
      this._notify();
    } else {
      this._render();
    }
  },

  /**
   * Format seconds as "MM:SS".
   * @param {number} secs
   * @returns {string}
   */
  formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  _render() {
    const display  = document.getElementById('timer-display');
    const btnStart = document.getElementById('btn-start');
    const btnStop  = document.getElementById('btn-stop');
    const status   = document.getElementById('timer-status');

    if (display) display.textContent = this.formatTime(this.remainingSeconds);

    if (btnStart && btnStop) {
      if (this.state === 'running') {
        btnStart.classList.add('hidden');
        btnStop.classList.remove('hidden');
      } else {
        btnStart.classList.remove('hidden');
        btnStop.classList.add('hidden');
      }
    }

    if (status) {
      const labels = {
        idle:   'Ready to focus',
        running:'Session in progress…',
        paused: 'Paused — resume when ready',
      };
      status.textContent = labels[this.state] || '';
    }
  },

  _notify() {
    const title = 'Focus session complete!';
    const body  = 'Great work. Take a short break.';

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') new Notification(title, { body });
        else window.alert(`${title}\n${body}`);
      });
    } else {
      window.alert(`${title}\n${body}`);
    }

    Toast.show('🎉 Focus session complete! Time for a break.', 5000);
  },
};

/* ──────────────────────────────────────────────
   TodoList
   Add, edit, toggle, delete persistent tasks.
   + Duplicate prevention  [NEW FEATURE 4]
   + Sort tasks            [NEW FEATURE 5]
   ────────────────────────────────────────────── */
const TodoList = {
  tasks: [],
  _storage: null,
  _sort: 'default',   // 'default' | 'az' | 'za' | 'pending' | 'done'

  init(storage) {
    this._storage = storage;
    this.tasks = storage.load(storage.KEYS.TASKS);

    // Load saved sort preference
    this._sort = storage.loadString(storage.KEYS.SORT, 'default');
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = this._sort;

    this._render();

    // Sort change
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        this._sort = sortSelect.value;
        storage.saveString(storage.KEYS.SORT, this._sort);
        this._render();
      });
    }

    // Add-task form
    document.getElementById('add-task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input    = document.getElementById('task-input');
      const errorEl  = document.getElementById('task-error');
      const errorMsg = document.getElementById('task-error-msg');
      const result   = this.addTask(input.value);

      if (result === 'empty') {
        errorMsg.textContent = 'Task description cannot be empty.';
        errorEl.classList.remove('hidden');
      } else if (result === 'duplicate') {
        errorMsg.textContent = 'Task already exists.';
        errorEl.classList.remove('hidden');
      } else {
        errorEl.classList.add('hidden');
        input.value = '';
        input.focus();
      }
    });

    // Clear error on input
    document.getElementById('task-input').addEventListener('input', () => {
      document.getElementById('task-error').classList.add('hidden');
    });

    // Delegated click handler for task actions
    document.getElementById('task-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      if (action === 'toggle') this.toggleComplete(id);
      if (action === 'delete') this.deleteTask(id);
      if (action === 'edit')   this._startEdit(id);
    });
  },

  /**
   * Add a new task.
   * Returns 'empty' if blank, 'duplicate' if already exists, or the Task object.
   * @param {string} description
   * @returns {'empty'|'duplicate'|Object}
   */
  addTask(description) {
    const trimmed = (description || '').trim();
    if (!trimmed) return 'empty';

    // Duplicate check — case-insensitive
    const isDuplicate = this.tasks.some(
      (t) => t.description.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) return 'duplicate';

    const task = {
      id: this._uid(),
      description: trimmed,
      completed: false,
      createdAt: Date.now(),
    };
    this.tasks.push(task);
    this._persist();
    this._render();
    return task;
  },

  /**
   * Edit a task's description. Returns false if newDesc is empty or duplicate.
   * @param {string} id
   * @param {string} newDesc
   * @returns {boolean}
   */
  editTask(id, newDesc) {
    const trimmed = (newDesc || '').trim();
    if (!trimmed) return false;
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return false;

    // Duplicate check — ignore self
    const isDuplicate = this.tasks.some(
      (t) => t.id !== id && t.description.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      Toast.show('A task with that name already exists.', 2500);
      return false;
    }

    task.description = trimmed;
    this._persist();
    this._render();
    return true;
  },

  /**
   * Toggle the completed state of a task.
   * @param {string} id
   */
  toggleComplete(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    this._persist();
    this._render();
  },

  /**
   * Delete a task by id.
   * @param {string} id
   */
  deleteTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this._persist();
    this._render();
  },

  /**
   * Return sorted copy of tasks based on current sort mode.
   * Original this.tasks array order (insertion order) is never mutated.
   * @returns {Array}
   */
  _sorted() {
    const copy = [...this.tasks];
    switch (this._sort) {
      case 'az':
        return copy.sort((a, b) => a.description.localeCompare(b.description));
      case 'za':
        return copy.sort((a, b) => b.description.localeCompare(a.description));
      case 'pending':
        return copy.sort((a, b) => Number(a.completed) - Number(b.completed));
      case 'done':
        return copy.sort((a, b) => Number(b.completed) - Number(a.completed));
      default:
        return copy; // insertion order
    }
  },

  _persist() {
    this._storage.save(this._storage.KEYS.TASKS, this.tasks);
  },

  _render() {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = '';

    if (this.tasks.length === 0) {
      const p = document.createElement('p');
      p.className = 'placeholder-msg';
      p.textContent = 'No tasks yet. Add one above!';
      list.appendChild(p);
      return;
    }

    this._sorted().forEach((task) => list.appendChild(this._renderTask(task)));
  },

  _renderTask(task) {
    const li = document.createElement('li');
    li.className = `task-item mt-1 ${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;

    // Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = `btn-icon btn-icon-check${task.completed ? ' checked' : ''}`;
    toggleBtn.dataset.action = 'toggle';
    toggleBtn.dataset.id = task.id;
    toggleBtn.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
    toggleBtn.innerHTML = '<i class="fa-solid fa-check"></i>';

    // Description
    const span = document.createElement('span');
    span.className = `task-text${task.completed ? ' line-through' : ''}`;
    span.textContent = task.description;

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-icon btn-icon-edit';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id = task.id;
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className = 'btn-icon btn-icon-delete';
    delBtn.dataset.action = 'delete';
    delBtn.dataset.id = task.id;
    delBtn.setAttribute('aria-label', 'Delete task');
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';

    li.appendChild(toggleBtn);
    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(delBtn);
    return li;
  },

  _startEdit(id) {
    const li = document.querySelector(`#task-list [data-id="${id}"]`);
    if (!li) return;
    const span = li.querySelector('.task-text');
    if (!span) return;

    const originalText = span.textContent;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-edit-input';
    input.value = originalText;
    li.replaceChild(input, span);
    input.focus();
    input.select();

    const editBtn = li.querySelector('[data-action="edit"]');
    if (editBtn) editBtn.style.display = 'none';

    const commit = () => {
      const saved = this.editTask(id, input.value);
      if (!saved) this._render();
    };

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = originalText; input.blur(); }
    });
  },

  _uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },
};

/* ──────────────────────────────────────────────
   QuickLinks
   Save and launch favourite URL shortcuts.
   ────────────────────────────────────────────── */
const QuickLinks = {
  links: [],
  _storage: null,

  init(storage) {
    this._storage = storage;
    this.links = storage.load(storage.KEYS.LINKS);
    this._render();

    document.getElementById('add-link-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const labelInput = document.getElementById('link-label-input');
      const urlInput   = document.getElementById('link-url-input');
      const errorEl    = document.getElementById('link-error');
      const result     = this.addLink(labelInput.value, urlInput.value);
      if (result === null) {
        errorEl.classList.remove('hidden');
      } else {
        errorEl.classList.add('hidden');
        labelInput.value = '';
        urlInput.value   = '';
        labelInput.focus();
      }
    });

    ['link-label-input', 'link-url-input'].forEach((id) => {
      document.getElementById(id).addEventListener('input', () => {
        document.getElementById('link-error').classList.add('hidden');
      });
    });

    document.getElementById('links-container').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="delete-link"]');
      if (!btn) return;
      this.deleteLink(btn.dataset.id);
    });
  },

  /**
   * Add a new link. Returns the Link or null if label/url is empty.
   * @param {string} label
   * @param {string} url
   * @returns {Object|null}
   */
  addLink(label, url) {
    const trimLabel = (label || '').trim();
    const trimUrl   = (url   || '').trim();
    if (!trimLabel || !trimUrl) return null;
    const link = {
      id:    this._uid(),
      label: trimLabel,
      url:   this.normalizeUrl(trimUrl),
    };
    this.links.push(link);
    this._persist();
    this._render();
    return link;
  },

  /**
   * Delete a link by id.
   * @param {string} id
   */
  deleteLink(id) {
    this.links = this.links.filter((l) => l.id !== id);
    this._persist();
    this._render();
  },

  /**
   * Ensure a URL starts with http:// or https://.
   * @param {string} url
   * @returns {string}
   */
  normalizeUrl(url) {
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  },

  _persist() {
    this._storage.save(this._storage.KEYS.LINKS, this.links);
  },

  _render() {
    const container = document.getElementById('links-container');
    if (!container) return;
    container.innerHTML = '';

    if (this.links.length === 0) {
      const p = document.createElement('p');
      p.className = 'placeholder-msg w-full';
      p.textContent = 'No links saved yet. Add one above!';
      container.appendChild(p);
      return;
    }

    this.links.forEach((link) => container.appendChild(this._renderLink(link)));
  },

  _renderLink(link) {
    const wrapper = document.createElement('div');
    wrapper.className = 'link-btn';

    const openBtn = document.createElement('button');
    openBtn.className = 'flex items-center gap-1.5 bg-transparent border-none cursor-pointer font-medium text-sm p-0';
    openBtn.style.color = 'inherit';
    openBtn.setAttribute('aria-label', `Open ${link.label}`);
    openBtn.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square text-xs opacity-60"></i>${this._escapeHtml(link.label)}`;
    openBtn.addEventListener('click', () => window.open(link.url, '_blank', 'noopener,noreferrer'));

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete-btn';
    delBtn.dataset.action = 'delete-link';
    delBtn.dataset.id = link.id;
    delBtn.setAttribute('aria-label', `Remove ${link.label}`);
    delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';

    wrapper.appendChild(openBtn);
    wrapper.appendChild(delBtn);
    return wrapper;
  },

  _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  _uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },
};

/* ──────────────────────────────────────────────
   init
   Wire everything together on DOMContentLoaded.
   ────────────────────────────────────────────── */
function init() {
  // Navbar scroll transparency
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => {
      if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set correct state on load
  }

  // Footer year
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Dismiss loading screen
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    // Small delay so the progress bar animation completes visually
    setTimeout(() => loadingScreen.classList.add('hide'), 1500);
  }

  // Scroll-to-top button
  const scrollBtn = document.getElementById('btn-scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    }, { passive: true });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  ThemeManager.init(StorageManager);
  GreetingWidget.init(StorageManager);
  FocusTimer.init(StorageManager);
  TodoList.init(StorageManager);
  QuickLinks.init(StorageManager);
}

document.addEventListener('DOMContentLoaded', init);
