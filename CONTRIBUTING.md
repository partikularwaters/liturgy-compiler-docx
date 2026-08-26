# Contributing

## Commit authorship and AI assistance

Write commit subjects and descriptions from the author's perspective.
Describe the project change directly—what changed, why, and any relevant
verification. Do not narrate the assistant's activity or phrase the commit as
a report to the user.

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

Use the actual product and model when known. If the model is unknown, name the
product only. Use one `Assisted-by` trailer for each assistant that materially
contributed.

Do not use `Co-authored-by`, invent an AI email address, or describe the AI as
the commit author. Routine formatters, spell-checkers, and autocomplete do not
require attribution.
