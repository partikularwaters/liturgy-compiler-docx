import { applyTrinitarianSeal } from "@/lib/liturgy/trinitarianSeal";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import { displayCitation } from "@/lib/bible/bookNamesTagalog";
import { resolveVerbalCueTemplate, type VerbalCueRun } from "@/lib/liturgy/resolveVerbalCueTemplate";
import { getDefaultPrayerKind } from "@/lib/liturgy/prayerKindPolicy";
import type { Formula, Item, Prayer, Song, TextMark } from "@/types/liturgy";

export interface ResolvedItem {
  label: string | null;
  text: string;
  leaderOnly: boolean;
  // Feature 26: true only for a "Rubric style" Verbal Cue -- rendered
  // Sentence case + italic instead of the default treatment. Always false
  // for every other item type.
  rubric: boolean;
  // Set only for Verbal Cue items -- `text` split into runs so the
  // substituted {{scripture}}/{{song}} token renders in citation-red while
  // the rest of the cue's prose stays plain (see
  // resolveVerbalCueTemplate.ts). Absent for every other item type.
  verbalCueRuns?: VerbalCueRun[];
  // Feature 21: set only for Song items -- `text` above already holds the
  // title (what every audience sees), `song` carries the rest of the
  // metadata for surfaces that show it (Leader Guide only, per §L). Only
  // the display-relevant fields, not a full library Song row (a placed
  // SongItem's snapshot has no `id`/`sectionName`/`translation`/`pairedId`
  // of its own -- see resolveBase's "song" case).
  song?: Pick<Song, "title" | "kind" | "attribution" | "yearPublished" | "notes">;
  // Set for Selection/Formula (the two TrinitarianSealable item types) --
  // callers must render marks from here, not item.marks directly, once a
  // seal has been appended (see resolveItemText's own comment below).
  marks?: TextMark[];
}

