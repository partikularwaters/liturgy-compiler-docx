-- Phase 2, Feature 04: New Liturgy Flow — Logic
-- templates/liturgies/sections per architecture.md's Database Schema section.
-- Template section lists are real v1 content, transcribed from
-- founding-days-liturgy-compiler.md §6 (settled, not a placeholder).

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sections jsonb not null
);

create table if not exists liturgies (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates (id),
  service_date date not null,
  lords_day_number integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  liturgy_id uuid not null references liturgies (id) on delete cascade,
  template_section_index integer not null,
  items jsonb not null default '[]'::jsonb
);

create index if not exists sections_liturgy_id_idx on sections (liturgy_id);

-- Single Postgres function call = one implicit transaction, satisfying
-- code-standards.md's "use a transaction for any operation touching more
-- than one table" rule for liturgy + sections creation.
create or replace function create_liturgy(
  p_template_id uuid,
  p_service_date date,
  p_lords_day_number integer
) returns uuid
language plpgsql
as $$
declare
  v_liturgy_id uuid;
begin
  insert into liturgies (template_id, service_date, lords_day_number)
  values (p_template_id, p_service_date, p_lords_day_number)
  returning id into v_liturgy_id;

  insert into sections (liturgy_id, template_section_index, items)
  select v_liturgy_id, (elem.ordinality - 1)::integer, '[]'::jsonb
  from templates t, jsonb_array_elements(t.sections) with ordinality as elem(value, ordinality)
  where t.id = p_template_id;

  return v_liturgy_id;
end;
$$;

insert into templates (name, sections) values
('Morning Worship', '[
  {"name": "Call to Worship", "posture": "standing", "dynamic_naming": false},
  {"name": "Prayer of Invocation", "posture": "standing", "dynamic_naming": false},
  {"name": "Psalm of Adoration", "posture": "standing", "dynamic_naming": true},
  {"name": "Righteousness of God", "posture": "standing", "dynamic_naming": false},
  {"name": "Confession of Sin", "posture": "seated", "dynamic_naming": false},
  {"name": "Hymn of Propitiation", "posture": "standing", "dynamic_naming": true},
  {"name": "Assurance of Pardon", "posture": "standing", "dynamic_naming": false},
  {"name": "Prayer for Illumination", "posture": "seated", "dynamic_naming": false},
  {"name": "Psalm of Proclamation", "posture": "standing", "dynamic_naming": true},
  {"name": "Sermon", "posture": "seated", "dynamic_naming": false},
  {"name": "Hymn of Dedication", "posture": "seated", "dynamic_naming": true},
  {"name": "Affirmation of Faith", "posture": "standing", "dynamic_naming": false},
  {"name": "Offertory & Thanksgiving", "posture": "seated", "dynamic_naming": false},
  {"name": "Pastoral Prayer", "posture": "seated", "dynamic_naming": false},
  {"name": "Charge & Benediction", "posture": "standing", "dynamic_naming": false},
  {"name": "Doxology", "posture": "standing", "dynamic_naming": false}
]'::jsonb),
('Vesper Worship', '[
  {"name": "Call to Worship", "posture": "standing", "dynamic_naming": false},
  {"name": "Prayer of Invocation", "posture": "standing", "dynamic_naming": false},
  {"name": "Psalm of Adoration", "posture": "standing", "dynamic_naming": true},
  {"name": "Confession of Sin", "posture": "seated", "dynamic_naming": false},
  {"name": "Prayer for Pardon", "posture": "seated", "dynamic_naming": false},
  {"name": "Words of Thanksgiving", "posture": "standing", "dynamic_naming": false},
  {"name": "Psalm of Proclamation", "posture": "standing", "dynamic_naming": true},
  {"name": "The Lord''s Discourses", "posture": "seated", "dynamic_naming": false},
  {"name": "Words of Institution", "posture": "seated", "dynamic_naming": false},
  {"name": "Prayer before Communion", "posture": "seated", "dynamic_naming": false},
  {"name": "Hymn of Communion", "posture": "standing", "dynamic_naming": true},
  {"name": "The Lord''s Table", "posture": "standing", "dynamic_naming": false},
  {"name": "Closing of the Table", "posture": "seated", "dynamic_naming": false},
  {"name": "Affirmation of Faith / Church Covenant", "posture": "standing", "dynamic_naming": false},
  {"name": "Offertory & Thanksgiving", "posture": "seated", "dynamic_naming": false},
  {"name": "Prayer Meeting", "posture": "seated", "dynamic_naming": false},
  {"name": "The Great Commission", "posture": "standing", "dynamic_naming": false},
  {"name": "Benediction", "posture": "standing", "dynamic_naming": false},
  {"name": "Doxology", "posture": "standing", "dynamic_naming": false}
]'::jsonb)
on conflict (name) do nothing;
