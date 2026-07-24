"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteScriptureSelection, updateScriptureSelection } from "@/lib/selections/scriptureSelectionActions";
import { autosizeTextarea } from "@/lib/text/autosize";
import { shiftMarksForEdit } from "@/lib/text/marks";
import { getSelectionMarks } from "@/lib/liturgy/markableSections";
import MarkEditor from "@/components/liturgy/MarkEditor";
import { TrashIcon } from "@/components/liturgy/icons";
import LibraryTextPreview from "@/components/library/LibraryTextPreview";
import ScriptureCitationLink from "@/components/liturgy/ScriptureCitationLink";
import type { ScriptureSelection, TextMark } from "@/types/liturgy";

interface ScriptureSelectionRowProps {
  selection: ScriptureSelection;
}

// v2 Phase A: edit-in-place, closing the "browse only" gap this component's
// original comment documented. Section is fixed (not editable here) -- a
// Scripture item's Section scoping comes from where it was first placed, the
// same convention Formula/Prayer/Song's edit forms already follow (their
// Section select only appears on create, not edit... actually Formula's does
// allow re-scoping; kept simpler here since re-scoping a citation crosses
// dedup boundaries in a way that's easy to get wrong silently).
export default function ScriptureSelectionRow({
  selection,
}: ScriptureSelectionRowProps): React.ReactElement {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [citation, setCitation] = useState(selection.citation);
  const [text, setText] = useState(selection.text);
  const [marks, setMarks] = useState<TextMark[]>(selection.marks ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // This component toggles its own edit view in place (isEditing flips the
  // same component's JSX, unlike Formula/Prayer which mount a separate child
  // form) -- the textarea doesn't exist until isEditing becomes true, so an
  // effect keyed only on `text` never re-fires against it (text hasn't
  // changed at that moment). Keying on isEditing too makes it fire the
  // instant the textarea actually appears.
  useEffect(() => {
    if (isEditing) autosizeTextarea(textareaRef.current);
  }, [text, isEditing]);

  const handleDelete = (): void => {
    if (!window.confirm(`Delete "${selection.citation}"? This cannot be undone.`)) return;
    setIsSaving(true);
    setError(null);
    deleteScriptureSelection(selection.id).then((result) => {
      setIsSaving(false);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Unable to delete this Scripture item right now.");
      }
    });
  };

  const handleSave = (): void => {
    setIsSaving(true);
    setError(null);
    updateScriptureSelection(selection.id, selection.sectionName, citation, text, selection.translation, marks).then(
      (result) => {
        setIsSaving(false);
        if (result.success) {
          setIsEditing(false);
          router.refresh();
        } else {
          setError(result.error ?? "Unable to update this Scripture item right now.");
        }
      }
    );
  };

  if (isEditing) {
    return (
      <div className="border-b border-border py-4 flex flex-col gap-2">
        <p className="text-[13px] text-text-secondary">
          {selection.sectionName} · {selection.translation === "en" ? "BSB" : "AB"}
        </p>
        <input
          value={citation}
          onChange={(e) => setCitation(e.target.value)}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setMarks((prev) => shiftMarksForEdit(text, e.target.value, prev));
            setText(e.target.value);
          }}
          rows={8}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent resize-none min-h-[180px] overflow-hidden"
        />
        <MarkEditor
          text={text}
          marks={marks}
          onMarksChange={setMarks}
          availableMarks={getSelectionMarks(selection.sectionName)}
          textareaRef={textareaRef}
        />
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCitation(selection.citation);
              setText(selection.text);
              setMarks(selection.marks ?? []);
              setError(null);
              setIsEditing(false);
            }}
            className="self-start bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border py-4 flex items-start justify-between gap-4">
      <div>
        <p className="text-[13px] text-text-secondary">
          {selection.sectionName} · {selection.translation === "en" ? "BSB" : "AB"}
        </p>
        <ScriptureCitationLink
          citation={selection.citation}
          translation={selection.translation}
          className="text-sm font-medium text-text-primary"
        />
        <LibraryTextPreview title={selection.citation} text={selection.text} marks={selection.marks} className="mt-1" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-sm font-medium text-accent-dark"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isSaving}
          title="Delete"
          className="text-text-muted hover:text-error disabled:opacity-50"
        >
          <TrashIcon size={16} />
        </button>
      </div>
      {error && !isEditing && <p className="text-[12px] text-error">{error}</p>}
    </div>
  );
}
