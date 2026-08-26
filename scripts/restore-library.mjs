// Loads the JSON snapshot written by pull-library.mjs into the local
// Supabase database. Local-only by hard guard below -- refuses to run
// against anything that isn't a localhost/127.0.0.1 URL, so a misconfigured
// .env.local can never turn this into a write against Production.
//
// Usage: npm run db:restore-library
// (reads NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from
// .env.local via --env-file, same convention as scripts/seed-bible.ts)

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// formulas/prayers/songs are self-referential via paired_id -- insert every
// row with paired_id nulled first, then patch paired_id back in a second
// pass, so the FK never points at a row that doesn't exist yet.
const SELF_PAIRED_TABLES = ["formulas", "prayers", "songs"];
const SIMPLE_TABLES = ["scripture_selections"];

const SNAPSHOT_FILE = resolve(process.cwd(), "dev/library-pull/latest.json");

async function restoreSelfPaired(supabase, table, rows) {
  const { error: deleteError } = await supabase.from(table).delete().not("id", "is", null);
  if (deleteError) throw new Error(`[restore-library] Failed clearing ${table}: ${deleteError.message}`);
  if (rows.length === 0) return;

  const withoutPairing = rows.map((row) => {
    const clone = { ...row };
    delete clone.paired_id;
    return clone;
  });
  const { error: insertError } = await supabase.from(table).insert(withoutPairing);
  if (insertError) throw new Error(`[restore-library] Failed inserting ${table}: ${insertError.message}`);

  for (const row of rows) {
    if (!row.paired_id) continue;
    const { error: updateError } = await supabase
      .from(table)
      .update({ paired_id: row.paired_id })
      .eq("id", row.id);
    if (updateError) {
      throw new Error(`[restore-library] Failed restoring ${table}.paired_id for ${row.id}: ${updateError.message}`);
    }
  }
}

async function restoreSimple(supabase, table, rows) {
  const { error: deleteError } = await supabase.from(table).delete().not("id", "is", null);
  if (deleteError) throw new Error(`[restore-library] Failed clearing ${table}: ${deleteError.message}`);
  if (rows.length === 0) return;

  const { error: insertError } = await supabase.from(table).insert(rows);
  if (insertError) throw new Error(`[restore-library] Failed inserting ${table}: ${insertError.message}`);
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "[restore-library] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Run with: npm run db:restore-library (reads .env.local)"
    );
    process.exit(1);
  }
  if (!/localhost|127\.0\.0\.1/u.test(supabaseUrl)) {
    console.error(
      `[restore-library] NEXT_PUBLIC_SUPABASE_URL (${supabaseUrl}) is not a local address -- refusing to run.\n` +
        "This script only ever writes to a local database."
    );
    process.exit(1);
  }
  if (!existsSync(SNAPSHOT_FILE)) {
    console.error(`[restore-library] No snapshot at ${SNAPSHOT_FILE}. Run \`npm run db:pull-library\` first.`);
    process.exit(1);
  }

  const snapshot = JSON.parse(readFileSync(SNAPSHOT_FILE, "utf8"));
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  for (const table of SELF_PAIRED_TABLES) {
    await restoreSelfPaired(supabase, table, snapshot.tables[table] ?? []);
  }
  for (const table of SIMPLE_TABLES) {
    await restoreSimple(supabase, table, snapshot.tables[table] ?? []);
  }

  console.log(`[restore-library] Restored local Library from snapshot pulled ${snapshot.pulledAt}:`);
  for (const table of [...SELF_PAIRED_TABLES, ...SIMPLE_TABLES]) {
    console.log(`  ${table}: ${(snapshot.tables[table] ?? []).length} rows`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
