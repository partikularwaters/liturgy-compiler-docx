-- Phase 3, Feature 10: Prayer Library
-- A small reusable library per Section (e.g. 2-3 existing Confession of Sin
-- prayers), scoped by Section name like formulas. No canon status, no access
-- restriction, no override mechanic -- editing a Prayer updates the library
-- entry directly. No seed data: real prayer text is Madrid's to author
-- through the app.

create table if not exists prayers (
  id uuid primary key default gen_random_uuid(),
  section_name text not null,
  text text not null
);
