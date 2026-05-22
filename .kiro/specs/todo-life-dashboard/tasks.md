# Implementation Plan: Todo-Life Dashboard

## Overview

Build a zero-dependency, single-page productivity dashboard using plain HTML, Tailwind CSS (CDN), Font Awesome (CDN), and vanilla JavaScript. All logic lives in three files: `index.html`, `css/style.css`, and `js/app.js`. State is persisted exclusively via `localStorage`.

## Tasks

- [ ] 1. Scaffold project files and HTML structure
  - [ ] 1.1 Create `index.html` with Tailwind CDN and Font Awesome CDN links
    - Add `<meta charset>`, `<meta name="viewport">`, and `<title>` tags
    - Link Tailwind CSS via CDN `<script src="https://cdn.tailwindcss.com">`
    - Link Font Awesome via CDN `<link>` tag
    - Link `css/style.css` and `js/app.js` (deferred)
    - Add the responsive `<main>` grid container with `grid grid-cols-1 md:grid-cols-2 gap-6 p-4 max-w-4xl mx-auto`
    - Add `<header>` with dashboard title
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

  - [ ] 1.2 Add all four widget `<section>` skeletons inside `index.html`
    - `#greeting` section with `#time`, `#date`, `#greeting-text` elements
    - `#focus-timer` section with `#timer-display`, `#btn-start`, `#btn-stop`, `#btn-reset`
    - `#todo-list` section with `#add-task-form`, `#task-input`, `#task-error`, `#task-list` with `md:col-span-2`
    - `#quick-links` section with `#add-link-form`, `#link-label-input`, `#link-url-input`, `#link-error`, `#links-container` with `md:col-span-2`
    - Apply card pattern: `bg-white rounded-2xl shadow p-6` on each section
    - _Requirements: 6.3, 7.1, 7.4, 7.5_

  - [ ] 1.3 Create `css/style.css` with base custom overrides
    - Add `body` background color and font-family fallback
    - Add `.line-through` helper for completed tasks
    - Add any custom transitions or focus-ring overrides not covered by Tailwind
    - _Requirements: 7.2, 7.6_

- [ ] 2. Implement StorageManager module in `js/app.js`
  - [ ] 2.1 Write the `StorageManager` object with `KEYS`, `load()`, and `save()`
    - Define `KEYS: { TASKS: 'tdl_tasks', LINKS: 'tdl_links' }`
    - `load(key)`: wrap `localStorage.getItem` + `JSON.parse` in `try/catch`; return `[]` on any error
    - `save(key, array)`: wrap `JSON.stringify` + `localStorage.setItem` in `try/catch`; log `console.error` and show toast on `QuotaExceededError`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.2 Write property test for StorageManager serialization round-trip
    - **Property 12: Task and Link serialization round-trip**
    - **Validates: Requirements 3.9, 3.10, 4.6, 4.7, 5.2, 5.3**

  - [ ]* 2.3 Write property test for malformed storage data
    - **Property 13: Malformed storage data returns empty collections**
    - **Validates: Requirements 5.4**

