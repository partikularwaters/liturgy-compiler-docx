// Default Verbal Cue seeding. Each template names its Section's actual Selection/Song/Formula
// via a `{{scripture}}`/`{{song}}`/`{{creed}}` token instead of a hardcoded
// citation, so the cue always speaks whatever is really placed there for a
// given liturgy (resolveVerbalCueTemplate.ts does the substitution at render
// time) rather than freezing whatever happened to be true when this file was
// written. A Section with no such token is intentionally static -- its cue
// doesn't name a specific item (e.g. Confession of Sin's corporate prayer).
//
// Psalm of Proclamation is a deliberate exception: its second reference
// ("Ito ang sinasabi ng [Scripture]") is a literal, hand-fillable placeholder,
// not a live-bound token, since that
// Scripture reading is a distinct choice made per week (often the Sermon's
// own passage) that this Section has no data slot for today.
export const MORNING_VERBAL_CUE_TEMPLATES: Record<string, string> = {
  "Call to Worship":
    "Pakinggan natin ang panawagan sa atin ng Diyos upang Siya’y sambahin. Ating basahin ang {{scripture}}.",
  "Prayer of Invocation":
    "Matapos tayong tawagin ng ating Panginoon upang sambahin Siya, dapat nating makita na tayo ay nangangailangan ng Kanyang buháy na Espiritu upang tayo’y makapaghandog ng katanggap-tanggap na pagsamba. Tayo’y manawagan sa Diyos sa mga salitang ito mula sa {{scripture}}:",
  "Psalm of Adoration":
    "Sa tulong ng buháy na Espiritu ng Diyos, tayo’y magpuri sa ating Diyos na Trinidad. Ating awitin ang {{song}}.",
  "Righteousness of God":
    "Matapos tayong magbigay ng papuri at pagsamba sa isang Diyos na buhay at banal sa pamamagitan ng isang awitin, atin namang iharap ang ating mga sarili sa Kanyang kautusan. Ito ang sinasabi ng Salita ng Diyos <{{scripture}}>:",
  "Call to Confession":
    "Nasaksihan natin ang kabanalan at kadakilan ng Diyos sa Kanyang mga salmo at sa Kanyang kautusan. Ngayo’y tinatawag naman tayo upang magsisi sa ating mga kasalanan. Pakinggan natin ang panawagan sa atin sa {{scripture}}.",
  "Confession of Sin":
    "Mga kapatid at mga minamahal, ating sabay-sabay ihayag ang ating mga kasalanan sa Diyos:",
  "Assurance of Pardon":
    "Matapos nating ihayag ang ating mga sala sa isang banal na Diyos, atin namang pakinggan ang Kanyang salita na nagpapakita ng katiyakan ng pagpapatawad ng isang maawain at mapagbiyayang Diyos.",
  "Hymn of Propitiation":
    "Bilang tugon sa kaligtasan na mayroon kay Cristo Jesus, ating awitin ang “{{song}}.”",
  "Prayer for Illumination": "Tayo po ay manalangin.",
  "Psalm of Proclamation":
    "Bilang paghahanda sa pangangaral ng Salita ng Diyos, ating awitin ang {{song}}. Ito ang sinasabi ng [Scripture]:",
  "Hymn of Dedication":
    "Matapos nating marinig ang pangangaral ng Salita ng Diyos na mamuhay bilang mga Kristiyano ayon sa Espiritu, ating awitin ang “{{song}}” bilang tugon.",
  "Affirmation of Faith": "Ano ang ating paniniwala at dapat paniwalaan? <{{creed}}>:",
  "Offertory Call":
    "Bilang bahagi ng ating pagsamba sa ating Diyos na buháy, tayo ay magkakaloob. Sa sulat ni Apostol Pablo sa {{scripture}}, makikita natin ang pangako ng Diyos sa mga nagkakaloob para sa gawain ng Panginoon:",
  "Psalm of Thanksgiving":
    "Habang tayo’y nagkakaloob, ating sariwain ang mga kabutihan ng Diyos sa atin sa pamamagitan ng {{song}}.",
  Charge: "Matapos nating makita ang pagliligtas ng Diyos at marinig ang Kanyang Salita, ano ang nararapat nating tugon?",
  Benediction: "Tanggapin natin ang basbas mula sa {{scripture}}:",
};
