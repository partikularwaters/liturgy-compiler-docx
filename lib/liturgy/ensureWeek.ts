import { supabase } from "@/lib/db/supabase";
import { getLordsDayNumber, parseLocalDate } from "@/lib/liturgy/lordsDay";
import { autoAssignVesperTableReadings, seedMorningVerbalCues } from "@/lib/liturgy/liturgyDefaults";
import type { TemplateSection } from "@/types/liturgy";

export interface EnsureWeekResult {
  morningLiturgyId: string;
  vesperLiturgyId: string;
  morningCreated: boolean;
  vesperCreated: boolean;
  lordsDayNumber: number;
}

interface TemplateToEnsure {
  name: "Morning Worship" | "Vesper Worship";
  resultId: "morningLiturgyId" | "vesperLiturgyId";
  created: "morningCreated" | "vesperCreated";
}

const TEMPLATES_TO_ENSURE: TemplateToEnsure[] = [
  {
    name: "Morning Worship",
    resultId: "morningLiturgyId",
    created: "morningCreated",
  },
  {
    name: "Vesper Worship",
    resultId: "vesperLiturgyId",
    created: "vesperCreated",
  },
];

export async function ensureWeek(upcomingSunday: string): Promise<EnsureWeekResult | null> {
  const lordsDayNumber = getLordsDayNumber(parseLocalDate(upcomingSunday));
  const result: Partial<EnsureWeekResult> = { lordsDayNumber };

  for (const template of TEMPLATES_TO_ENSURE) {
    const { data: templateRow, error: templateError } = await supabase
      .from("templates")
      .select("id, sections")
      .eq("name", template.name)
      .single();

    if (templateError || !templateRow) {
      console.error("[lib/liturgy/ensureWeek]", templateError?.message);
      return null;
    }

    const { data: existingLiturgy, error: existingError } = await supabase
      .from("liturgies")
      .select("id")
      .eq("template_id", templateRow.id)
      .eq("service_date", upcomingSunday)
      .maybeSingle();

    if (existingError) {
      console.error("[lib/liturgy/ensureWeek]", existingError.message);
      return null;
    }

    if (existingLiturgy) {
      result[template.resultId] = existingLiturgy.id;
      result[template.created] = false;
      continue;
    }

    const { data: createdLiturgyId, error: createError } = await supabase.rpc("create_liturgy", {
      p_template_id: templateRow.id,
      p_service_date: upcomingSunday,
      p_lords_day_number: lordsDayNumber,
    });

    if (createError || !createdLiturgyId) {
      console.error("[lib/liturgy/ensureWeek]", createError?.message);
      return null;
    }

    // A freshly-created Liturgy must start with exactly the same defaults
    // the human "Create Liturgy" button already applies (createLiturgyAction.ts)
    // -- an automation-created Liturgy that skipped these would leave every
    // Vesper reference reading and every Morning Verbal Cue looking
    // permanently missing, since Ticket 2's completion predicates expect
    // them to already be in place at creation time. Best-effort, same
    // discipline as createLiturgyAction.ts: a failure here shouldn't fail
    // Liturgy creation itself.
    const sections = templateRow.sections as TemplateSection[];
    if (template.name === "Vesper Worship") {
      await autoAssignVesperTableReadings(createdLiturgyId, upcomingSunday, sections);
    } else {
      await seedMorningVerbalCues(createdLiturgyId, sections);
    }

    result[template.resultId] = createdLiturgyId;
    result[template.created] = true;
  }

  return result as EnsureWeekResult;
}
