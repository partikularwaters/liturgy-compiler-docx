# Contributing to Liturgy Compiler

## Commit authorship and AI assistance

Write commit subjects and descriptions from the author's perspective.
Describe the project change directly — what changed, why, and any relevant
verification. Do not narrate the assistant's activity or phrase the commit
as a report to the user.

Not this: "Reviewed the export route, updated the documentation, and verified
the changes before committing."

This: "Make DOCX the default export and align project state with current
behavior."

Keep the configured human Git identity as the commit author.

When an AI assistant materially shaped the commit, add one trailer:

```text
Assisted-by: <provider or product> (<model, if known>)
```

Examples:

```text
Assisted-by: OpenAI Codex (GPT-5.6)
Assisted-by: Anthropic Claude Code (Opus 4.6)
```

Name the actual product and model when available. If the model is unknown, name
the product only. Repeat the trailer when multiple assistants materially
contributed.

“Materially shaped” means the assistant produced or substantially revised code,
documentation, tests, architecture, or analysis embodied in the commit. Routine
formatters, spell-checkers, and autocomplete do not require attribution.

Do not use `Co-authored-by`, invent an AI email address, or describe the AI as
the commit author unless the repository owner explicitly requests co-authorship
and the assistant has a real, verifiable GitHub-linked identity.

## Non-permanent working files

Coordination artifacts created solely for repository maintenance — fresh-session
handoffs, temporary work queues, migration plans, and similar working notes —
are not project documentation and must never sit loose in the repository root.

Put them under `dev/`, which is entirely git-ignored. Everything below it is
local-only by construction, with no per-file `.gitignore` entry required. Delete
a coordination file when the work it supports has shipped; `dev/` is scratch
space, not an archive.

Durable project state belongs in `context/progress-tracker.md`. Settled session
history belongs in `context/overflow/session-notes/` through the project's
established Banka workflow. Do not use `dev/` as a substitute for either
location.
