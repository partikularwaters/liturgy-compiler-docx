<!-- Verified Index: created during Banka → Galleon migration on 2026-09-10. -->

# Verified Index

## Threshold Check

_Mechanical, not estimated — run `bash scripts/check-galleon-thresholds.sh` to refresh._

_Last run: 2026-09-10._

| File | Words | Threshold | Status |
| --- | --- | --- | --- |
| `verified-index.md` (this file) | 160 | ~2,000 | OK |

---

| ID | Ticket/Plan | Commit | Evidence scope | Claims checked | Invocation | Verdict | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `0001` | Galleon migration integrity repair | unavailable | live observation — replay unavailable; dirty paths: `README.md`, `CONTRIBUTING.md`, `context/progress-tracker.md`, `context/session-notes.md`, `context/delegation-queue.md`, `docs/history/ADOPTION-ASSESSMENT.md`, `scripts/verify-claims.sh` | Active routing, Logbook/Verified Index presence, and repository-side reconcile-script repair are present in the working tree. | `--check-diff README.md`; `--check-diff CONTRIBUTING.md`; `--check-diff context/progress-tracker.md`; `--check-diff context/session-notes.md`; `--check-diff context/delegation-queue.md`; `--check-diff docs/history/ADOPTION-ASSESSMENT.md`; `--check-diff scripts/verify-claims.sh`; `--check-file context/decisions-index.md`; `--check-file context/verified-index.md` | MET | 2026-09-10 |
