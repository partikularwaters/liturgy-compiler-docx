"use client";

import { useEffect, useRef, useState } from "react";
import type { TextMark } from "@/types/liturgy";
import { autosizeTextarea } from "@/lib/text/autosize";
import { shiftMarksForEdit } from "@/lib/text/marks";
import CitationField from "@/components/liturgy/CitationField";
import MarkEditor from "@/components/liturgy/MarkEditor";

interface AddSelectionPanelProps {
  targetLabel: string;
  initialCitation: string;
  initialText: string;
  alreadySaved: boolean;
  isSaving: boolean;
  saveError: string | null;
  onSave: (
    citation: string,
    text: string,
    amenExpected: boolean,
    marks: TextMark[],
    trinitarianSeal: "en" | "fil" | null
  ) => void;
  // Feature 22: true for the handful of long-reading Sections
  // (redesign-plan-v1.1.md §M) where only the citation is meant to be
  // stored -- lets the user clear the text field instead of it being a
  // silent server-side rejection.
  textOptional?: boolean;
  // Feature 27: Amen Rule (redesign-plan-v1.1.md §X) -- true only when the
  // target Section is dynamic-naming (a "Psalm/Hymn of ..." song slot),
  // since the question "does this piece end in a sung Amen" is meaningless
  // for a Scripture reading.
  isSongSlot?: boolean;
  // Feature 25: which marks this Section's Scripture text can carry --
  // empty/omitted means no marking toolbar at all.
  availableMarks?: Exclude<TextMark["type"], "bold">[];
  // Trinitarian Seal (Benediction only) -- appends a fixed, bolded closing
  // line instead of requiring it to be typed by hand.
  allowTrinitarianSeal?: boolean;
}

export default function AddSelectionPanel({
  targetLabel,
  initialCitation,
  initialText,
  alreadySaved,
  isSaving,
  saveError,
  onSave,
  textOptional = false,
  isSongSlot = false,
  availableMarks = [],
  allowTrinitarianSeal = false,
}: AddSelectionPanelProps): React.ReactElement {
  const [citation, setCitation] = useState(initialCitation);
  const [text, setText] = useState(initialText);
  const [amenExpected, setAmenExpected] = useState(false);
  const [marks, setMarks] = useState<TextMark[]>([]);
  const [trinitarianSeal, setTrinitarianSeal] = useState<"en" | "fil" | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    autosizeTextarea(textareaRef.current);
  }, [text]);

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
      <p className="text-[13px] font-medium text-text-secondary">Adding to: {targetLabel}</p>

      {alreadySaved ? (
        <span className="self-start rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-success-light text-success-foreground">
          Already saved to this Section
        </span>
      ) : (
        <>
          <CitationField value={citation} onChange={setCitation} />
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-text-secondary" htmlFor="selection-text">
              {textOptional ? "Text (optional — this Section is read aloud in full)" : "Text"}
            </label>
            <textarea
              id="selection-text"
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setMarks((prev) => shiftMarksForEdit(text, e.target.value, prev));
                setText(e.target.value);
              }}
              rows={3}
              className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent resize-none min-h-[96px] overflow-hidden"
            />
            {textOptional && (
              <p className="text-[13px] text-text-muted">
                Clear this field to store the citation only — no body text.
              </p>
            )}
          </div>
          <MarkEditor
            text={text}
            marks={marks}
            onMarksChange={setMarks}
            availableMarks={availableMarks}
            textareaRef={textareaRef}
            allowTrinitarianSeal={allowTrinitarianSeal}
            trinitarianSeal={trinitarianSeal}
            onTrinitarianSealChange={setTrinitarianSeal}
          />
          {isSongSlot && (
            <label className="flex items-center gap-2 text-[13px] font-medium text-text-secondary">
              <input
                type="checkbox"
                checked={amenExpected}
                onChange={(e) => setAmenExpected(e.target.checked)}
              />
              Customarily ends in a sung Amen (Leader Guide only)
            </label>
          )}
          {saveError && <p className="text-sm text-error">{saveError}</p>}
          <button
            type="button"
            onClick={() => onSave(citation, text, amenExpected, marks, trinitarianSeal)}
            disabled={isSaving}
            className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Add to Section"}
          </button>
        </>
      )}
    </div>
  );
}
