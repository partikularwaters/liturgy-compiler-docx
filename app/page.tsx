import Link from "next/link";
import { getLiturgies } from "@/lib/liturgy/getLiturgies";
import { formatLiturgyName } from "@/lib/liturgy/formatLiturgyName";

const RECENT_COUNT = 5;

export default async function Home(): Promise<React.ReactElement> {
  const liturgies = await getLiturgies();
  const recent = liturgies.slice(0, RECENT_COUNT);

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col items-start text-left gap-8">
      <p className="font-serif-body text-[32px] leading-[1.4] font-bold text-text-primary italic max-w-[820px]">
        Glory be to the Father, and to the Son, and to the Holy Spirit; as it was in the
        beginning, is now, and ever shall be, world without end. Amen.
      </p>

      <div className="flex items-center gap-3">
        <Link
          href="/liturgy/new"
          className="bg-accent text-accent-foreground rounded-md px-8 py-4 text-[18px] font-semibold"
        >
          Create Liturgy
        </Link>
        <Link
          href="/library"
          className="bg-surface border border-border text-text-primary rounded-md px-8 py-4 text-[18px] font-medium"
        >
          Browse Library
        </Link>
      </div>

      <div className="w-full text-left flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">
          Recent Liturgies
        </h2>

        {recent.length === 0 ? (
          <p className="text-sm text-text-muted">No liturgies yet.</p>
        ) : (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {recent.map((liturgy, index) => (
              <Link
                key={liturgy.id}
                href={`/liturgy/${liturgy.id}`}
                className={`block px-6 py-3 text-sm text-text-primary hover:bg-surface-secondary ${
                  index < recent.length - 1 ? "border-b border-border" : ""
                }`}
              >
                {formatLiturgyName(liturgy)}
              </Link>
            ))}
          </div>
        )}

        <Link href="/liturgies" className="text-sm font-medium text-accent-dark self-start">
          View all liturgies →
        </Link>
      </div>
    </div>
  );
}
