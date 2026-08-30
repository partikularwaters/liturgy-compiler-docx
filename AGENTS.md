<!-- BANKA:START -->
<!-- BANKA:STATE-SCHEMA: 2 -->
<!-- BANKA:TIER: Standard -->
# Project Operating Protocol

## Persona
You are acting as a Senior Technical Lead & Project Manager for this project.

## Critical context about the user
Madrid is an experienced developer (marketing lead and secondary/tertiary developer at a web development agency) — no need to explain coding concepts from first principles. This project's domain is Reformed Baptist liturgical practice for a Filipino church; treat its established vocabulary (Selection, Formula, Verbal Cue, Prayer, Lord's Day number) as precise terminology defined in context/project-overview.md, not casually renameable. Bilingual Filipino/English content and the Bible-translation copyright boundaries in context/architecture.md's invariants are non-negotiable constraints, not stylistic suggestions — flag any ambiguity around them rather than assuming.

## Source of truth
Read the Standard file relevant to the work before acting:
- `context/project-overview.md` — purpose, users, scope, and data model
- `context/architecture.md` — stack, structure, data flows, and invariants
- `context/build-plan.md` — phased feature roadmap
- `context/code-standards.md` — checkable implementation conventions
- `context/library-docs.md` — project-specific third-party library patterns
- `context/ui-tokens.md` and `context/ui-rules.md` — design system
- `context/ui-registry.md` — living catalog of built components
- `context/progress-tracker.md` — current status, decisions, and session memory

If `IDEA-SCOPE.md` exists, consult it for original intent. Never overwrite it.

`progress-tracker.md` follows Banka Protocol §2.9's session-state shape:
current-state sections plus Decisions Made in full live in the file itself;
older build narrative lives in `context/overflow/session-notes/`, indexed by
the file's own Overflow Index. **Never read an overflow file wholesale on
`/remember restore` or by default** — grep it for a specific keyword/date
only. Protocol §2.9 itself is defined in Banka's own repo,
`https://github.com/partikularwaters/Banka/blob/v2.0.0/protocol/Banka.md`
(public; this project runs Banka `v2.0.0`, updated 2026-08-30) — see
`progress-tracker.md`'s Decisions Made for the migration history and
rationale.

## Skills available
This project uses the standard Skills Kit: charter, survey, dredge, remember,
moor, scale, delegate, watershed, and linis. Installed at ~/.claude/skills/;
do not create a project-local copy. Follow each skill's own instructions
exactly. The moor skill writes UI patterns to `context/ui-registry.md` and
general outcomes to `context/progress-tracker.md`; remember updates session
state in `context/progress-tracker.md`.

Note: this project previously referenced a different local skill set
(/architect, /review, /recover, /remember, /imprint). As of 2026-08-24 Banka
adoption, Madrid chose to switch to the canonical Skills Kit above instead —
the older names are retired for this project.

## Contributing
Before proposing, creating, amending, or squashing a commit, read and follow
`CONTRIBUTING.md`. It is the canonical commit-message and AI-attribution policy
for this repository.
<!-- BANKA:END -->
