# Migrated historical decision 0023

2026-08-15** — Database contract is server-mediated and least-privilege: anonymous reading remains available through Next.js; browsers use the public key for Auth rather than direct application-table access; authenticated clients directly receive only `SELECT` on `user_roles`; `service_role` owns server data access and `create_liturgy()` execution. Server actions must still authorize every mutation because the service role bypasses RLS.
