"use server";

import { supabase } from "@/lib/db/supabase";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createNotification } from "@/lib/notifications/createNotification";

const TABLE_LABEL: Record<"formulas" | "prayers" | "songs", string> = {
  formulas: "Formula",
  prayers: "Prayer",
  songs: "Song",
};

async function requireCurator(): Promise<{ ok: true } | { ok: false; error: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "curator") {
    return { ok: false, error: "Only a Curator can do that." };
  }
  return { ok: true };
}

// "Amend existing" -- writes the submission's own content onto the shared
// original it was forked from, then marks the fork itself "promoted" (kept,
// not deleted -- it's now a record of an accepted edit, same "don't destroy
// real authored work" principle as the reject-keeps-as-draft rule below).
export async function amendExisting(table: "prayers" | "songs", submissionId: string): Promise<{ success: boolean; error?: string }> {
  const check = await requireCurator();
  if (!check.ok) return { success: false, error: check.error };

  let forkedFromId: string | null;
  let ownerId: string | null;
  let sectionName: string;
  let updateError: { message: string } | null;

  if (table === "prayers") {
    const { data: submission, error: fetchError } = await supabase
      .from("prayers")
      .select("text, marks, forked_from_id, owner_id, section_name")
      .eq("id", submissionId)
      .single();
    if (fetchError || !submission) return { success: false, error: "That submission could not be found." };
    forkedFromId = submission.forked_from_id;
    if (!forkedFromId) return { success: false, error: "This submission has no original entry to amend." };
    ownerId = submission.owner_id;
    sectionName = submission.section_name;
    ({ error: updateError } = await supabase
      .from("prayers")
      .update({ text: submission.text, marks: submission.marks })
      .eq("id", forkedFromId));
  } else {
    const { data: submission, error: fetchError } = await supabase
      .from("songs")
      .select("title, attribution, year_published, notes, forked_from_id, owner_id, section_name")
      .eq("id", submissionId)
      .single();
    if (fetchError || !submission) return { success: false, error: "That submission could not be found." };
    forkedFromId = submission.forked_from_id;
    if (!forkedFromId) return { success: false, error: "This submission has no original entry to amend." };
    ownerId = submission.owner_id;
    sectionName = submission.section_name;
    ({ error: updateError } = await supabase
      .from("songs")
      .update({
        title: submission.title,
        attribution: submission.attribution,
        year_published: submission.year_published,
        notes: submission.notes,
      })
      .eq("id", forkedFromId));
  }

  if (updateError) {
    console.error("[lib/curatorInbox/librarySubmissionActions/amendExisting]", updateError.message);
    return { success: false, error: "Unable to amend the original entry right now." };
  }

  const { error: statusError } = await supabase.from(table).update({ status: "promoted" }).eq("id", submissionId);
  if (statusError) {
    console.error("[lib/curatorInbox/librarySubmissionActions/amendExisting]", statusError.message);
    return { success: false, error: "Amended the original, but couldn't update the submission's own status." };
  }

  if (ownerId) {
    await createNotification(
      ownerId,
      "submission_amended",
      `Your ${TABLE_LABEL[table]} submission for ${sectionName} was approved and merged into the shared Library.`,
      "/my-library"
    );
  }

  return { success: true };
}

// "Create as new" -- the submission's own row BECOMES a new shared entry
// (owner_id -> null). Used for a brand-new Formula proposal (no original to
// amend at all) and, for Prayer/Song, when the Curator decides the fork is
// different enough to stand on its own rather than overwrite the original.
export async function createAsNew(table: "formulas" | "prayers" | "songs", submissionId: string): Promise<{ success: boolean; error?: string }> {
  const check = await requireCurator();
  if (!check.ok) return { success: false, error: check.error };

  // Fetched before the update below, since that update nulls owner_id --
  // the one piece of information this notification needs that's about to
  // be destroyed by the very promotion it's announcing.
  const { data: submission } = await supabase.from(table).select("owner_id, section_name").eq("id", submissionId).single();

  const { error } = await supabase.from(table).update({ owner_id: null, status: "promoted" }).eq("id", submissionId);
  if (error) {
    console.error("[lib/curatorInbox/librarySubmissionActions/createAsNew]", error.message);
    return { success: false, error: "Unable to promote this submission right now." };
  }

  if (submission?.owner_id) {
    await createNotification(
      submission.owner_id,
      "submission_created_as_new",
      `Your ${TABLE_LABEL[table]} submission for ${submission.section_name} was approved and added to the shared Library.`,
      "/my-library"
    );
  }

  return { success: true };
}

// Decision #7 (progress-tracker.md): a rejected Library Submission reverts
// to the Compiler's own private draft, never deleted -- unlike a rejected
// Account Request, this represents real authored work.
export async function rejectSubmission(table: "formulas" | "prayers" | "songs", submissionId: string): Promise<{ success: boolean; error?: string }> {
  const check = await requireCurator();
  if (!check.ok) return { success: false, error: check.error };

  const { data: submission } = await supabase.from(table).select("owner_id, section_name").eq("id", submissionId).single();

  const { error } = await supabase.from(table).update({ status: "draft" }).eq("id", submissionId);
  if (error) {
    console.error("[lib/curatorInbox/librarySubmissionActions/rejectSubmission]", error.message);
    return { success: false, error: "Unable to reject this submission right now." };
  }

  if (submission?.owner_id) {
    await createNotification(
      submission.owner_id,
      "submission_rejected",
      `Your ${TABLE_LABEL[table]} submission for ${submission.section_name} was sent back to your drafts for revision.`,
      "/my-library"
    );
  }

  return { success: true };
}
