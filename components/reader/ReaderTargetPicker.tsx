"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getLiturgySections, type SelectableSection } from "@/lib/liturgy/getLiturgySections";
import { formatLiturgyName } from "@/lib/liturgy/formatLiturgyName";
import type { LiturgySummary } from "@/types/liturgy";

interface ReaderTargetPickerProps {
  liturgies: LiturgySummary[];
}

// Shown only when the Reader has no target Section yet (arrived via the top
// nav's plain "Bible Reader" link, free-browsing) -- lets someone choose a
// liturgy and Section to add to right here, instead of having to go back to
// the Compile View and click "+ Scripture" first just to get this same page
// with the target pre-set in the URL.
export default function ReaderTargetPicker({ liturgies }: ReaderTargetPickerProps): React.ReactElement | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [liturgyId, setLiturgyId] = useState("");
  const [sections, setSections] = useState<SelectableSection[]>([]);
  const [sectionIndex, setSectionIndex] = useState<number | null>(null);
  const [isLoadingSections, startTransition] = useTransition();

  if (liturgies.length === 0) return null;

  const handleLiturgyChange = (id: string): void => {
    setLiturgyId(id);
    setSectionIndex(null);
    setSections([]);
    if (!id) return;
    startTransition(async () => {
      const result = await getLiturgySections(id);
      setSections(result);
    });
  };

  const handleGo = (): void => {
    if (!liturgyId || sectionIndex === null) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("liturgyId", liturgyId);
    params.set("sectionIndex", String(sectionIndex));
    router.push(`/reader?${params.toString()}`);
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
      <p className="text-[13px] font-medium text-text-secondary">Add this passage to a liturgy</p>
      <select
        value={liturgyId}
        onChange={(e) => handleLiturgyChange(e.target.value)}
        className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
      >
        <option value="">Choose a liturgy…</option>
        {liturgies.map((l) => (
          <option key={l.id} value={l.id}>
            {formatLiturgyName(l)}
          </option>
        ))}
      </select>
      {liturgyId && (
        <select
          value={sectionIndex ?? ""}
          onChange={(e) => setSectionIndex(e.target.value === "" ? null : Number(e.target.value))}
          disabled={isLoadingSections}
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        >
          <option value="">{isLoadingSections ? "Loading…" : "Choose a Section…"}</option>
          {sections.map((s) => (
            <option key={s.index} value={s.index}>
              {s.name}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={handleGo}
        disabled={!liturgyId || sectionIndex === null}
        className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        Set Target
      </button>
    </div>
  );
}
