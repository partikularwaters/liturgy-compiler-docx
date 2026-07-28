"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HomeIcon, PlusIcon, TriangleIcon } from "@/components/liturgy/icons";
import AccountMenu from "@/components/layout/AccountMenu";
import type { CurrentUser } from "@/lib/auth/getCurrentUser";
import type { SessionStatus } from "@/lib/auth/getSessionStatus";

interface TopNavLinksProps {
  currentUser: CurrentUser | null;
  sessionStatus: SessionStatus;
}

export default function TopNavLinks({ currentUser, sessionStatus }: TopNavLinksProps): React.ReactElement | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // "Auto-hiding nav" / "hide-on-scroll" -- slides the pill up out of view
  // when scrolling down (so it doesn't sit over content while reading),
  // and reveals it again on any upward scroll. Always visible near the very
  // top of the page regardless of direction, so it doesn't vanish the
  // instant you start scrolling from rest.
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const handleScroll = (): void => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;
      if (currentScrollY < 80) {
        setIsHidden(false);
      } else if (delta > 8) {
        setIsHidden(true);
      } else if (delta < -8) {
        setIsHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // The public, shareable Liturgy Web View has no nav bar at all -- it's
  // meant to be the liturgy alone, viewed by a congregation member who has
  // no reason to see (or be tempted to click into) the compiler's own
  // navigation.
  if (/^\/liturgy\/[^/]+\/view$/.test(pathname)) return null;

  const isCompilingInReader = pathname === "/reader" && searchParams.has("liturgyId");
  const isLiturgiesActive =
    isCompilingInReader ||
    pathname === "/liturgies" ||
    pathname.startsWith("/liturgy/");
  const isReaderActive = pathname === "/reader" && !isCompilingInReader;
  const isLibraryActive = pathname === "/library";

  const isHomepage = pathname === "/";

  return (
    <>
      {/* Floating pill nav (task 24): fixed and rounded, not full-bleed, so it
          reads as an element sitting on top of the page rather than a bar
          clipping across it -- Madrid's own framing, specifically about the
          homepage banner. Since this is fixed (out of document flow), the
          spacer below reserves its height on every OTHER page so the pill
          doesn't overlap that page's own content -- the homepage's banner is
          deliberately left to run underneath it uncompensated, since floating
          over the banner is the whole point here.

          Hides on scroll-down, reveals on scroll-up (a single transform, not
          display:none, so the height/layout never jumps). Liturgies/Bible
          Reader/Library text links are hidden below `md` -- all six items
          (icon, 3 links, CTA, account menu) never fit a phone-width pill
          without either overflowing past the rounded right edge or pushing
          the account menu (and with it, Sign In/Sign Up) off past the
          visible pill entirely, which is exactly what was happening.

          Horizontal centering moved to this OUTER wrapper (flexbox,
          untransformed) rather than nav's own `left-1/2 -translate-x-1/2` --
          Tailwind v4 utilities set the modern standalone `translate` CSS
          property, and combining it on the same element with the hide/
          reveal transform below doesn't compose reliably. Splitting them
          across two elements (centering here, hide/reveal on nav itself)
          means neither element ever needs two transforms at once. */}
      <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
        <nav
          className="w-full max-w-[900px] bg-accent rounded-full shadow-lg transition-transform duration-300"
          style={{ transform: isHidden ? "translateY(-6rem)" : "translateY(0)" }}
        >
          <div className="px-6 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          title="Home"
          className={
            isHomepage
              ? "text-accent-foreground"
              : "text-accent-foreground/70 hover:text-accent-foreground"
          }
        >
          <HomeIcon size={20} />
        </Link>
        <div className="hidden md:flex items-center gap-6 mr-auto ml-6">
          {/* Active-page indicator: a small triangle beneath the current
              link, pointing up at it -- the previous full-opacity-vs-70%
              treatment was too subtle to read as "you are here" at a
              glance. */}
          <span className="relative flex flex-col items-center">
            <Link
              href="/liturgies"
              className={
                isLiturgiesActive
                  ? "text-sm font-semibold text-accent-foreground"
                  : "text-sm font-medium text-accent-foreground/70 hover:text-accent-foreground"
              }
            >
              Liturgies
            </Link>
            {isLiturgiesActive && (
              <TriangleIcon size={8} className="absolute -bottom-2 text-accent-foreground" />
            )}
          </span>
          <span className="relative flex flex-col items-center">
            <Link
              href="/reader"
              className={
                isReaderActive
                  ? "text-sm font-semibold text-accent-foreground"
                  : "text-sm font-medium text-accent-foreground/70 hover:text-accent-foreground"
              }
            >
              Bible Reader
            </Link>
            {isReaderActive && (
              <TriangleIcon size={8} className="absolute -bottom-2 text-accent-foreground" />
            )}
          </span>
          {/* Library is now a persistent link like the two above, instead of
              borrowing the CTA button's slot (that button used to relabel
              itself to "Browse Library" on every non-home page, which read
              as two different actions rather than one consistent nav). */}
          <span className="relative flex flex-col items-center">
            <Link
              href="/library"
              className={
                isLibraryActive
                  ? "text-sm font-semibold text-accent-foreground"
                  : "text-sm font-medium text-accent-foreground/70 hover:text-accent-foreground"
              }
            >
              Library
            </Link>
            {isLibraryActive && (
              <TriangleIcon size={8} className="absolute -bottom-2 text-accent-foreground" />
            )}
          </span>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          {/* CTA is always "Create Liturgy" now -- same primary action on
              every page, not context-dependent. Hidden entirely (not just
              server-rejected) for an anonymous visitor -- liturgy creation
              now requires an account. */}
          {currentUser && (
            <Link
              href="/liturgy/new"
              className="flex items-center gap-1 bg-cta-yellow text-cta-yellow-foreground rounded-full px-3 py-1.5 text-[13px] font-medium whitespace-nowrap"
            >
              <PlusIcon size={14} /> Create Liturgy
            </Link>
          )}
          <AccountMenu currentUser={currentUser} sessionStatus={sessionStatus} />
        </div>
          </div>
        </nav>
      </div>
      {!isHomepage && <div className="h-[72px]" aria-hidden="true" />}
    </>
  );
}
