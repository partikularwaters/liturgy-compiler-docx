-- Phase 2, Feature 04: New Liturgy Flow — Logic (content correction)
-- Correction to founding-days-liturgy-compiler.md §6: "Call to Confession"
-- was missing from Morning Worship (seated, immediately before Confession
-- of Sin). Vesper Worship is unaffected. Safe as a direct UPDATE — no real
-- liturgies exist yet, so no template_section_index backfill is needed.

update templates
set sections = '[
  {"name": "Call to Worship", "posture": "standing", "dynamic_naming": false},
  {"name": "Prayer of Invocation", "posture": "standing", "dynamic_naming": false},
  {"name": "Psalm of Adoration", "posture": "standing", "dynamic_naming": true},
  {"name": "Righteousness of God", "posture": "standing", "dynamic_naming": false},
  {"name": "Call to Confession", "posture": "seated", "dynamic_naming": false},
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
]'::jsonb
where name = 'Morning Worship';
