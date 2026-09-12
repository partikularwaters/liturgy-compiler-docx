"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// v2 item 2: continuous-flow authoring's manual override -- "start this
// Section at the top of the next Word column" in the exported docx. A
// per-liturgy instance decision (types/liturgy.ts's CompiledSection docs the
// reasoning), so this updates the `sections` row directly by
// (liturgyId, sectionIndex) the same way every other per-Section action in
// this file's siblings does (see verbalCueActions.ts), rather than going
// through getSectionContext (which also fetches `items`, unneeded here).
export async function setColumnBreak(
  liturgyId: string,
  sectionIndex: number,
  columnBreakBefore: boolean
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Sign in to change this column setting." };
  }

  // .select("id") so a zero-row match is detectable -- see
  // setSilentConfessionLanguageAction.ts's identical comment and
  // context/incidents/0002 for the real report this class of gap caused.
  const { data, error } = await supabase
    .from("sections")
    .update({ column_break_before: columnBreakBefore })
    .eq("liturgy_id", liturgyId)
    .eq("template_section_index", sectionIndex)
    .select("id");

  if (error) {
    console.error("[lib/liturgy/setColumnBreakAction]", error.message);
    return { success: false, error: "Unable to update the column break right now." };
  }
  if (!data || data.length === 0) {
    console.error("[lib/liturgy/setColumnBreakAction] no matching Section row", { liturgyId, sectionIndex });
    return { success: false, error: "Couldn't find that Section -- try reloading the page." };
  }
  return { success: true };
}
