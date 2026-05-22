# Requirements Document

## Introduction

The **Todo-Life Dashboard** is a single-page, client-side web application that serves as a personal productivity hub. It combines a contextual greeting with the current time and date, a Pomodoro-style focus timer, a persistent to-do list, and a quick-access link launcher — all stored locally in the browser with no backend required. The app is designed to be minimal, fast, and usable as a standalone web page or browser extension.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-of-day greeting message.
- **Focus_Timer**: The UI component that implements a 25-minute countdown timer with Start, Stop, and Reset controls.
- **Todo_List**: The UI component that manages a collection of user-defined tasks.
- **Task**: A single item in the Todo_List, consisting of a text description and a completion status.
- **Quick_Links**: The UI component that displays a set of user-defined shortcut buttons that open URLs in a new browser tab.
- **Link**: A single item in Quick_Links, consisting of a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.
- **Storage_Manager**: The JavaScript module responsible for reading and writing data to Local_Storage.
- **Timer_State**: The current operational state of the Focus_Timer — one of: `idle`, `running`, or `paused`.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a personalized greeting when I open the Dashboard, so that I have immediate context about the time of day.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updated every minute.
2. THE Greeting_Widget SHALL display the current full date (e.g., "Monday, 26 May 2025").
3. WHEN the local time is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the local time is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the local time is between 18:00 and 20:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the local time is between 21:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".
7. THE Greeting_Widget SHALL update the displayed time and greeting without requiring a page reload.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can manage focused work sessions using the Pomodoro technique.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a countdown value of 25 minutes and 00 seconds (25:00).
2. WHEN the Timer_State is `idle` or `paused` and the user activates the Start control, THE Focus_Timer SHALL begin counting down one second at a time and set Timer_State to `running`.
3. WHEN the Timer_State is `running` and the user activates the Stop control, THE Focus_Timer SHALL pause the countdown and set Timer_State to `paused`.
4. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop the countdown, reset the displayed value to 25:00, and set Timer_State to `idle`.
5. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically, set Timer_State to `idle`, and display a browser notification or visible alert to inform the user that the session has ended.
6. WHILE Timer_State is `running`, THE Focus_Timer SHALL display the remaining time in MM:SS format, updated every second.
7. THE Focus_Timer SHALL display the Start control only when Timer_State is `idle` or `paused`.
8. THE Focus_Timer SHALL display the Stop control only when Timer_State is `running`.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, mark as done, and delete tasks in a persistent to-do list, so that I can track my daily work items across browser sessions.

#### Acceptance Criteria

1. WHEN the user submits a non-empty task description via the add-task input, THE Todo_List SHALL create a new Task with the provided description and a completion status of `incomplete`, and append it to the list.
2. IF the user submits an empty or whitespace-only task description, THEN THE Todo_List SHALL reject the submission and display an inline validation message.
3. WHEN the user activates the edit control on a Task, THE Todo_List SHALL display the Task's description in an editable field and allow the user to save the updated description.
4. WHEN the user saves an edited Task with a non-empty description, THE Todo_List SHALL update the Task's description and persist the change to Local_Storage.
5. IF the user saves an edited Task with an empty or whitespace-only description, THEN THE Todo_List SHALL reject the save and retain the original description.
6. WHEN the user activates the complete control on an `incomplete` Task, THE Todo_List SHALL set the Task's completion status to `complete` and apply a visual distinction (e.g., strikethrough text).
7. WHEN the user activates the complete control on a `complete` Task, THE Todo_List SHALL set the Task's completion status to `incomplete` and remove the visual distinction.
8. WHEN the user activates the delete control on a Task, THE Todo_List SHALL remove the Task from the list and persist the change to Local_Storage.
9. THE Storage_Manager SHALL persist the full Task list to Local_Storage after every add, edit, complete-toggle, or delete operation.
10. WHEN the Dashboard loads, THE Todo_List SHALL restore all Tasks from Local_Storage and render them in their saved order and completion state.
11. THE Todo_List SHALL display a placeholder message (e.g., "No tasks yet. Add one above!") WHEN the Task list is empty.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and launch favorite website shortcuts from the Dashboard, so that I can quickly navigate to frequently used URLs without typing them.

#### Acceptance Criteria

1. WHEN the user submits a Link with a non-empty label and a valid URL, THE Quick_Links SHALL add the Link to the collection and persist it to Local_Storage.
2. IF the user submits a Link with an empty label or an empty URL, THEN THE Quick_Links SHALL reject the submission and display an inline validation message.
3. IF the user submits a Link with a URL that does not begin with `http://` or `https://`, THEN THE Quick_Links SHALL prepend `https://` to the URL before saving.
4. WHEN the user activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab.
5. WHEN the user activates the delete control on a Link, THE Quick_Links SHALL remove the Link from the collection and persist the change to Local_Storage.
6. THE Storage_Manager SHALL persist the full Link collection to Local_Storage after every add or delete operation.
7. WHEN the Dashboard loads, THE Quick_Links SHALL restore all Links from Local_Storage and render them as clickable buttons.
8. THE Quick_Links SHALL display a placeholder message (e.g., "No links saved yet. Add one above!") WHEN the Link collection is empty.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want all my tasks and quick links to be automatically saved and restored, so that my data is never lost when I close or refresh the browser.

#### Acceptance Criteria

1. THE Storage_Manager SHALL use the browser's `localStorage` API as the sole persistence mechanism.
2. THE Storage_Manager SHALL serialize Task and Link data as JSON strings before writing to Local_Storage.
3. THE Storage_Manager SHALL deserialize JSON strings from Local_Storage into Task and Link objects on Dashboard load.
4. IF Local_Storage data is missing or malformed, THEN THE Storage_Manager SHALL initialize with empty Task and Link collections without throwing an unhandled error.
5. THE Dashboard SHALL function fully without any network requests or backend server.

---

### Requirement 6: Technical Constraints

**User Story:** As a developer, I want the Dashboard built with plain HTML, CSS (Tailwind), and vanilla JavaScript, so that it requires no build tools, frameworks, or server to run.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using HTML, CSS with Tailwind CSS (CDN), and vanilla JavaScript with no frontend frameworks.
2. THE Dashboard SHALL load and operate correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari.
3. THE Dashboard SHALL consist of exactly one HTML file, one CSS file inside a `css/` directory, and one JavaScript file inside a `js/` directory.
4. THE Dashboard SHALL be fully functional when opened directly as a local file (via `file://` protocol) without a web server.
5. WHERE icon support is available via CDN, THE Dashboard SHALL use an icon library (e.g., Font Awesome or Heroicons) for UI controls such as add, edit, delete, and complete.

---

### Requirement 7: Visual Design and Responsiveness

**User Story:** As a user, I want a clean, readable, and visually organized interface, so that I can use the Dashboard comfortably on any screen size.

#### Acceptance Criteria

1. THE Dashboard SHALL apply a consistent visual hierarchy with clear section headings for each widget (Greeting, Focus Timer, To-Do List, Quick Links).
2. THE Dashboard SHALL use a readable font size of at least 14px for body text and at least 20px for the timer display.
3. THE Dashboard SHALL render correctly on viewport widths from 320px to 1920px without horizontal scrolling.
4. WHEN the viewport width is 768px or wider, THE Dashboard SHALL display widgets in a multi-column layout.
5. WHEN the viewport width is below 768px, THE Dashboard SHALL display widgets in a single-column stacked layout.
6. THE Dashboard SHALL provide sufficient color contrast between text and background colors to meet WCAG 2.1 AA contrast ratio requirements (minimum 4.5:1 for normal text).
