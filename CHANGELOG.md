# Changelog

Versioning practice adopted 2026-09-07 — see `RELEASE-GOVERNANCE.md` for
what a version number means here and how it's applied. Entries below
`0.5.0` are retroactive: real work, classified after the fact, with no Git
tag created for them.

## 0.5.0 — 2026-09-05

Production migration-integrity pass. Two migrations that had been built,
tested, and committed were found to have silently never run in Production;
both are fixed and confirmed live.

- Fixed a Production outage: Song creation and placing an existing
  Psalm/Hymn both failed, because `song_section_tags` and
  `create_song_with_tags`/`update_song_with_tags` had never actually been
  applied in Production despite being shipped in Track B.
- Corrected a second migration (`section_item_types.sql`) before it ever
  ran — its Morning-template mapping was stale by one Section since Feature
  28's earlier split, which would have overwritten five Sections' allowed
  item types with the wrong values. Also removed Formula from
  Benediction/Charge/The Great Commission as originally intended, and added
  Song to Vesper's Offertory & Thanksgiving.
- Scripture Selections now share one Library between Morning's split
  "Offertory Call" and Vesper's combined "Offertory & Thanksgiving,"
  without restructuring either template.
- A Compiler's new Song or Prayer now reaches the Curator Inbox
  immediately, instead of needing a separate manual submit step.
- Confession of Sin gained the Congregation/Small Caps marking toolbar.

## 0.4.0 — 2026-09-03

Track B closed: unified Library entry points, six item types, Song
multi-Section tagging, and a split of session-state files per Banka's
bloat-prevention protocol.

## 0.3.0 — 2026-08-30

Track A closed: Liturgy Row Redesign with deletion accountability, and the
emil-design-eng motion charter completed across all six phases.

## 0.2.0 — 2026-08-25

Banka Standard-tier protocol adopted. Post-adoption stabilization backlog
(BA-003 through BA-007) closed: a `section_items` position race, silent
export truncation on read failure, an outdated Next.js with known
vulnerabilities, and a source-data transcription audit.

## 0.1.0 — 2026-07-18

v1 definition of done reached and live in Production: bilingual Bible
reader, six-part item model (Selection, Formula, Verbal Cue, Prayer,
Sermon, Song), fixed Morning/Vesper templates with computed Lord's Day
numbering, dual DOCX export (Leader Guide, Congregation Bulletin), and a
shareable public Liturgy Web View.
