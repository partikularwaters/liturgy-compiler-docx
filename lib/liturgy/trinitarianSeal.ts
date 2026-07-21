import type { TextMark } from "@/types/liturgy";

// Exact wording supplied by Madrid (2026-07-18) -- not authored here, since
// this is liturgically significant text this project never fabricates.
export const TRINITARIAN_SEAL_TEXT: Record<"en" | "fil", string> = {
  fil: "Sa pangalan ng Ama, ng Anak, at ng Banal na Espiritu. Amen.",
  en: "In the name of the Father, of the Son, and of the Holy Spirit. Amen.",
};

// Which Sections may close with a Trinitarian Seal -- shared between the
// Reader (add time) and the Compile View (edit time) so they can't drift.
// Benediction-only. Assurance of Pardon was added here 2026-07-20 but
// removed again 2026-07-22 (Madrid, direct correction): the Seal is spoken
// entirely by the Minister with the Congregation only replying "Amen," and
// this toggle applied identically to both the Selection (Scripture proof
// text) and Formula (Absolution) edit forms in that Section -- there's no
// way to gate it to only the Minister-spoken Formula without a toggle that
// exists per item type, not per Section. Madrid's chosen fix: remove it
// here entirely and hand-author the Seal wording directly into the
// Absolution Formula's own text instead (via /library), where the existing
// Minister/Congregation mark tool already expresses who speaks what.
export const TRINITARIAN_SEAL_SECTIONS = ["Benediction"];

// Single source of truth for "what does text+marks look like once a seal is
// appended" -- used both for the live edit-time preview (MarkEditor) and the
// final saved render (resolveItemText), so they can never drift. Appends the
// seal as `**bold**` markdown past the end of the raw text (never folded
// into it, so existing mark offsets stay valid), and folds the seal into the
// last Congregation/Minister mark when it immediately follows one, since
// that mark renders as its own block-level element -- a plain trailing
// segment after a block element always starts on a new line, which is what
// made the seal look detached from "...Amen." before this existed.
export function applyTrinitarianSeal(
  text: string,
  marks: TextMark[],
  seal: "en" | "fil" | null
): { text: string; marks: TextMark[] } {
  if (!seal) return { text, marks };

  const sealText = TRINITARIAN_SEAL_TEXT[seal];
  const preSealLength = text.length;
  const addition = text ? ` **${sealText}**` : `**${sealText}**`;
  const newText = text + addition;

  let newMarks = marks;
  if (marks.length > 0) {
    const lastMark = marks[marks.length - 1];
    if (lastMark.end === preSealLength && (lastMark.type === "congregation" || lastMark.type === "minister")) {
      newMarks = [...marks.slice(0, -1), { ...lastMark, end: lastMark.end + addition.length }];
    }
  }

  return { text: newText, marks: newMarks };
}
