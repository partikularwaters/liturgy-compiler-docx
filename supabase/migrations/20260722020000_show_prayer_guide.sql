-- Direct feedback (2026-07-22): the Prayer Guide reference panel is being
-- redesigned from an always-expanded box into an icon-button toggle. Once
-- revealed, it carries its own "add this to the Leader's Guide" checkbox --
-- a per-liturgy, per-Section decision (this week's Leader's Guide might not
-- need the reference reminder), so it needs real persistence the same way
-- column_break_before does, not just client-side UI state. Defaults true --
-- matches current behavior (every guide-bearing Section already always
-- shows its guide in the Leader's Guide export).
alter table sections add column show_prayer_guide boolean not null default true;
