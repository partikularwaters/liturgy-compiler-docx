import { supabase } from "@/lib/db/supabase";

export interface DeletionLogEntry {
  id: string;
  templateName: string;
  serviceDate: string;
  lordsDayNumber: number | null;
  deletedByName: string;
  deletedRole: "compiler" | "curator";
  deletedAt: string;
}

// Read-only, newest first -- this is an audit trail, not a queue to act on,
// unlike every other Curator Inbox tab (Account Requests, Library
// Submissions, Bin all have an approve/reject or restore/delete action).
export async function getDeletionLog(): Promise<DeletionLogEntry[]> {
  const { data, error } = await supabase
    .from("liturgy_deletions")
    .select("id, template_name, service_date, lords_day_number, deleted_by_name, deleted_role, deleted_at")
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("[lib/curatorInbox/getDeletionLog]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    templateName: row.template_name,
    serviceDate: row.service_date,
    lordsDayNumber: row.lords_day_number,
    deletedByName: row.deleted_by_name,
    deletedRole: row.deleted_role as "compiler" | "curator",
    deletedAt: row.deleted_at,
  }));
}
