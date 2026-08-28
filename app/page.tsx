import Link from "next/link";
import { getLiturgies } from "@/lib/liturgy/getLiturgies";
import { groupLiturgiesByDate } from "@/lib/liturgy/groupLiturgiesByDate";
import LiturgyDateRow from "@/components/liturgy/LiturgyDateRow";
import { ArrowRightIcon, PlusIcon } from "@/components/liturgy/icons";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

// "Recent" means recent service dates, not recent liturgy rows -- a paired
// Morning+Vesper Sunday is one date and can surface up to 10 liturgies here,
// matching /liturgies' own groupLiturgiesByDate/LiturgyDateRow pairing
// (2026-07-29) that this preview never picked up until now.
const RECENT_DATE_COUNT = 5;

// Always reads the live liturgy list — otherwise a newly created liturgy can
// be missing from this page until the next deploy if Next statically caches it.
export const dynamic = "force-dynamic";

export default async function Home(): Promise<React.ReactElement> {
  const [liturgies, currentUser] = await Promise.all([getLiturgies(), getCurrentUser()]);
  const recentDateGroups = groupLiturgiesByDate(liturgies).slice(0, RECENT_DATE_COUNT);

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
            image is roughly square (2329x2152) and this box is 30:7 (~4.29:1
            -- 30% shorter than the original 3:1, at Madrid's request: "the
            banner on PC is too much"), so showing only a slice of the
            image's height is unavoidable -- same as any full-bleed
            background image (object-fit: cover is the standard,
            deterministic way to do this). That slice is not the bug that
            caused corner gaps -- OVERSIZE was.
          FOCAL_Y: where the crop window's top edge lands, as a percentage
            top-to-bottom of the source image -- NOT the same as "where the
            heading sits," because object-position anchors a point in the
            image to that same fractional point in the (smaller) container,
            which pushes the window's actual top edge down by a factor of
            (1 - window-height-fraction). 38% lands the window's top edge
            right at the "Assurance of Pardon" heading (~32% down the page,
            same anchor as before the 30%-shorter change -- FOCAL_Y had to
            move since a shallower window has a different windowFraction).
            Recompute (top = FOCAL_Y * (1 - windowFraction), where
            windowFraction = (imageAspect / ASPECT_RATIO) / OVERSIZE) if the
            source image, ASPECT_RATIO, or OVERSIZE changes.
          ANGLE: 0 = straight. Negative tilts so text reads upward left-to-right.
          OVERSIZE: how much the image is scaled up beyond exactly filling the
            box, to guarantee the rotated image still fully covers every
            corner. This is NOT a "just eyeball it" number -- rotating a
            W:H box by angle θ needs oversize >= max(cosθ + (H/W)sinθ,
            (W/H)sinθ + cosθ). For this shallower 30:7 box at 7°, that
            minimum is ~1.515 (higher than the original 3:1 box's ~1.358 --
            a wider/shallower box needs MORE oversize to cover after
            rotation, not less). 1.56 gives the same small safety margin
            above the true minimum the original 1.4 did. If ASPECT_RATIO or
            ANGLE change, recompute this.
          TINT_OPACITY: strength of the accent-color tint over the image, 0-1.
            Uses the site's actual --color-accent token (bg-accent), not a
            hardcoded color -- if the brand color ever changes, this updates
            with it automatically. Set to 0 to remove the tint entirely. */}
      <div
        className="w-full overflow-hidden relative bg-surface-secondary"
        style={{ aspectRatio: "30 / 7" }} /* ASPECT_RATIO */
      >
        <img
          src="/images/Calvin-Absolution.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectPosition: "50% 38%", // FOCAL_Y
            transform: "rotate(-7deg) scale(1.56)", // ANGLE, OVERSIZE
          }}
        />
        <div className="absolute inset-0 bg-cta-yellow mix-blend-multiply" style={{ opacity: 0.18 }} /> {/* TINT_OPACITY */}
      </div>
      <div className="max-w-[960px] mx-auto p-8 flex flex-col items-start text-left gap-8 transition-[opacity,transform] duration-[var(--duration-modal)] ease-[var(--ease-out-strong)] starting:opacity-0 motion-safe:starting:-translate-y-1">
      <p className="font-serif-body text-[26px] leading-[1.4] font-bold text-text-primary italic max-w-[820px]">
        Glory be to the Father, and to the Son, and to the Holy Spirit; as it was in the
        beginning, is now, and ever shall be, world without end. Amen.
      </p>

      <div className="flex items-center gap-3">
        {/* Hidden entirely (not just server-rejected) for an anonymous
            visitor -- liturgy creation now requires an account. */}
        {currentUser && (
          <Link
            href="/liturgy/new"
            className="flex items-center gap-1.5 bg-accent text-accent-foreground rounded-full px-3 py-1.5 text-[13px] font-semibold transition-[background-color,transform] duration-[var(--duration-press)] ease-[var(--ease-out-strong)] hover:bg-accent-dark motion-safe:active:scale-[0.97]"
          >
            <PlusIcon size={14} /> Create Liturgy
          </Link>
        )}
        <Link
          href="/library"
          className="flex items-center gap-1.5 bg-surface border border-border text-text-primary rounded-full px-3 py-1.5 text-[13px] font-medium transition-[background-color,transform] duration-[var(--duration-press)] ease-[var(--ease-out-strong)] hover:bg-surface-secondary motion-safe:active:scale-[0.97]"
        >
          <ArrowRightIcon size={14} /> Browse Library
        </Link>
      </div>

      <div className="w-full text-left flex flex-col gap-3">
        <h2 className="text-[18px] font-semibold leading-[26px] text-text-primary">
          Recent Liturgies
        </h2>

        {recentDateGroups.length === 0 ? (
          <p className="text-sm text-text-muted">No liturgies yet.</p>
        ) : (
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            {recentDateGroups.map((group, index) => (
              <LiturgyDateRow
                key={group.serviceDate}
                group={group}
                isLast={index === recentDateGroups.length - 1}
                currentUser={currentUser}
                readOnly
              />
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
