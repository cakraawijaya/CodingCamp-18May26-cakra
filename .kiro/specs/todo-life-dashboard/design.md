# Design Document: Todo-Life Dashboard

## Overview

The Todo-Life Dashboard is a zero-dependency, single-page personal productivity application. It runs entirely in the browser from a local file — no server, no build step, no framework. All state lives in `localStorage` and all logic is written in vanilla JavaScript organized into logical modules within a single `js/app.js` file.

The five core widgets are:

| Widget | Responsibility |
|---|---|
| **Greeting Widget** | Displays current time, date, and time-of-day greeting |
| **Focus Timer** | 25-minute Pomodoro countdown with Start / Stop / Reset |
| **Todo List** | Add, edit, complete-toggle, and delete persistent tasks |
| **Quick Links** | Save and launch favorite URL shortcuts |
| **Storage Manager** | Centralized `localStorage` read/write with JSON serialization |

### Design Goals

- **Zero network dependency** — works via `file://` protocol with no CDN calls at runtime beyond the initial page load of Tailwind and Font Awesome.
- **Single source of truth** — `localStorage` is the only persistence layer; the in-memory state is always derived from it on load.
- **Module cohesion** — each widget owns its own state, DOM rendering, and event handlers, exposed through a narrow public API.
- **Predictable state transitions** — the Focus Timer uses an explicit state machine (`idle → running → paused → idle`) to prevent invalid transitions.

---

## Architecture

### File / Folder Structure

```
project-root/
├── index.html          # Single HTML entry point; all markup lives here
├── css/
│   └── style.css       # Custom overrides on top of Tailwind utility classes
└── js/
    └── app.js          # All JavaScript — modules organized by IIFE sections
```

Tailwind CSS and Font Awesome are loaded via CDN `<script>` / `<link>` tags in `index.html`. No `node_modules`, no `package.json`, no build artifacts.

### Module Organization within `app.js`

`app.js` is structured as a series of immediately-invoked module objects (plain object literals) assigned to `const` variables, followed by a top-level `init()` call:

```
app.js
├── StorageManager      — read/write localStorage
├── GreetingWidget      — time/date/greeting display
├── FocusTimer          — countdown state machine + DOM
├── TodoList            — task CRUD + DOM rendering
├── QuickLinks          — link CRUD + DOM rendering
└── init()              — wires everything together on DOMContentLoaded
```

Each module exposes only the methods needed by other modules. Internal helpers are kept private via closure.

### Dependency Graph

```
init()
  ├── StorageManager.load()
  ├── GreetingWidget.init()
  ├── FocusTimer.init()
  ├── TodoList.init(StorageManager)
  └── QuickLinks.init(StorageManager)
```

`TodoList` and `QuickLinks` receive `StorageManager` as a dependency so they can persist changes. `GreetingWidget` and `FocusTimer` are stateless with respect to `localStorage`.

---

## Components and Interfaces

### StorageManager

```js
StorageManager = {
  KEYS: {
    TASKS: 'tdl_tasks',
    LINKS: 'tdl_links'
  },
  load(key)          // → parsed array, or [] on missing/malformed data
  save(key, array)   // → void; JSON.stringify + localStorage.setItem
}
```

`load()` wraps `JSON.parse` in a `try/catch`. Any error (missing key, malformed JSON) returns `[]` silently.

### GreetingWidget

```js
GreetingWidget = {
  init()             // starts setInterval(tick, 60_000) and calls tick() immediately
  tick()             // private: updates #time, #date, #greeting DOM nodes
  formatTime(date)   // → "HH:MM" string
  formatDate(date)   // → "Weekday, DD Month YYYY" string
  getGreeting(hour)  // → "Good Morning" | "Good Afternoon" | "Good Evening" | "Good Night"
}
```

`formatTime`, `formatDate`, and `getGreeting` are pure functions — they take a value and return a string with no side effects, making them directly testable.

### FocusTimer

```js
FocusTimer = {
  state: 'idle',          // 'idle' | 'running' | 'paused'
  remainingSeconds: 1500, // 25 * 60
  intervalId: null,

  init()           // binds button click handlers, renders initial state
  start()          // idle|paused → running; starts setInterval(tick, 1000)
  stop()           // running → paused; clears interval
  reset()          // any → idle; clears interval, resets remainingSeconds
  tick()           // private: decrements remainingSeconds, calls render(), checks for 0
  formatTime(secs) // → "MM:SS" string (pure function)
  render()         // private: updates DOM display and button visibility
  notify()         // private: browser Notification or alert fallback
}
```

