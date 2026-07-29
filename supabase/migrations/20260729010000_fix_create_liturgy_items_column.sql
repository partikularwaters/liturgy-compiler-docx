-- Fixes a real regression from 20260728020000_drop_sections_items.sql:
-- create_liturgy() (20260712010000_liturgy_core.sql) still inserted into
-- sections' now-removed `items` column, so every single call failed at the
-- SQL level -- surfaced to users as "Unable to start this liturgy right
-- now" for both templates, on any date. The column drop was verified live
-- against the item-mutation actions (add/edit/delete on an existing
-- liturgy) but this RPC, only exercised by liturgy *creation*, was missed.
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

  insert into sections (liturgy_id, template_section_index)
  select v_liturgy_id, (elem.ordinality - 1)::integer
  from templates t, jsonb_array_elements(t.sections) with ordinality as elem(value, ordinality)
  where t.id = p_template_id;

  return v_liturgy_id;
end;
$$;
