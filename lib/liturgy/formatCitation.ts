// Normalizes a verse-range hyphen to an en dash (e.g. "47:5-9" -> "47:5–9")
// at write time, so a citation typed by hand matches buildCitation()'s
// output. Scoped to digit-hyphen-digit only -- doesn't touch a hyphen
// anywhere else in the string (there isn't normally one in a citation, but
// this stays safe if there ever is).
export function formatCitation(citation: string): string {
  return citation.replace(/(\d)-(\d)/g, "$1–$2");
}
