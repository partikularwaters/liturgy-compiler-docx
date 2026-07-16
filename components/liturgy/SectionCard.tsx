"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AddFormulaPanel from "@/components/liturgy/AddFormulaPanel";
import AddPrayerPanel from "@/components/liturgy/AddPrayerPanel";
import VerbalCueForm from "@/components/liturgy/VerbalCueForm";
import SermonForm from "@/components/liturgy/SermonForm";
import { addVerbalCue, updateVerbalCue } from "@/lib/liturgy/verbalCueActions";
import { saveSermonPassage } from "@/lib/liturgy/sermonActions";
import { resolveItemText } from "@/lib/liturgy/resolveItemText";
import { sectionTitle } from "@/lib/liturgy/sectionTitle";
import { parseBoldSegments } from "@/lib/text/markdown";
import { updatePrayer } from "@/lib/prayers/prayerActions";
import type { CompiledSection, Formula, Item, Prayer } from "@/types/liturgy";

const ALL_ITEM_TYPES: Item["type"][] = ["selection", "formula", "verbal_cue", "prayer", "sermon"];

interface SectionCardProps {
  section: CompiledSection;
  liturgyId: string;
  sectionIndex: number;
  formulas: Formula[];
  prayers: Prayer[];
}

function BodyText({ text }: { text: string }): React.ReactElement {
  return (
    <p className="font-serif-body text-[17px] leading-[1.75] text-text-primary">
      {parseBoldSegments(text).map((segment, i) =>
        segment.bold ? <strong key={i}>{segment.text}</strong> : <span key={i}>{segment.text}</span>
      )}
    </p>
  );
}

function LeaderOnlyBadge(): React.ReactElement {
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-accent-light text-accent-dark">
      Leader only
    </span>
  );
}