State transitions are guarded: `start()` is a no-op if already `running`; `stop()` is a no-op if not `running`.

### TodoList

```js
TodoList = {
  tasks: [],   // Task[]

  init(storage)          // loads tasks, renders list, binds add-form submit
  addTask(description)   // → Task | null (null if whitespace-only)
  editTask(id, newDesc)  // → boolean (false if whitespace-only)
  toggleComplete(id)     // → void
  deleteTask(id)         // → void
  render()               // private: re-renders full task list DOM
  renderTask(task)       // private: returns <li> element for one task
}
```

### QuickLinks

```js
QuickLinks = {
  links: [],   // Link[]

  init(storage)          // loads links, renders list, binds add-form submit
  addLink(label, url)    // → Link | null (null if empty label/url)
  deleteLink(id)         // → void
  normalizeUrl(url)      // → string with https:// prepended if missing (pure function)
  render()               // private: re-renders full links DOM
  renderLink(link)       // private: returns <button> element for one link
}
```

---

## Data Models

### Task

Stored in `localStorage` under key `tdl_tasks` as a JSON array of Task objects.

```js
{
  id:          string,   // crypto.randomUUID() or Date.now().toString()
  description: string,   // non-empty, trimmed
  completed:   boolean,  // false = incomplete, true = complete
  createdAt:   number    // Date.now() timestamp
}
```

### Link

Stored in `localStorage` under key `tdl_links` as a JSON array of Link objects.

```js
{
  id:    string,   // crypto.randomUUID() or Date.now().toString()
  label: string,   // non-empty, trimmed display name
  url:   string    // always starts with http:// or https://
}
```

### localStorage Key Schema

| Key | Type | Description |
|---|---|---|
| `tdl_tasks` | `JSON string → Task[]` | Ordered array of all tasks |
| `tdl_links` | `JSON string → Link[]` | Ordered array of all quick links |

Keys are prefixed with `tdl_` to avoid collisions with other apps sharing the same origin.

---

## UI Layout

### Responsive Grid (Tailwind)

```
┌─────────────────────────────────────────────────────┐
│  Header: "Todo-Life Dashboard"                       │
├──────────────────────┬──────────────────────────────┤
│  Greeting Widget     │  Focus Timer                 │
│  (col-span-1)        │  (col-span-1)                │
├──────────────────────┴──────────────────────────────┤
│  Todo List                                          │
│  (col-span-full)                                    │
├─────────────────────────────────────────────────────┤
│  Quick Links                                        │
│  (col-span-full)                                    │
└─────────────────────────────────────────────────────┘
```

Tailwind classes used for the grid:

```html
<main class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 max-w-4xl mx-auto">
  <section id="greeting">...</section>      <!-- col 1 on md+ -->
  <section id="focus-timer">...</section>   <!-- col 2 on md+ -->
  <section id="todo-list" class="md:col-span-2">...</section>
  <section id="quick-links" class="md:col-span-2">...</section>
</main>
```

On viewports below 768px (`grid-cols-1`), all four sections stack vertically. On 768px and above (`md:grid-cols-2`), Greeting and Timer sit side-by-side, while Todo List and Quick Links span the full width.

### Widget Card Pattern

Each widget is wrapped in a consistent card:

```html
<section class="bg-white rounded-2xl shadow p-6">
  <h2 class="text-lg font-semibold mb-4">Widget Title</h2>
  <!-- widget content -->
</section>
```

### Timer Display

The timer digit display uses a large monospace font to prevent layout shift as digits change:

```html
<div id="timer-display" class="text-5xl font-mono font-bold text-center tabular-nums">
  25:00
</div>
```

### Validation Messages

Inline validation errors appear as a `<p>` element directly below the relevant input, toggled via `hidden` class:

```html
<p id="task-error" class="text-red-500 text-sm mt-1 hidden">
  Task description cannot be empty.
</p>
```

---

## Event Handling Patterns

### Event Delegation for Dynamic Lists

