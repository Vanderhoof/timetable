# Changelog

All notable changes to РШР are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

### Added
- Toast notifications throughout the app — create, edit, delete, import, export actions now show brief feedback in the bottom-right corner

---

## [3.24.0] — 2026-03-17

### Added
- Requirements list: filter buttons (All / Class / Group) to quickly narrow down lesson requirements
- Group requirements now show their parallel group inline in the table
- Parallel group field in the group requirement edit form — fix mismatches without re-importing Excel

### Fixed
- Teacher grid: changing one parallel group's lesson no longer incorrectly highlights the other teacher's cell yellow

---

## [3.22.0] — 2026-03-15

### Added
- Subjects page in Data — lists all subjects with teacher and requirement counts; rename a subject and it cascades everywhere
- Shift+click in Technical mode — force-assign a lesson to a banned or busy slot (marked with red `!`)
- "Override" button on conflicts — mark a ban-violation as intentional; it disappears from the conflict panel until that slot changes
- Gap detection for parallel groups — the Validation panel now reports gaps within groups separately
- Download Substitutions — generates a PNG substitution table for a chosen day (for sharing in a messenger)

### Fixed
- "Copy all" again starts from the Lesson column, without a Day column
- Rooms export: multiClass value now exports as a plain number, not `×2`
- Substitution metadata is preserved when moving a lesson via the context menu
- Teacher export: only the teacher whose lesson actually changed appears in the Changes list

---

## [3.21.0] — 2026-03-04

### Added
- Persistent download folder — the messenger download button remembers the chosen folder; a split-button lets you change it or save elsewhere one-off (Chrome/Edge)

### Fixed
- Cancelled lessons are now marked "cancelled" (red) in the teacher changes list for a day

---

## [3.20.0] — 2026-03-04

### Added
- Day column with date included in "Copy all"

### Fixed
- Cancelled slots are now highlighted yellow in the Teachers export grid
- Auto-generated room code is wrapped in dashes (e.g. `-228А-`) and sorted correctly
- Diff highlight colour changed to `#ffff00` for better visibility

---

## [3.19.0] — 2026-03-04

### Added
- New Year wizard — 4-step flow to archive the current year, clear the schedule, and keep teachers and rooms
- Year archives — stored in-browser; open any past year in read-only mode from Settings
- Formatted paste to Google Sheets — "Copy all" and "Copy selection" now include an HTML version with yellow highlighting that survives the paste
- Force-assign with Shift+click — place a lesson on a banned or busy slot in Weekly mode; marked with red `!`

### Fixed
- Teachers with removed lessons are now correctly included in the Changes list
- Conflict panel no longer suggests pressing `+` in template mode

---

## [3.18.0] — 2026-03-02

### Changed
- Messenger image layout: absent list 40% width, changes list 60% width, both portrait orientation
- "Download for Telegram" button renamed to "Download for messenger"

---

## [3.17.0] — 2026-03-02

### Added
- Partner sync — export a teacher availability JSON and share with a parallel schedule instance; shared teacher slots appear grey and blocked

### Fixed
- Yellow highlight is now preserved when pasting the export grid into Google Sheets (HTML clipboard format)

---

## [3.16.0] — 2026-03-01

### Added
- Duplicate prevention — can't add two teachers with the same name, two rooms with the same code, or two classes/groups with the same name
- Cascade rename — renaming a teacher, room, class, or group updates all references in the schedule, requirements, and substitutions automatically
- "Similar name" hint when adding a teacher or room, to catch typos

---

## [3.15.0] — 2026-02-27

### Changed
- Subject field in teacher edit now offers an autocomplete list from existing subjects

### Fixed
- Editor opens on the correct first visible class, not always on 1А
- Scroll-to-top button on the Data page now appears correctly

---

## [3.14.0] — 2026-02-25

### Added
- School week settings — choose number of days (5 or 6) and lessons per day (5–8)
- 6-day schedule support — create Weekly schedules with 6 days
- Teacher messenger field — paste a link (e.g. `https://t.me/username`) to get a direct button in the teachers table

### Changed
- App renamed to **РШР** in the header and browser tab

---

## [3.13.0] — 2026-02-25

### Added
- Groups page in Data — view and rename groups; parallel link shown inline
- Scroll-to-top button on the Data page