// Single source of truth for "what does this Item actually display" — used by
// both the Compile View (SectionCard) and the PDF export, so they can never
// drift apart. leaderOnly is true for Formula/Verbal Cue items whose
// visibility is set to 'leader_only', and for Prayer items whose
// library entry's `kind` is 'leader' (Selection has no such concept); the
// Bulletin export and the "Leader only" badge both key off it.
// Exported separately so callers that need an item's displayed text
// *without* a Trinitarian Seal appended (e.g. FormulaEditForm's textarea,
// which must edit the underlying override text, not a seal baked on top of
// it) can get it without duplicating the per-type resolution logic above.
export function resolveBase(
  item: Item,
  formulas: Formula[],
  prayers: Prayer[],
  songs: Song[] = [],
  siblingItems: Item[] = []
): ResolvedItem {
  switch (item.type) {
    case "selection":
      return {
        label: displayCitation(formatCitation(item.citation), item.translation),
        text: item.text,
        leaderOnly: false,
        rubric: false,
        marks: item.marks ?? [],
      };
    case "formula": {
      const formula = formulas.find((f) => f.id === item.formulaId);
      const text = item.overrideText ?? formula?.defaultText ?? "(Formula not found)";
      return {
        label: formula?.name ?? "Formula",
        text,
        leaderOnly: item.visibility === "leader_only",
        rubric: false,
        marks: item.marks ?? [],
      };
    }
    case "verbal_cue": {
      const rawText = item.showAlternate && item.textAlternate ? item.textAlternate : item.text;
      const resolvedCue = resolveVerbalCueTemplate(rawText, siblingItems, formulas, songs);
      return {
        label: "Verbal Cue",
        text: resolvedCue.text,
        leaderOnly: item.visibility === "leader_only",
        rubric: item.rubric ?? false,
        verbalCueRuns: resolvedCue.runs,
      };
    }
    case "prayer": {
      // Snapshot taken at placement time (see PrayerItem's own comment) --
      // falls back to a live library lookup only for a liturgy placed
      // before this fix shipped, which has no snapshot fields at all.
      if (item.text !== undefined) {
        return {
          label: "Prayer",
          text: item.text,
          leaderOnly: item.leaderOnly ?? false,
          rubric: false,
          marks: item.marks ?? [],
        };
      }
      // Genuinely ancient fallback (placed before the 2026-08-25 snapshot
      // fix, so it has no item.text/leaderOnly at all) -- Prayer.kind no
      // longer exists as a meaningful fact (Track B, 2026-08-31), so this
      // falls back to the same per-Section default policy a fresh placement
      // would start from, keyed off the library Prayer's own Section (Prayer
      // rows are Section-scoped by name already).
      const prayer = prayers.find((p) => p.id === item.prayerId);
      return {
        label: "Prayer",
        text: prayer?.text ?? "(Prayer not found)",
        leaderOnly: getDefaultPrayerKind(prayer?.sectionName ?? "") === "leader",
        rubric: false,
        marks: prayer?.marks ?? [],
      };
    }
    case "sermon": {
      // All four fields are public (leaderOnly: false) -- Title/Series lead
      // as a heading-like line, Passage is the Scripture reference, Preacher
      // trails last. Absent fields (older records, or fields left blank)
      // are simply skipped, never rendered as an empty line.
      // NOTE: Compile View, Web View, and DOCX each render Sermon via their
      // own dedicated component (SermonBody / sermonParagraphs) reading the
      // raw item directly, not this flat text -- they need small-caps-title/
      // centered structure this single string can't carry, matching Song's
      // and Verbal Cue's existing precedent of bypassing resolved.text for
      // structured display. This case is still the live path for the frozen
      // legacy PDF (lib/pdf/LiturgyDocument.tsx), which has no per-type
      // Sermon branch and renders resolved.text generically for every item.
      const lines = [
        [item.title, item.series].filter(Boolean).join(" — "),
        item.passage,
        item.preacher,
      ].filter(Boolean);
      return { label: "Sermon", text: lines.join("\n"), leaderOnly: false, rubric: false };
    }
    case "song": {
      // Snapshot taken at placement time (see SongItem's own comment) --
      // same pre-fix fallback as Prayer above.
      if (item.title !== undefined && item.kind !== undefined) {
        return {
          label: null,
          text: formatCitation(item.title),
          leaderOnly: false,
          rubric: false,
          song: {
            title: item.title,
            kind: item.kind,
            attribution: item.attribution ?? null,
            yearPublished: item.yearPublished ?? null,
            notes: item.notes ?? null,
          },
        };
      }
      const song = songs.find((s) => s.id === item.songId);
      return {
        label: null,
        text: song ? formatCitation(song.title) : "(Song not found)",
        leaderOnly: false,
        rubric: false,
        song,
      };
    }
  }
}

// Single source of truth for "what does this Item actually display" — used by
// both the Compile View (SectionCard) and the PDF export, so they can never
// drift apart. leaderOnly is true for Formula/Verbal Cue items whose
// visibility is set to 'leader_only', and for Prayer items whose
// library entry's `kind` is 'leader' (Selection has no such concept); the
// Bulletin export and the "Leader only" badge both key off it.
export function resolveItemText(
  item: Item,
  formulas: Formula[],
  prayers: Prayer[],
  songs: Song[] = [],
  siblingItems: Item[] = []
): ResolvedItem {
  const resolved = resolveBase(item, formulas, prayers, songs, siblingItems);

  // Trinitarian Seal: a fixed, bolded closing line appended immediately
  // after whichever item type carries it (TrinitarianSealable) -- a real
  // `bold` mark so it renders bold everywhere applyMarks() already runs,
  // without a new rendering path. applyTrinitarianSeal() is the single
  // source of truth for this (shared with MarkEditor's live edit-time
  // preview, so they can't drift) -- it also folds the seal into a trailing
  // Congregation/Minister mark rather than leaving it as a separate
  // block-breaking segment. Generic across item types on purpose:
  // Benediction seals a Selection, Assurance of Pardon seals the Absolution
  // Formula.
  if ("trinitarianSeal" in item && item.trinitarianSeal) {
    const sealed = applyTrinitarianSeal(resolved.text, resolved.marks ?? [], item.trinitarianSeal);
    resolved.text = sealed.text;
    resolved.marks = sealed.marks;
  }

  return resolved;
}
