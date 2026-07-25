-- Fix infinite recursion in user_roles RLS policy
-- The old "for all" policy applied to SELECT too, and its own check
-- queried user_roles again, re-triggering itself forever.
-- Splitting into insert/update/delete-only policies breaks the cycle,
-- since CREATE POLICY's FOR clause can't take a comma list of commands.

drop policy if exists "user_roles_write_curator_only" on user_roles;

create policy "user_roles_insert_curator_only" on user_roles
  for insert
  with check (
    exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator')
  );

create policy "user_roles_update_curator_only" on user_roles
  for update
  using (
    exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator')
  )
  with check (
    exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator')
  );

create policy "user_roles_delete_curator_only" on user_roles
  for delete
  using (
    exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role = 'curator')
  );
