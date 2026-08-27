-- Publication state records the ready revision; `ready_at` distinguishes a
-- Liturgy re-marked Ready after an edit from its earlier published revision.
alter table liturgies
  add column status text not null default 'draft' check (status in ('draft', 'ready')),
  add column ready_by uuid references auth.users(id) on delete set null,
  add column ready_at timestamptz;

-- `ready_at`, not just `liturgy_id`, is the uniqueness key: it permits delivery
-- of a genuinely new Ready revision while preventing duplicate delivery of one revision.
create table liturgy_publications (
  id uuid primary key default gen_random_uuid(),
  liturgy_id uuid not null references liturgies(id) on delete cascade,
  ready_at timestamptz not null,
  delivered_at timestamptz not null default now(),
  unique (liturgy_id, ready_at)
);

-- The publication ledger remains service-role-only under the existing defaults.
alter table liturgy_publications enable row level security;
