// One-way, read-only pull of the shared Library (Formulas/Prayers/Songs/
// Scripture Selections) from Production into a local JSON snapshot. Never
// writes to Production -- only .select() calls are issued.
//
// Only shared/canonical entries are pulled (owner_id is null, is_binned is
// false) -- the same set a Compiler sees as "the Library" per the RLS policy
// in supabase/migrations/20260815010000_explicit_database_contract.sql. A
// user's personal (owner_id-scoped) entries are private and never pulled.
//
// Usage:
//   PROD_SUPABASE_URL=... PROD_SUPABASE_SERVICE_ROLE_KEY=... npm run db:pull-library
//
// Credentials are read from the shell environment only -- never from
// .env.local (that's the local dev project's config, not Production's) and
// never written to disk by this script. Get them from Vercel's Production
// environment variables, used only for the length of this command.

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const LIBRARY_TABLES = ["formulas", "prayers", "songs"];
const OUTPUT_DIR = resolve(process.cwd(), "dev/library-pull");
const OUTPUT_FILE = resolve(OUTPUT_DIR, "latest.json");

async function fetchAll(supabase, table, { sharedOnly }) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let query = supabase
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);
    if (sharedOnly) {
      query = query.is("owner_id", null).eq("is_binned", false);
    }
    const { data, error } = await query;
    if (error) throw new Error(`[pull-library] Failed reading ${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

async function main() {
  const supabaseUrl = process.env.PROD_SUPABASE_URL;
  const serviceRoleKey = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "[pull-library] Missing PROD_SUPABASE_URL or PROD_SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Run with: PROD_SUPABASE_URL=... PROD_SUPABASE_SERVICE_ROLE_KEY=... npm run db:pull-library\n" +
        "Get these from Production's Vercel environment variables -- never store them in a file."
    );
    process.exit(1);
  }
  if (/localhost|127\.0\.0\.1/u.test(supabaseUrl)) {
    console.error("[pull-library] PROD_SUPABASE_URL looks like a local address -- refusing to run.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const snapshot = { pulledAt: new Date().toISOString(), tables: {} };
  for (const table of LIBRARY_TABLES) {
    snapshot.tables[table] = await fetchAll(supabase, table, { sharedOnly: true });
  }
  snapshot.tables.scripture_selections = await fetchAll(supabase, "scripture_selections", {
    sharedOnly: false,
  });

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2));

  console.log("[pull-library] Pulled shared Library from Production (read-only):");
  for (const [table, rows] of Object.entries(snapshot.tables)) {
    console.log(`  ${table}: ${rows.length} rows`);
  }
  console.log(`Snapshot written to ${OUTPUT_FILE} (dev/ is gitignored -- never committed).`);
  console.log("Run `npm run db:restore-library` to load it into your local database.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
