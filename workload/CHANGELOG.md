# Changelog — Редактор нагрузки

All notable changes to the Workload Editor are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

---

## [1.11.2] — 2026-03-18

### Added
- Toast notifications throughout the app — every action (add, save, delete, import, undo) now shows brief feedback in the bottom-right corner; deletions are red, success is green, neutral info is blue

### Fixed
- Undo on the Assignments tab is now stable across tab switches; "Assign all classes" no longer stacks duplicate history entries

---

## [1.11.0] — 2026-03-18

### Fixed
- Undo correctly reverses class deletion even after switching to another tab

### Changed
- Workload column in Assignments is 20% wider — two classes now fit per line

---

## [1.10.0] — 2026-03-16

### Fixed
- "Part" column (Mandatory / Elective) is now editable inline via a dropdown
- Undo for class deletion now also restores assignments and homeroom links
- Subject short names are preserved when loading a new curriculum plan file
- Workload column in Assignments shows only subjects the teacher actually teaches in that class (zeros removed)
- Workload column: if a teacher covers both groups of a split subject, `×2` suffix is appended

---

## [1.9.0] — 2026-03-15

### Added
- "Part" column in the curriculum plan table — shows Mandatory or Elective; a divider line separates the two parts
- Undo/redo in the Curriculum Plan tab (Ctrl+Z / Ctrl+Shift+Z)
- Confirm button moved to the top of the page and highlighted — no longer hidden below a long table
- Subject short names are preserved when reloading the curriculum plan
- Print department workload button — opens a print-ready workload summary for the selected department
- Each download button remembers its own folder independently
- "Send to deputy" button — appears when the editor has a single department; generates a file for the deputy principal
- Version number in the header — click opens an About dialog
- "＋ Class" button inline in the grade header row
- Copy class — duplicates all hours and group counts to a new class
- Workload column in Assignments — for single-subject tables shows a class list; for multi-subject shows compact `5б(2/0/1)` notation
- Undo/redo in Assignments (Ctrl+Z / Ctrl+Shift+Z, and toolbar buttons)
- "Load file…" option in the Save menu — restores full state from a backup file
- Teacher autocomplete when adding a teacher to a department table

### Changed
- Navigation tabs in Assignments stay fixed while scrolling
- Teachers exported as "Surname I.O." — matches the format expected by РШР
- Browser tab title changed to "Редактор нагрузки"
- Department export button renamed: "Download starter file" → "Export deputy file"
- Subject list in department table is sorted alphabetically

### Fixed
- A subject that appears in both Mandatory and Elective parts no longer changes both when editing one
- Workload column no longer truncates text — shows up to 4 lines
- Importing a department file on a fresh install (no plan loaded) now works
- Subject names with double spaces no longer appear twice in the department subject list
- "Assign all classes" button is hidden when a table has multiple teachers

---

## [1.6.0] — 2026-03-11

### Added
- Teacher workload column — shows total weekly hours; highlighted red if over the limit
- "＋ Class" and "✕" buttons per class in the curriculum plan
- Group count selector (1 gr / 2 gr) in the class column header
- Department exchange — download a starter JSON file per department for the department head; import it back after the head fills in assignments
- "Assign all classes" button — for single-subject tables without groups, assigns a teacher to all classes in one click
- Departments restructured — a department can now contain multiple tables (e.g. History department → History table + Social Studies table); 8 departments × 16 tables default set

### Changed
- Teacher workload no longer includes "Conversations about important things" hour (paid separately)
- Group count is now set in the Curriculum Plan tab only; the Assignments tab shows it as read-only

---

## [1.5.0] — 2026-03-10