Task and link items are rendered dynamically. Rather than attaching listeners to each item, a single delegated listener on the parent `<ul>` / `<div>` handles all item-level actions via `data-*` attributes:

```js
document.getElementById('task-list').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'toggle') TodoList.toggleComplete(id);
  if (action === 'edit')   TodoList.startEdit(id);
  if (action === 'delete') TodoList.deleteTask(id);
});
```

### Form Submission

Add-task and add-link forms use `submit` event with `e.preventDefault()` to avoid page reload (important for `file://` compatibility):

```js
document.getElementById('add-task-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('task-input');
  TodoList.addTask(input.value);
});
```

### Timer Buttons

Timer buttons use direct `click` listeners bound once in `FocusTimer.init()`:

```js
document.getElementById('btn-start').addEventListener('click', () => FocusTimer.start());
document.getElementById('btn-stop').addEventListener('click',  () => FocusTimer.stop());
document.getElementById('btn-reset').addEventListener('click', () => FocusTimer.reset());
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time formatting produces valid HH:MM output

*For any* Date object, `GreetingWidget.formatTime(date)` SHALL return a string matching the pattern `HH:MM` where HH is in [00, 23] and MM is in [00, 59].

**Validates: Requirements 1.1**

---

### Property 2: Date formatting contains all required components

*For any* Date object, `GreetingWidget.formatDate(date)` SHALL return a string that contains a valid weekday name, a numeric day, a month name, and a four-digit year.

**Validates: Requirements 1.2**

---

### Property 3: Greeting classification is exhaustive and correct

*For any* integer hour in [0, 23], `GreetingWidget.getGreeting(hour)` SHALL return exactly one of "Good Morning", "Good Afternoon", "Good Evening", or "Good Night", and the returned value SHALL match the time-range rules: Morning for [5,11], Afternoon for [12,17], Evening for [18,20], Night for [21,23] and [0,4].

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 4: Timer formatting produces valid MM:SS output

*For any* integer `seconds` in [0, 1500], `FocusTimer.formatTime(seconds)` SHALL return a string matching the pattern `MM:SS` where the total represented seconds equals the input value.

**Validates: Requirements 2.6**

---

### Property 5: Timer reset always returns to initial state

*For any* timer in any state (idle, running, or paused) with any remaining time, calling `reset()` SHALL set `state` to `'idle'` and `remainingSeconds` to `1500`.

**Validates: Requirements 2.4**

---

### Property 6: Timer start transitions to running state

*For any* timer in `idle` or `paused` state with any remaining time greater than 0, calling `start()` SHALL set `state` to `'running'`.

**Validates: Requirements 2.2**

---

### Property 7: Timer stop preserves remaining time

*For any* timer in `running` state with any remaining time, calling `stop()` SHALL set `state` to `'paused'` and SHALL NOT change `remainingSeconds`.

**Validates: Requirements 2.3**

---

### Property 8: Adding a valid task grows the list by exactly one

*For any* task list and any non-empty, non-whitespace task description, calling `addTask(description)` SHALL increase the task list length by exactly 1 and the new task SHALL appear in the list with the provided description and `completed: false`.

**Validates: Requirements 3.1**

---

### Property 9: Whitespace-only input is rejected for tasks and links

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), calling `addTask(str)` or `editTask(id, str)` SHALL leave the task list unchanged, and calling `addLink(label, url)` with an empty label or empty URL SHALL leave the link collection unchanged.

**Validates: Requirements 3.2, 3.5, 4.2**

---

### Property 10: Task completion toggle is a round-trip

*For any* task with any initial completion state, calling `toggleComplete(id)` twice SHALL return the task to its original completion state.

**Validates: Requirements 3.6, 3.7**

---

### Property 11: Deleting a task removes exactly that task

*For any* task list with two or more tasks, calling `deleteTask(id)` SHALL remove exactly the task with the matching `id` and leave all other tasks unchanged (same count, same order, same data).

**Validates: Requirements 3.8**

---

### Property 12: Task and Link serialization round-trip

*For any* array of Task objects or Link objects, serializing with `StorageManager.save()` and then loading with `StorageManager.load()` SHALL produce an array that is deeply equal to the original (same length, same field values for every item).

**Validates: Requirements 3.9, 3.10, 4.6, 4.7, 5.2, 5.3**

---

### Property 13: Malformed storage data returns empty collections

*For any* value stored in `localStorage` that is `null`, `undefined`, an empty string, or an invalid JSON string, `StorageManager.load()` SHALL return an empty array `[]` without throwing an exception.

**Validates: Requirements 5.4**

---

### Property 14: URL normalization always produces an http(s) URL

*For any* URL string that does not begin with `http://` or `https://`, `QuickLinks.normalizeUrl(url)` SHALL return a string that begins with `https://` and contains the original URL string as a suffix.

