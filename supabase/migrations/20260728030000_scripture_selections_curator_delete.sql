-- Reverses the 2026-07-25 "Scripture Library items cannot be deleted" call
-- (20260725040000_curator_compiler_ownership.sql) -- Madrid, now actually
-- running this as a live Curator, wants full delete access across every
-- Library type for Library management. Scripture has no owner_id/fork
-- model (its FIL/ENG pairing is keyed by citation, not a Curator-lockdown
-- column), so unlike Formula/Prayer/Song this is a flat Curator-only rule,
-- not a "your own row or a Curator" rule -- a Compiler still can't delete
-- Scripture Library entries, consistent with them never having an owned
-- fork of one to begin with.
create policy "scripture_selections_delete" on scripture_selections for delete using (
  exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator')
);