- [ ] 3. Implement GreetingWidget module in `js/app.js`
  - [ ] 3.1 Write `GreetingWidget` with `formatTime()`, `formatDate()`, `getGreeting()`, `tick()`, and `init()`
    - `formatTime(date)`: return `"HH:MM"` using `padStart(2, '0')` for hours and minutes
    - `formatDate(date)`: return `"Weekday, DD Month YYYY"` using `toLocaleDateString` or manual arrays
    - `getGreeting(hour)`: return correct greeting for ranges [5–11], [12–17], [18–20], [21–23] and [0–4]
    - `tick()`: update `#time`, `#date`, `#greeting-text` DOM nodes
    - `init()`: call `tick()` immediately, then `setInterval(tick, 60_000)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 3.2 Write property test for time formatting
    - **Property 1: Time formatting produces valid HH:MM output**
    - **Validates: Requirements 1.1**

  - [ ]* 3.3 Write property test for date formatting
    - **Property 2: Date formatting contains all required components**
    - **Validates: Requirements 1.2**

  - [ ]* 3.4 Write property test for greeting classification
    - **Property 3: Greeting classification is exhaustive and correct**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

- [ ] 4. Implement FocusTimer module in `js/app.js`
  - [ ] 4.1 Write `FocusTimer` state machine with `start()`, `stop()`, `reset()`, `tick()`, `formatTime()`, `render()`, and `notify()`
    - Initialize `state = 'idle'`, `remainingSeconds = 1500`, `intervalId = null`
    - `start()`: no-op if `state === 'running'`; transition to `running`, start `setInterval(tick, 1000)`
    - `stop()`: no-op if `state !== 'running'`; transition to `paused`, clear interval
    - `reset()`: clear interval, set `state = 'idle'`, `remainingSeconds = 1500`, call `render()`
    - `tick()`: decrement `remainingSeconds`; if 0, clear interval, set `state = 'idle'`, call `render()`, call `notify()`
    - `formatTime(secs)`: return `"MM:SS"` string
    - `render()`: update `#timer-display`; toggle `hidden` on `#btn-start` and `#btn-stop` based on state
    - `notify()`: check `Notification.permission`; use `new Notification(...)` or fall back to `window.alert()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ] 4.2 Bind timer button click handlers in `FocusTimer.init()`
    - Attach `click` listeners to `#btn-start`, `#btn-stop`, `#btn-reset`
    - Call `render()` at end of `init()` to set initial button visibility
    - _Requirements: 2.1, 2.7, 2.8_

  - [ ]* 4.3 Write property test for timer formatting
    - **Property 4: Timer formatting produces valid MM:SS output**
    - **Validates: Requirements 2.6**

  - [ ]* 4.4 Write property test for timer reset
    - **Property 5: Timer reset always returns to initial state**
    - **Validates: Requirements 2.4**

  - [ ]* 4.5 Write property test for timer start transition
    - **Property 6: Timer start transitions to running state**
    - **Validates: Requirements 2.2**

  - [ ]* 4.6 Write property test for timer stop preserving time
    - **Property 7: Timer stop preserves remaining time**
    - **Validates: Requirements 2.3**

- [ ] 5. Checkpoint — Ensure StorageManager, GreetingWidget, and FocusTimer are wired and working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement TodoList module in `js/app.js`
  - [ ] 6.1 Write `TodoList` with `addTask()`, `editTask()`, `toggleComplete()`, `deleteTask()`, `renderTask()`, and `render()`
    - `addTask(description)`: trim input; return `null` if empty; create Task object with `crypto.randomUUID()` id, push to `tasks`, call `storage.save()`, call `render()`
    - `editTask(id, newDesc)`: trim; return `false` if empty; find task by id, update description, call `storage.save()`, call `render()`
    - `toggleComplete(id)`: flip `completed` boolean, call `storage.save()`, call `render()`
    - `deleteTask(id)`: filter out task by id, call `storage.save()`, call `render()`
    - `renderTask(task)`: return `<li>` element with toggle checkbox, description span (strikethrough if complete), edit button, delete button; use Font Awesome icons; attach `data-action` and `data-id` attributes
    - `render()`: clear `#task-list`; if empty show placeholder `"No tasks yet. Add one above!"`; otherwise append `renderTask()` for each task
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11_

  - [ ] 6.2 Bind add-task form submit and event-delegated list click handler in `TodoList.init()`
    - `#add-task-form` submit: `e.preventDefault()`, call `addTask()`, show/clear `#task-error` inline message
    - `#task-list` delegated click: `e.target.closest('[data-action]')`; dispatch to `toggleComplete`, `editTask`, or `deleteTask`
    - Implement inline edit mode: replace description span with `<input>` on edit action; save on blur or Enter key
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 6.3 Write property test for adding a valid task
    - **Property 8: Adding a valid task grows the list by exactly one**
    - **Validates: Requirements 3.1**

  - [ ]* 6.4 Write property test for whitespace-only task rejection
    - **Property 9: Whitespace-only input is rejected for tasks and links**
    - **Validates: Requirements 3.2, 3.5**

  - [ ]* 6.5 Write property test for task completion toggle round-trip
    - **Property 10: Task completion toggle is a round-trip**
    - **Validates: Requirements 3.6, 3.7**

  - [ ]* 6.6 Write property test for task deletion
    - **Property 11: Deleting a task removes exactly that task**
    - **Validates: Requirements 3.8**