interface PrayerEditFormProps {
  initialText: string;
  isSaving: boolean;
  error: string | null;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

function PrayerEditForm({
  initialText,
  isSaving,
  error,
  onSubmit,
  onCancel,
}: PrayerEditFormProps): React.ReactElement {
  const [text, setText] = useState(initialText);

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
      />
      <p className="text-[13px] text-text-muted">
        Editing here updates this Prayer in the library for future use.
      </p>
      {error && <p className="text-sm text-error">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSubmit(text)}
          disabled={isSaving}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="self-start bg-surface border border-border text-text-primary rounded-md px-4 py-2 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SectionCard({
  section,
  liturgyId,
  sectionIndex,
  formulas,
  prayers,
}: SectionCardProps): React.ReactElement {
  const router = useRouter();
  const sectionFormulas = formulas.filter((f) => f.sectionName === section.name);
  const sectionPrayers = prayers.filter((p) => p.sectionName === section.name);
  const [isAddingFormula, setIsAddingFormula] = useState(false);
  const [isAddingVerbalCue, setIsAddingVerbalCue] = useState(false);
  const [isAddingPrayer, setIsAddingPrayer] = useState(false);
  const [isAddingSermon, setIsAddingSermon] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSermon = section.items.some((item) => item.type === "sermon");
  // Feature 23: item_types is missing only if a Section somehow predates the
  // migration -- fall back to every type rather than silently hiding Add
  // buttons in that case.
  const allowedTypes = section.item_types ?? ALL_ITEM_TYPES;

  const handleAddVerbalCue = (text: string, visibility: "both" | "leader_only"): void => {
    setIsSaving(true);
    setError(null);
    addVerbalCue(liturgyId, sectionIndex, text, visibility).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setIsAddingVerbalCue(false);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to add this Verbal Cue right now.");
      }
    });
  };

  const handleUpdateVerbalCue = (
    itemId: string,
    text: string,
    visibility: "both" | "leader_only"
  ): void => {
    setIsSaving(true);
    setError(null);
    updateVerbalCue(liturgyId, sectionIndex, itemId, text, visibility).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setEditingItemId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Verbal Cue right now.");
      }
    });
  };

  const handleSavePrayerEdit = (itemId: string, prayerId: string, text: string): void => {
    setIsSaving(true);
    setError(null);
    updatePrayer(prayerId, section.name, text).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setEditingItemId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to update this Prayer right now.");
      }
    });
  };

  const handleSaveSermon = (passage: string): void => {
    setIsSaving(true);
    setError(null);
    saveSermonPassage(liturgyId, sectionIndex, passage).then((result) => {
      setIsSaving(false);
      if (result.success) {
        setIsAddingSermon(false);
        setEditingItemId(null);
        router.refresh();
      } else {
        setError(result.error ?? "Unable to save the Sermon passage right now.");
      }
    });
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-6 shadow-[0px_1px_3px_rgba(34,32,28,0.08)]">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-serif-display text-[22px] font-semibold leading-[30px] text-text-primary">
          {sectionTitle(section)}
        </h2>
        <div className="flex items-center gap-3">
          {allowedTypes.includes("selection") && (
            <Link
              href={`/reader?liturgyId=${liturgyId}&sectionIndex=${sectionIndex}`}
              className="text-sm font-medium text-accent-dark"
            >
              Add Selection
            </Link>
          )}
          {allowedTypes.includes("formula") && (
            <button
              type="button"
              onClick={() => setIsAddingFormula((prev) => !prev)}
              className="text-sm font-medium text-accent-dark"
            >
              Add Formula
            </button>
          )}
          {allowedTypes.includes("verbal_cue") && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsAddingVerbalCue((prev) => !prev);
              }}
              className="text-sm font-medium text-accent-dark"
            >
              Add Verbal Cue
            </button>
          )}
          {allowedTypes.includes("prayer") && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsAddingPrayer((prev) => !prev);
              }}
              className="text-sm font-medium text-accent-dark"
            >
              Add Prayer
            </button>
          )}
          {allowedTypes.includes("sermon") && !hasSermon && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setIsAddingSermon((prev) => !prev);
              }}
              className="text-sm font-medium text-accent-dark"
            >
              Add Sermon
            </button>
          )}
        </div>
      </div>

      {isAddingFormula && (
        <div className="mb-4">
          <AddFormulaPanel
            formulas={sectionFormulas}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            onDone={() => setIsAddingFormula(false)}
          />
        </div>
      )}

      {isAddingVerbalCue && (
        <div className="mb-4">
          <VerbalCueForm
            initialText=""
            initialVisibility="leader_only"
            isSaving={isSaving}
            error={error}
            submitLabel="Add Verbal Cue"
            onSubmit={handleAddVerbalCue}
            onCancel={() => {
              setError(null);
              setIsAddingVerbalCue(false);
            }}
          />
        </div>
      )}

      {isAddingPrayer && (
        <div className="mb-4">
          <AddPrayerPanel
            prayers={sectionPrayers}
            sectionName={section.name}
            liturgyId={liturgyId}
            sectionIndex={sectionIndex}
            onDone={() => setIsAddingPrayer(false)}
          />
        </div>
      )}

      {isAddingSermon && (
        <div className="mb-4">
          <SermonForm
            initialPassage=""
            isSaving={isSaving}
            error={error}
            submitLabel="Add Sermon"
            onSubmit={handleSaveSermon}
            onCancel={() => {
              setError(null);
              setIsAddingSermon(false);
            }}
          />
        </div>
      )}

      {section.items.length === 0 ? (
        <p className="text-sm text-text-muted">No items yet</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {section.items.map((item) => {
            const resolved = resolveItemText(item, formulas, prayers);

            if (item.type === "verbal_cue" && editingItemId === item.id) {
              return (
                <li key={item.id}>
                  <VerbalCueForm
                    initialText={item.text}
                    initialVisibility={item.visibility}
                    isSaving={isSaving}
                    error={error}
                    submitLabel="Save"
                    onSubmit={(text, visibility) => handleUpdateVerbalCue(item.id, text, visibility)}
                    onCancel={() => {
                      setError(null);
                      setEditingItemId(null);
                    }}
                  />
                </li>
              );
            }

            if (item.type === "prayer" && editingItemId === item.id) {
              return (
                <li key={item.id}>
                  <PrayerEditForm
                    initialText={resolved.text}
                    isSaving={isSaving}
                    error={error}
                    onSubmit={(text) => handleSavePrayerEdit(item.id, item.prayerId, text)}
                    onCancel={() => {
                      setError(null);
                      setEditingItemId(null);
                    }}
                  />
                </li>
              );
            }

            if (item.type === "sermon" && editingItemId === item.id) {
              return (
                <li key={item.id}>
                  <SermonForm
                    initialPassage={item.passage}
                    isSaving={isSaving}
                    error={error}
                    submitLabel="Save"
                    onSubmit={handleSaveSermon}
                    onCancel={() => {
                      setError(null);
                      setEditingItemId(null);
                    }}
                  />
                </li>
              );
            }

            const isEditable =
              item.type === "verbal_cue" || item.type === "prayer" || item.type === "sermon";

            return (
              <li key={item.id}>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] text-text-secondary">{resolved.label}</p>
                  {resolved.leaderOnly && <LeaderOnlyBadge />}
                  {isEditable && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setEditingItemId(item.id);
                      }}
                      className="text-[13px] font-medium text-accent-dark"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <BodyText text={resolved.text} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
