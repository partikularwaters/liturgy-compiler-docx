"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import TemplatePicker from "@/components/liturgy/TemplatePicker";
import LordsDayDatePicker from "@/components/liturgy/LordsDayDatePicker";
import { LITURGY_TEMPLATES } from "@/lib/liturgy/templates";
import { getLordsDayNumber, isSunday, parseLocalDate } from "@/lib/liturgy/lordsDay";
import { createLiturgy } from "@/lib/liturgy/createLiturgyAction";
import type { LiturgyTemplateId } from "@/types/liturgy";

function todayAsDateInputValue(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export default function NewLiturgyPage(): React.ReactElement {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState<LiturgyTemplateId>("morning");
  const [date, setDate] = useState<string>(todayAsDateInputValue());
  const [error, setError] = useState<string | null>(null);
  const [nonSundayConfirmNeeded, setNonSundayConfirmNeeded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const lordsDayNumber = getLordsDayNumber(parseLocalDate(date));
  const dateIsSunday = isSunday(parseLocalDate(date));

  const handleDateChange = (newDate: string): void => {
    setDate(newDate);
    setNonSundayConfirmNeeded(false);
  };

  const submitLiturgy = (): void => {
    setError(null);
    startTransition(() => {
      createLiturgy(selectedTemplateId, date).then((result) => {
        if (result.success && result.data) {
          router.push(`/liturgy/${result.data.id}`);
        } else {
          setError(result.error ?? "Unable to start this liturgy right now.");
        }
      });
    });
  };

  const handleStartLiturgyClick = (): void => {
    if (!dateIsSunday) {
      setNonSundayConfirmNeeded(true);
      return;
    }
    submitLiturgy();
  };

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">New Liturgy</h1>

      <TemplatePicker
        templates={LITURGY_TEMPLATES}
        selectedId={selectedTemplateId}
        onSelect={setSelectedTemplateId}
      />

      <LordsDayDatePicker
        date={date}
        lordsDayNumber={lordsDayNumber}
        dateIsSunday={dateIsSunday}
        onDateChange={handleDateChange}
      />

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleStartLiturgyClick}
          disabled={isPending || (!dateIsSunday && nonSundayConfirmNeeded)}
          className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isPending && dateIsSunday ? "Starting…" : "Start Liturgy"}
        </button>
        {!dateIsSunday && nonSundayConfirmNeeded && (
          <>
            <button
              type="button"
              onClick={submitLiturgy}
              disabled={isPending}
              className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isPending ? "Starting…" : "Proceed Anyway"}
            </button>
            <p className="text-sm text-warning">
              Not a Sunday — this liturgy will save without a Lord’s Day number.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
