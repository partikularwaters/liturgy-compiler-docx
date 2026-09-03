-- Phase 3, Feature 08: Formula Library
-- No seed data here — real liturgical formula text (Absolution, Confession,
-- Creeds, etc.) is to be authored through the app, not fabricated.

create table if not exists formulas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_text text not null,
  access_level text
);
