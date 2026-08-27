import "server-only";

// Shared by every app/api/automation/ route that needs to hand n8n a real,
// absolute URL for an email (Compile View, public Web View) -- SITE_URL is
// a plain server-only env var (not NEXT_PUBLIC_) since it's only ever read
// here, never sent to a browser.
export function compileViewUrl(liturgyId: string): string {
  return `${process.env.SITE_URL ?? ""}/liturgy/${liturgyId}`;
}

export function webViewUrl(liturgyId: string): string {
  return `${process.env.SITE_URL ?? ""}/liturgy/${liturgyId}/view`;
}
