-- In-app notification center (not real push -- confirmed a visual
-- cue + list is what's wanted, not OS-level alerts). Fired from four
-- trusted server-side mutation points: account approval (grantRole) and
-- the three Library Submission review outcomes (amendExisting/createAsNew/
-- rejectSubmission) -- see lib/notifications/createNotification.ts.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_created_at_idx on notifications (user_id, created_at desc);

alter table notifications enable row level security;

-- A user reads and marks-read only their own notifications. No insert
-- policy for the authenticated/anon role -- every insert goes through the
-- service-role client from a trusted server action, never a user creating
-- their own notification.
create policy "notifications_select_own" on notifications for select using (user_id = auth.uid());
create policy "notifications_update_own" on notifications for update using (user_id = auth.uid());
