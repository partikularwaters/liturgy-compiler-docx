# Migrated historical decision 0022

2026-08-15** — Production's Supabase migration ledger reports none of the 32 local migration versions as remotely recorded. Historical SQL was evidently applied manually. Treat migration-history reconciliation as a separate drift investigation; do not `db push` or mark versions applied mechanically.
