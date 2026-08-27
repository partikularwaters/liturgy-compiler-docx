import { cache } from "react";
import type { Metadata } from "next";
import LiturgyWebView from "@/components/liturgy/LiturgyWebView";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { getFormulas } from "@/lib/formulas/getFormulas";
import { getPrayers } from "@/lib/prayers/getPrayers";
import { getSongs } from "@/lib/songs/getSongs";
import { buildWebViewDescription, buildWebViewTitle, WEB_VIEW_SITE_NAME } from "@/lib/liturgy/webViewMetadata";

// Always reads live data -- same cached-fetch bug class fixed on the
// homepage, Library, and Compile View pages.
export const dynamic = "force-dynamic";

// React's cache() dedupes this within a single request, so generateMetadata
// and the page body share one Supabase read instead of two.
const getCachedLiturgy = cache(getLiturgy);

interface LiturgyViewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LiturgyViewPageProps): Promise<Metadata> {
  const { id } = await params;
  const liturgy = await getCachedLiturgy(id);

  if (!liturgy) {
    return { title: "Liturgy Not Found | Liturgy Compiler" };
  }

  const title = buildWebViewTitle(liturgy);
  const description = buildWebViewDescription(liturgy);
  // Manually wired, not Next's opengraph-image.tsx auto-discovery -- see
  // opengraph-image/route.tsx's own comment for why this had to become a
  // plain Route Handler instead of that special-file convention.
  const imageUrl = `${process.env.SITE_URL ?? ""}/liturgy/${id}/view/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: WEB_VIEW_SITE_NAME,
      type: "website",
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
  };
}

export default async function LiturgyViewPage({ params }: LiturgyViewPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const [liturgy, formulas, prayers, songs] = await Promise.all([
    getCachedLiturgy(id),
    getFormulas(),
    getPrayers(),
    getSongs(),
  ]);

  if (!liturgy) {
    return (
      <div className="max-w-[640px] mx-auto px-6 py-10">
        <p className="text-sm text-text-muted">Liturgy not found.</p>
      </div>
    );
  }

  // Same read/resolution path as the generated artifacts (architecture.md's
  // Flow 3) -- a library read failure here shouldn't silently render a
  // congregation-facing page missing real content any more than it should
  // silently produce an incomplete export.
  if (formulas === null || prayers === null || songs === null) {
    return (
      <div className="max-w-[640px] mx-auto px-6 py-10">
        <p className="text-sm text-text-muted">Unable to load this liturgy’s content right now. Please try again.</p>
      </div>
    );
  }

  return <LiturgyWebView liturgy={liturgy} formulas={formulas} prayers={prayers} songs={songs} />;
}
