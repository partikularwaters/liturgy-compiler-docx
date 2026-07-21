import Link from "next/link";
import { getLiturgies } from "@/lib/liturgy/getLiturgies";
import { formatLiturgyName } from "@/lib/liturgy/formatLiturgyName";

const RECENT_COUNT = 5;

// Always reads the live liturgy list — otherwise a newly created liturgy can
// be missing from this page until the next deploy if Next statically caches it.
export const dynamic = "force-dynamic";

export default async function Home(): Promise<React.ReactElement> {
  const liturgies = await getLiturgies();
  const recent = liturgies.slice(0, RECENT_COUNT);

  return (
    <>
      {/* Banner image -- adjust the four values below.
          ANGLE: 0 = straight. Negative tilts so text reads upward left-to-right.
          OVERSIZE: how much bigger than 100% width the image is. If you see the
            page background peeking through any corner (check at a few browser
            widths), increase this number until it's gone -- this is what
            prevents gaps, and a bigger ANGLE or bigger HORIZONTAL shift both
            need a bigger OVERSIZE to stay gap-free.
          HORIZONTAL: -50 = centered. Move toward 0 to shift the image right,
            more negative to shift left.
          VERTICAL: which part of the source page shows. More negative moves
            the visible window further down the page.
          TINT_OPACITY: strength of the accent-color tint over the image, 0-1.
            Uses the site's actual --color-accent token (bg-accent), not a
            hardcoded color -- if the brand color ever changes, this updates
            with it automatically. Set to 0 to remove the tint entirely. */}
      <div className="w-full h-[4in] overflow-hidden relative bg-surface-secondary">
        <img
          src="/images/Calvin-Absolution.png"
          alt=""
          className="absolute top-1/2 left-1/2 max-w-none"
          style={{
            width: "calc(100% + 100px)", // OVERSIZE
            transform: "translate(-49%, -41.5%) rotate(-9deg)", // HORIZONTAL, VERTICAL, ANGLE
          }}
        />
        <div className="absolute inset-0 bg-cta-yellow mix-blend-multiply" style={{ opacity: 0.18 }} /> {/* TINT_OPACITY */}
      </div>
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
    </>
  );
}
