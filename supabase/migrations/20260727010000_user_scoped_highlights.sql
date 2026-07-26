-- Scope verse_highlights to the signed-in user (2026-07-27)
-- Previously global -- one highlight state shared by literally every
-- visitor, since the table predates auth entirely (Phase 1, before
-- Curator/Compiler roles existed). Madrid's own report: highlighting a
-- verse on one account showed up on every other account too.

-- Old rows have no owner under the new model and aren't high-risk data
-- (just reading-aid coloring, nothing authored) -- clearing them out
-- rather than trying to guess which account they "belonged" to.
delete from verse_highlights;

alter table verse_highlights add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table verse_highlights alter column user_id set not null;

-- The old (book, chapter, verse) uniqueness let only one color exist for
-- a verse at all; now it's one color per verse PER USER.
alter table verse_highlights drop constraint if exists verse_highlights_book_chapter_verse_key;
alter table verse_highlights add constraint verse_highlights_user_book_chapter_verse_key unique (user_id, book, chapter, verse);