### Changed
- Messenger images are now 1125 px wide (was 750 px)
- Teacher changes image renamed from "Учителя" to "Изменения"

### Fixed
- Room change in the Changes list now shows the class name in the log
- Bulk delete log shows affected class names

---

## [3.12.0] — 2026-02-25

### Changed
- Replacement panel shows teacher names only; clicking highlights all their lessons
- Yellow highlight removed from the editor grid in Weekly mode (yellow stays in export only)
- Excluded classes moved to the bottom of the class list
- Messenger export: teachers section shows classes only, no lesson numbers; includes teachers with removed lessons

---

## [3.11.0] — 2026-02-20

### Added
- Download for messenger — exports PNG images optimised for mobile: class changes table, teacher changes list, absent teachers list

### Changed
- Class sort order: by grade number everywhere (5а, 9б, 11в — not alphabetical)
- Export file names include a timestamp prefix

### Fixed
- App no longer crashes when pasting a lesson that is already fully scheduled
- Yellow highlight uses the active template as the source of truth

---

## [3.9.0] — 2026-02-18

### Added
- Room capacity check — rooms with insufficient capacity for the class are excluded from the picker
- Substitute teachers — Replacement panel now lists free teachers who teach the same subject
- Two teachers per lesson — a lesson can have a second teacher; both shown in grid and export
- Temporary lessons — add extra lessons in Weekly/Technical modes via the `+` button; saved with the version
- Gap exclusions — configure which classes are excluded from gap detection (e.g. primary school); suggested automatically on first open
- Context menu for unscheduled lessons — mark as "sick" or "done" in Weekly mode

### Fixed
- Group lessons coexistence check uses the Groups table as the only authority — no heuristic fallbacks
- Move mode no longer gets stuck when switching class or opening the context menu
- Escape correctly cancels move mode at every step

---

## [3.8.0] — 2026-02-12

### Added
- Move lesson — context menu → "Move", then click target slot
- Day filter in export (Classes and Teachers views) — shows only changed classes for the selected day
- Gap detection — Validation panel lists empty slots between filled ones, for classes and teachers
- Classes tab on the Data page

---

## [3.7.0] — 2026-02-11

### Added
- Sticky header row in the editor grid
- Copy button on each data table (Teachers, Rooms, Requirements) — TSV format for Excel
- Authors and version shown in Settings
- Context hints in every section; tooltips on all buttons
- Expanded empty states with next-step guidance

### Fixed
- Group lessons in two cells now paste correctly into Google Sheets (two rows, no column shift)

---

## [3.6.0] — 2026-02-10

### Added
- Default room per teacher — shown first in the room picker; set in Data or imported from Excel
- Copy lesson — right-click → "Copy", then click any free slot
- Save / Open file — export all data to `.json` and import on another device
- Auto-backup before every import
- Temporary lessons — `+` button in the lesson panel for Weekly and Technical types

### Changed
- Save button turns red when there are unsaved changes
- Classes with unscheduled lessons highlighted yellow in the template class list

---

## [3.5.0] — 2026-02-09

### Added
- Teachers and Rooms export grids — two new tabs on the Export page
- Yellow diff highlight — cells differing from the template highlighted yellow in Weekly mode
- Absent teachers panel — mark teachers absent; their lessons highlighted orange in the grid

---

## [3.4.0] — 2026-02-02

### Added
- Copy grid to clipboard — click-drag selection + "Copy all" / "Copy selection" buttons, TSV format

### Changed
- Replacement panel replaces the modal — lesson list shown in a side panel
- Export page simplified to grid-only view

---

## [3.3.0] — 2026-02-02

### Added
- Date picker when creating a Weekly schedule
- Change room — context menu option to swap a scheduled lesson's room

---

## [3.2.0] — 2026-02-01

### Added
- Unsaved changes warning — on tab close, section switch, or version load
- Lesson replacement via context menu
- Week date display in Weekly schedules (header, version list, grid column headers)

---

## [3.1.0] — 2026-02-01

### Added
- In-app data editor — edit teachers, rooms, and requirements without Excel
- Save As — duplicate a version from the Start page dropdown
- Editable version names in the editor header

---

*Format: [Keep a Changelog](https://keepachangelog.com/)*
