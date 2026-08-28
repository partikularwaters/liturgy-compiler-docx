-- Direct request (2026-08-28): the Silent Confession rubric (after Corporate
-- Confession, "Confession of Sin") was hardcoded to Tagalog only, but a real
-- English liturgy needs it too. A per-liturgy, per-Section choice, the same
-- shape as show_prayer_guide/column_break -- English carries equal authority
-- to Tagalog, not a fallback, so this is a real stored choice, not a
-- client-side toggle. Defaults 'fil', matching the prior fixed behavior.
alter table sections
  add column silent_confession_language text not null default 'fil'
  check (silent_confession_language in ('fil', 'en'));
