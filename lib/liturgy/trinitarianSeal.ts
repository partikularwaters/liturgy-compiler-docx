// Exact wording supplied by Madrid (2026-07-18) -- not authored here, since
// this is liturgically significant text this project never fabricates.
export const TRINITARIAN_SEAL_TEXT: Record<"en" | "fil", string> = {
  fil: "Sa pangalan ng Ama, ng Anak, at ng Banal na Espiritu. Amen.",
  en: "In the name of the Father, of the Son, and of the Holy Spirit. Amen.",
};

// Only Benediction ends in a Trinitarian Seal -- shared between the Reader
// (add time) and the Compile View (edit time) so they can't drift.
export const TRINITARIAN_SEAL_SECTIONS = ["Benediction"];
