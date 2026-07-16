-- Phase 3, Feature 08: Formula Library
-- No seed data here — real liturgical formula text (Absolution, Confession,
-- Creeds, etc.) is Madrid's to author through the app, not to fabricate.

create table if not exists formulas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_text text not null,
  access_level text
);
