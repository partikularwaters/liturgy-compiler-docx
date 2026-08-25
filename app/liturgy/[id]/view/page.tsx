import LiturgyWebView from "@/components/liturgy/LiturgyWebView";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { getFormulas } from "@/lib/formulas/getFormulas";
import { getPrayers } from "@/lib/prayers/getPrayers";
import { getSongs } from "@/lib/songs/getSongs";

// Always reads live data -- same cached-fetch bug class fixed on the
// homepage, Library, and Compile View pages.
export const dynamic = "force-dynamic";

interface LiturgyViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function LiturgyViewPage({ params }: LiturgyViewPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const [liturgy, formulas, prayers, songs] = await Promise.all([
    getLiturgy(id),
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
