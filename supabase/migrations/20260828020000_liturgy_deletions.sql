-- Records every liturgy deletion permanently, visible in the Curator Inbox.
-- This is an audit trail, not an approval gate -- deletion still executes
-- immediately for any signed-in Compiler or Curator; the record exists so a
-- Curator can see who deleted what and when. Columns are a snapshot, not a
-- live FK to `liturgies`/`templates`, since the liturgy row itself is gone
-- by the time this row is read -- same reasoning as the placed-Prayer/Song
-- "snapshot, never a current lookup" invariant (architecture.md).
create table liturgy_deletions (
  id uuid primary key default gen_random_uuid(),
  template_name text not null,
  service_date date not null,
  lords_day_number integer,
  deleted_by uuid references auth.users(id) on delete set null,
  deleted_by_name text not null,
  deleted_role text not null check (deleted_role in ('compiler', 'curator')),
  deleted_at timestamptz not null default now()
);

alter table liturgy_deletions enable row level security;

-- Deletes `sections` and `liturgies` and writes the audit row in one
-- transaction (code-standards.md: "use a transaction for any operation
-- touching more than one table"), mirroring create_liturgy()'s own pattern.
-- The caller (deleteLiturgyAction.ts) has already authorized the current
-- user and, for a Compiler, already verified their typed confirmation
-- server-side before this function is ever called.
create or replace function delete_liturgy_with_log(
  p_liturgy_id uuid,
  p_deleted_by uuid,
  p_deleted_by_name text,
  p_deleted_role text
) returns void
language plpgsql
as $$
declare
  v_template_name text;
  v_service_date date;
  v_lords_day_number integer;
begin
  select t.name, l.service_date, l.lords_day_number
  into v_template_name, v_service_date, v_lords_day_number
  from liturgies l
  join templates t on t.id = l.template_id
  where l.id = p_liturgy_id;

  if not found then
    raise exception 'Liturgy % not found', p_liturgy_id;
  end if;

  insert into liturgy_deletions (
    template_name, service_date, lords_day_number,
    deleted_by, deleted_by_name, deleted_role
  )
  values (
    v_template_name, v_service_date, v_lords_day_number,
    p_deleted_by, p_deleted_by_name, p_deleted_role
  );

  delete from sections where liturgy_id = p_liturgy_id;
  delete from liturgies where id = p_liturgy_id;
end;
$$;