- [ ] 7. Implement QuickLinks module in `js/app.js`
  - [ ] 7.1 Write `QuickLinks` with `addLink()`, `deleteLink()`, `normalizeUrl()`, `renderLink()`, and `render()`
    - `normalizeUrl(url)`: if url does not start with `http://` or `https://`, prepend `https://`; return result
    - `addLink(label, url)`: trim both; return `null` if either is empty; create Link object with `crypto.randomUUID()` id, normalized url; push to `links`, call `storage.save()`, call `render()`
    - `deleteLink(id)`: filter out link by id, call `storage.save()`, call `render()`
    - `renderLink(link)`: return `<button>` element with label text and Font Awesome external-link icon; `onclick` calls `window.open(link.url, '_blank')`; add delete button with `data-action="delete"` and `data-id`
    - `render()`: clear `#links-container`; if empty show placeholder `"No links saved yet. Add one above!"`; otherwise append `renderLink()` for each link
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ] 7.2 Bind add-link form submit and event-delegated delete handler in `QuickLinks.init()`
    - `#add-link-form` submit: `e.preventDefault()`, call `addLink()`, show/clear `#link-error` inline message
    - `#links-container` delegated click: dispatch delete action via `data-action="delete"`
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]* 7.3 Write property test for URL normalization
    - **Property 14: URL normalization always produces an http(s) URL**
    - **Validates: Requirements 4.3**

  - [ ]* 7.4 Write property test for adding a valid link
    - **Property 15: Adding a valid link grows the collection by exactly one**
    - **Validates: Requirements 4.1**

  - [ ]* 7.5 Write property test for whitespace-only link rejection
    - **Property 9 (link variant): Whitespace-only input is rejected for links**
    - **Validates: Requirements 4.2**

- [ ] 8. Checkpoint — Ensure TodoList and QuickLinks work independently with localStorage
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Wire everything together in `init()` and apply visual polish
  - [ ] 9.1 Write the top-level `init()` function and `DOMContentLoaded` listener
    - Call `GreetingWidget.init()`
    - Call `FocusTimer.init()`
    - Call `TodoList.init(StorageManager)`
    - Call `QuickLinks.init(StorageManager)`
    - Wrap in `document.addEventListener('DOMContentLoaded', init)`
    - _Requirements: 5.5, 6.4_

  - [ ] 9.2 Apply responsive layout and visual polish in `css/style.css` and `index.html`
    - Verify `md:col-span-2` on `#todo-list` and `#quick-links` sections
    - Ensure timer display uses `text-5xl font-mono font-bold tabular-nums`
    - Ensure body text is at least 14px and timer display at least 20px
    - Add hover and focus-visible styles for interactive elements (buttons, inputs)
    - Verify color contrast meets WCAG 2.1 AA (4.5:1 minimum for normal text)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 10. Final checkpoint — Ensure all tests pass and the dashboard opens correctly via file:// protocol
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical milestones
- Property tests validate universal correctness properties (Properties 1–15 from design)
- Unit tests validate specific examples and edge cases
- The app must work via `file://` protocol — no server required
- All CDN links must use HTTPS to avoid mixed-content issues when opened locally

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4", "4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3", "6.4", "6.5", "6.6", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "7.4", "7.5"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["9.2"] }
  ]
}
```
