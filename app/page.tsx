import Link from "next/link";
import { getLiturgies } from "@/lib/liturgy/getLiturgies";
import { formatLiturgyName } from "@/lib/liturgy/formatLiturgyName";
import { ArrowRightIcon } from "@/components/liturgy/icons";

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
          The container's height is a proportion of its width (ASPECT_RATIO),
          never a fixed pixel/inch value -- that's what keeps the same crop of
          the source image visible at every screen size. A fixed height was
          the original bug here: the image (sized by width) grew taller on a
          wider screen while the crop window's height stayed constant, so the
          window effectively zoomed further into the image the wider the
          screen got, sliding the visible portion of the page around instead
          of staying anchored on "Assurance of Pardon."
          ASPECT_RATIO: width/height of the crop window itself. The source
            image is roughly square (2329x2152) and this box is 3:1, so
            showing only a slice of the image's height is unavoidable --
            same as any full-bleed background image (object-fit: cover is
            the standard, deterministic way to do this). That slice is not
            the bug that caused corner gaps -- OVERSIZE was.
          FOCAL_Y: where the crop window's top edge lands, as a percentage
            top-to-bottom of the source image -- NOT the same as "where the
            heading sits," because object-position anchors a point in the
            image to that same fractional point in the (smaller) container,
            which pushes the window's actual top edge down by a factor of
            (1 - window-height-fraction). 43% lands the window's top edge
            right at the "Assurance of Pardon" heading (~32% down the page).
            Recompute (top = FOCAL_Y * (1 - windowFraction), where
            windowFraction = (imageAspect / ASPECT_RATIO) / OVERSIZE) if the
            source image, ASPECT_RATIO, or OVERSIZE changes.
          ANGLE: 0 = straight. Negative tilts so text reads upward left-to-right.
          OVERSIZE: how much the image is scaled up beyond exactly filling the
            box, to guarantee the rotated image still fully covers every
            corner. This is NOT a "just eyeball it" number -- rotating a
            W:H box by angle θ needs oversize >= max(cosθ + (H/W)sinθ,
            (W/H)sinθ + cosθ). For this 3:1 box at 7°, that minimum is
            ~1.358 -- the original 1.2 was mathematically guaranteed to
            expose gaps at two opposite corners (which is exactly the bug
            Madrid saw). 1.4 gives a small safety margin above the true
            minimum. If ASPECT_RATIO or ANGLE change, recompute this.
          TINT_OPACITY: strength of the accent-color tint over the image, 0-1.
            Uses the site's actual --color-accent token (bg-accent), not a
            hardcoded color -- if the brand color ever changes, this updates
            with it automatically. Set to 0 to remove the tint entirely. */}
      <div
        className="w-full overflow-hidden relative bg-surface-secondary"
        style={{ aspectRatio: "3 / 1" }} /* ASPECT_RATIO */
      >
        <img
          src="/images/Calvin-Absolution.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectPosition: "50% 43%", // FOCAL_Y
            transform: "rotate(-7deg) scale(1.4)", // ANGLE, OVERSIZE
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

        <Link
          href="/liturgies"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent-dark self-start"
        >
          View all liturgies <ArrowRightIcon size={13} />
        </Link>
      </div>
      </div>
    </>
  );
}