### Added
- занятия.xlsx now includes subject short names and teacher names in "Surname I.O." format
- One-click assignment for cells with a single available subject
- Opening a dropdown in one cell automatically closes others
- Class header turns green when the department is fully staffed for that class
- "Both groups" option in the dropdown — one teacher takes both groups; two lessons generated on export
- Editable group names inline in the dropdown (e.g. "Girls" / "Boys" instead of auto-generated initials)
- Department reorder buttons (▲/▼)
- Two totals columns: "Subject total" (department subjects only) and "Teacher total" (all subjects + homeroom)
- Row hover highlights the teacher name

### Fixed
- Assignment cell correctly blocks when both groups of a split subject are already filled
- Department totals row shows the correct denominator for split subjects

---

## [1.4.0] — 2026-03-09

### Added
- A teacher can belong to multiple departments simultaneously
- Single-teacher enforcement for non-split subjects — only one teacher can be assigned
- Auto-assign on first click — for departments with defined subjects, all department subjects are pre-selected for the class; deselect as needed
- "Unassigned hours" total row in the Assignments table
- Teacher names shown as "Surname I.O." in Assignments, Homeroom, and Department views; full name on hover
- Subject short names in the assignment dropdown and department subject list

---

## [1.3.0] — 2026-03-09

### Added
- Department subjects — mark which subjects each department teaches; Assignments table filters to those subjects automatically
- Short subject names in assignment cells; full name in the dropdown
- Teacher and Total columns stay fixed during horizontal scroll
- Group count per class — shown in the class column header; click to toggle; second teacher blocked when set to 1 group
- Department row — shows assigned vs. planned hours per class; turns green when complete
- Unassigned row — remaining hours per class; red when non-zero
- Sticky header and tabs while scrolling
- Save button turns red on unsaved changes
- Save button with folder picker (split-button); standard download on Safari
- Editable hours in the curriculum plan table
- Add and delete subjects in the plan (with confirmation if assignments exist)

### Changed
- Department view shows only members of that department (no global checkbox list)
- Remove-from-department button; confirmation before removing from the teacher list entirely
- Teachers sorted alphabetically in all tabs
- Department row shows up to 10 teacher names (was 3)

---

## [1.2.0] — 2026-03-08

### Added
- Save button — downloads a backup JSON; data still auto-saves after every action
- Hours totals row in the curriculum plan; cell turns red if the sum doesn't match the Excel total

### Fixed
- Parser now collects class names across multiple rows — classes like 6-б and 6-мк are no longer missed

### Changed
- Subject short name now applies to all grades at once (was per-grade only)
- Teacher initials format changed from "Л.В." to "ЛВ" (no dots); existing data migrates automatically
- Room column removed from the teachers list (field remains in the edit form)
- App centred horizontally

---

## [1.1.0] — 2026-03-07

### Added
- Print workload button — opens a print-ready teacher workload form
- Import teachers from РШР data file — skips duplicates automatically

### Changed
- "Departments" renamed to "Кафедры" throughout the UI
- Curriculum plan parser rewritten for the actual Excel format
- Class names normalised to school standard (e.g. "5а" → "5-а")
- Tab order: Curriculum Plan → Departments → Teachers → Assignments → Homeroom → Export
- Teachers are now added directly inside a department (＋ Teacher button per department)

---

## [1.0.0] — 2026-03-07

Initial release.

### Added
- Curriculum Plan tab — load an Excel file, edit subject short names, mark split subjects
- Teachers tab — manage teachers with name, initials (auto-filled), room, and homeroom class
- Departments tab — assign teachers to departments; default set included
- Assignments tab — teacher × class grid with subject picker; workload limit indicators; "Check workload" button
- Homeroom tab — link a homeroom teacher to each class; "Conversations about important things" added automatically (1 h/week)
- Export tab — download `занятия.xlsx` with two sheets (class lessons and group lessons) ready for import into РШР
- Auto group detection — two teachers on the same subject in the same class become groups
- Built-in SanPin hour limits per grade
- Data saved in browser (localStorage) — close and return without losing work
- Runs fully locally, no server required

---

*Format: [Keep a Changelog](https://keepachangelog.com/)*