**Validates: Requirements 4.3**

---

### Property 15: Adding a valid link grows the collection by exactly one

*For any* link collection and any non-empty label with a non-empty URL, calling `addLink(label, url)` SHALL increase the link collection length by exactly 1 and the new link SHALL appear with the provided label and a normalized URL.

**Validates: Requirements 4.1**

---

## Error Handling

### Storage Errors

`StorageManager.load()` wraps all `JSON.parse` and `localStorage.getItem` calls in `try/catch`. On any error, it logs a `console.warn` and returns `[]`. This ensures the app always starts in a valid (empty) state even if storage is corrupted or unavailable (e.g., private browsing with storage blocked).

`StorageManager.save()` also wraps `localStorage.setItem` in `try/catch`. If storage is full (`QuotaExceededError`), it logs a `console.error` and displays a brief toast notification to the user.

### Input Validation

All user input is validated before any state mutation:

- Task descriptions and link labels are trimmed; empty or whitespace-only strings are rejected with an inline error message.
- Link URLs are validated to be non-empty; protocol normalization (`https://` prepend) is applied before saving.
- Validation error messages are shown inline (adjacent to the relevant input) and cleared on the next valid submission.

### Timer Edge Cases

- `start()` is a no-op if `state === 'running'` (prevents double-interval).
- `stop()` is a no-op if `state !== 'running'`.
- When `remainingSeconds` reaches 0, the interval is cleared before the notification fires to prevent any off-by-one tick.

### Browser Notification Permission

`FocusTimer.notify()` checks `Notification.permission` before calling `new Notification(...)`. If permission is `'denied'` or the API is unavailable (e.g., `file://` in some browsers), it falls back to `window.alert()`.

---

## Testing Strategy

### Dual Testing Approach

The testing strategy combines **unit/example-based tests** for specific behaviors and **property-based tests** for universal correctness guarantees.

**Unit tests** cover:
- Timer initial state (25:00, idle)
- Button visibility per timer state
- Edit mode activation for tasks
- Placeholder message display when lists are empty
- `window.open` called with correct arguments for link activation

**Property-based tests** cover all 15 Correctness Properties listed above.

### Property-Based Testing Library

Use **[fast-check](https://github.com/dubzzz/fast-check)** (loaded via CDN for test files, or via npm for a test runner environment). Each property test runs a minimum of **100 iterations**.

Each property test is tagged with a comment in the format:

```js
// Feature: todo-life-dashboard, Property 3: Greeting classification is exhaustive and correct
```

### Test File Organization

Since the app has no build tooling, tests can be run in one of two ways:

1. **Browser-based**: A `test/index.html` file that loads `fast-check` via CDN and `app.js`, then runs assertions in the console.
2. **Node-based** (optional): Extract pure functions into a separate module and test with `node --experimental-vm-modules` + `fast-check` via npm.

The pure functions most amenable to isolated testing are:
- `GreetingWidget.formatTime(date)`
- `GreetingWidget.formatDate(date)`
- `GreetingWidget.getGreeting(hour)`
- `FocusTimer.formatTime(seconds)`
- `QuickLinks.normalizeUrl(url)`
- `StorageManager.load(key)` / `StorageManager.save(key, array)` (with a mock `localStorage`)

### Coverage Targets

| Area | Strategy |
|---|---|
| Pure formatting functions | Property-based (Properties 1–4) |
| State machine transitions | Property-based (Properties 5–7) |
| Task/Link CRUD logic | Property-based (Properties 8–11, 14–15) |
| Serialization round-trip | Property-based (Property 12) |
| Error/malformed input | Property-based (Properties 9, 13) |
| UI visibility rules | Example-based unit tests |
| Responsive layout | Manual visual testing |
| WCAG contrast | Manual accessibility audit |
