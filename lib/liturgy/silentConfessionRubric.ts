// Exact wording as supplied -- not authored here, since this is
// liturgically significant text this project never fabricates. Instructs
// the congregation into silent confession immediately after the Corporate
// Confession prayer. Public (shown to the whole church in both Guide and
// Bulletin, not Leader-only, unlike this Section's other, Leader-only cue)
// -- italic and centered, distinct from every other rubric in this project,
// which is italic but justified/flush-left.
export const SILENT_CONFESSION_SECTION = "Confession of Sin";

// Two languages, equal authority (2026-08-28) -- English is a real,
// per-liturgy stored choice via `sections.silent_confession_language`, not a
// fallback or a translation-on-demand. Which one applies to a given Liturgy
// is decided in the Compile View and carried through unchanged to the Web
// View and DOCX export.
export const SILENT_CONFESSION_RUBRIC_TEXT: Record<"fil" | "en", string> = {
  fil: "Tayo’y magkaroon ng tahimik at taimtim\nna paghahayag ng mga sala sa Diyos.",
  en: "Let us have silent and sincere confession of sins to God.",
};
