import LiturgyWebView from "@/components/liturgy/LiturgyWebView";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { getFormulas } from "@/lib/formulas/getFormulas";
import { getPrayers } from "@/lib/prayers/getPrayers";

interface LiturgyViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function LiturgyViewPage({ params }: LiturgyViewPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const [liturgy, formulas, prayers] = await Promise.all([
    getLiturgy(id),
    getFormulas(),
    getPrayers(),
  ]);

  if (!liturgy) {
    return (
      <div className="max-w-[640px] mx-auto px-6 py-10">
        <p className="text-sm text-text-muted">Liturgy not found.</p>
      </div>
    );
  }

  return <LiturgyWebView liturgy={liturgy} formulas={formulas} prayers={prayers} />;
}
