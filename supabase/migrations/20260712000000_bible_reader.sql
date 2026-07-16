-- Phase 1, Feature 02: Reader Logic
-- bible_verses: self-hosted AB1905 + BSB text (public domain, seeded once via scripts/seed-bible.ts)
-- verse_highlights: user highlight state, keyed by citation only (not translation) — see progress-tracker.md decision log

create table if not exists bible_verses (
  id bigint generated always as identity primary key,
  translation text not null check (translation in ('AB1905', 'BSB')),
  book text not null,
  chapter integer not null,
  verse integer not null,
  text text not null,
  unique (translation, book, chapter, verse)
);

create index if not exists bible_verses_lookup on bible_verses (translation, book, chapter);

create table if not exists verse_highlights (
  id bigint generated always as identity primary key,
  book text not null,
  chapter integer not null,
  verse integer not null,
  color text not null check (color in ('accent', 'success', 'info', 'warning')),
  updated_at timestamptz not null default now(),
  unique (book, chapter, verse)
);
