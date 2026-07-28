// One-off backfill for v3 item 1 (item storage migration). Reads every
// existing sections.items jsonb array and inserts the equivalent rows into
// section_items, preserving each item's id and using its array index as
// position. Run once after 20260728010000_section_items_table.sql has been
// applied, then delete this file -- same pattern as every prior one-off
// migration script in this project.
//
// Usage: node --env-file=.env.local scripts/backfill-section-items.mjs
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: sections, error } = await supabase.from("sections").select("id, items");

if (error) {
  console.error("Failed to read sections:", error.message);
  process.exit(1);
}

let inserted = 0;
for (const section of sections) {
  const items = section.items ?? [];
  if (items.length === 0) continue;

  const rows = items.map((item, index) => {
    const { id, type, ...data } = item;
    return { id, section_id: section.id, position: index, type, data };
  });

  const { error: insertError } = await supabase.from("section_items").upsert(rows, { onConflict: "id" });
  if (insertError) {
    console.error(`Failed to backfill section ${section.id}:`, insertError.message);
    process.exit(1);
  }
  inserted += rows.length;
}

console.log(`Backfilled ${inserted} items across ${sections.length} sections.`);
