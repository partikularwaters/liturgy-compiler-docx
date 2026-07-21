"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { addSelection } from "@/lib/liturgy/addSelectionAction";
import { toEnglishCitation } from "@/lib/bible/bookNamesTagalog";
import { formatCitation } from "@/lib/liturgy/formatCitation";
import { TranslateIcon } from "@/components/liturgy/icons";
import type { ScriptureSelection } from "@/types/liturgy";

interface AddExistingSelectionPanelProps {
  scriptureSelections: ScriptureSelection[];
  liturgyId: string;
  sectionIndex: number;
  onDone: () => void;
}

// Picks a citation already saved to the Scripture Text Library (Feature 20)
// for this Section and places it directly, instead of the Reader being the
// only way to add a Selection. Reuses addSelection() as-is -- dedup,
// typography normalization, and the library re-upsert all already handle a
// citation that's placed a second time correctly, so no new server action
// was needed.
//
// v2 (BSB): a Filipino/English toggle filters this list by translation, and
// each row gets an info icon -- hovering it previews the paired
// alternate-language entry (matched by canonical verse reference, the same
// key lib/selections/companionTranslation.ts uses to create the pair in the
// first place), so the other translation is checkable without switching the
// toggle. A row without a companion yet (pairing is best-effort) just shows
// no icon.
export default function AddExistingSelectionPanel({
  scriptureSelections,
  liturgyId,
  sectionIndex,
  onDone,
}: AddExistingSelectionPanelProps): React.ReactElement {
  const router = useRouter();
  const [language, setLanguage] = useState<"fil" | "en">("fil");
  const filtered = scriptureSelections.filter((s) => s.translation === language);
  const [selectionId, setSelectionId] = useState(filtered[0]?.id ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The Compile View's 3-column layout means this panel can sit anywhere
  // from the far left to the far right of a wide (up to 1400px) page --
  // a tooltip fixed to always open "on the right" would run off-screen for
  // a Section in the rightmost column. Measured at hover time instead of
  // hardcoded, so it flips to the left when there isn't enough room.
  const iconRef = useRef<HTMLSpanElement>(null);
  const [tooltipSide, setTooltipSide] = useState<"left" | "right" | null>(null);
  const TOOLTIP_WIDTH = 256; // matches the w-64 preview box below

  const showTooltip = (): void => {
    const rect = iconRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceOnRight = window.innerWidth - rect.right;
    setTooltipSide(spaceOnRight >= TOOLTIP_WIDTH + 16 ? "right" : "left");
  };
  const hideTooltip = (): void => setTooltipSide(null);

  const selected = scriptureSelections.find((s) => s.id === selectionId);

  // Canonical match key -- book name AND dash style both normalized. Without
  // the formatCitation() pass, a legacy citation still saved with a plain
  // hyphen ("2 Corinthians 9:7-8") would never match its own real companion
  // saved with an en dash ("2 Corinthians 9:7–8"), even though they're the
  // same passage -- caught live in Offertory Call, where exactly this pair
  // existed but the icon wasn't appearing.
  const canonicalKey = (citation: string): string => toEnglishCitation(formatCitation(citation));

  const companionOf = (s: ScriptureSelection): ScriptureSelection | undefined =>
    scriptureSelections.find(
      (other) => other.translation !== s.translation && canonicalKey(other.citation) === canonicalKey(s.citation)
    );

  const handleLanguageChange = (nextLanguage: "fil" | "en"): void => {
    setLanguage(nextLanguage);
    const nextFiltered = scriptureSelections.filter((s) => s.translation === nextLanguage);
    setSelectionId(nextFiltered[0]?.id ?? "");
  };

  const handleSave = (): void => {
    if (!selected) return;
    setIsSaving(true);
    setError(null);
    addSelection(
      liturgyId,
      sectionIndex,
      selected.citation,
      selected.text,
      false,
      selected.marks ?? [],
      null,
      selected.translation
    ).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.refresh();
        onDone();
      } else {
        setError(result.error ?? "Unable to place this Selection right now.");
      }
    });
  };

  return (
    <div className="bg-surface-secondary border border-border rounded-md p-4 flex flex-col gap-3">
      <div className="flex items-center rounded-md border border-border overflow-hidden text-[12px] font-medium self-start">
        <button
          type="button"
          onClick={() => handleLanguageChange("fil")}
          className={
            language === "fil"
              ? "px-2.5 py-1 bg-accent text-accent-foreground"
              : "px-2.5 py-1 bg-surface text-text-secondary hover:bg-surface-secondary"
          }
        >
          AB
        </button>
        <button
          type="button"
          onClick={() => handleLanguageChange("en")}
          className={
            language === "en"
              ? "px-2.5 py-1 bg-accent text-accent-foreground"
              : "px-2.5 py-1 bg-surface text-text-secondary hover:bg-surface-secondary"
          }
        >
          BSB
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted">
          No existing {language === "fil" ? "AB" : "BSB"} Scripture in the library for this Section yet —
          add one via the Reader first.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-text-secondary" htmlFor="existing-selection-select">
              Existing Scripture
            </label>
            <div className="flex items-center gap-2">
              <select
                id="existing-selection-select"
                value={selectionId}
                onChange={(e) => setSelectionId(e.target.value)}
                className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
              >
                {filtered.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.citation}
                  </option>
                ))}
              </select>
              {selected && companionOf(selected) && (
                <span
                  ref={iconRef}
                  onMouseEnter={showTooltip}
                  onMouseLeave={hideTooltip}
                  className="relative shrink-0 flex items-center justify-center w-6 h-6 rounded-full border border-border text-accent-dark cursor-default"
                  title="Alternate translation"
                >
                  <TranslateIcon size={14} />
                  {tooltipSide && (
                    <span
                      className={[
                        "pointer-events-none absolute top-1/2 -translate-y-1/2 w-64 rounded-md border border-border bg-surface p-3 text-[13px] text-text-primary shadow-lg z-10",
                        tooltipSide === "right" ? "left-full ml-2" : "right-full mr-2",
                      ].join(" ")}
                    >
                      <span className="block text-[11px] font-medium text-text-secondary mb-1">
                        {companionOf(selected)!.translation === "en" ? "BSB" : "AB"} —{" "}
                        {companionOf(selected)!.citation}
                      </span>
                      {companionOf(selected)!.text || "(citation only)"}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {selected && (
            <p className="font-serif-body text-[16px] leading-[1.6] text-text-primary whitespace-pre-wrap">
              {selected.text || "(citation only)"}
            </p>
          )}

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Add to Section"}
            </button>
            <button
              type="button"
              onClick={onDone}
              className="self-start bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
