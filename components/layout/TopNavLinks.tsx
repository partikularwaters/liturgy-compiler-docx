"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HomeIcon } from "@/components/liturgy/icons";
import AccountMenu from "@/components/layout/AccountMenu";
import type { CurrentUser } from "@/lib/auth/getCurrentUser";

interface TopNavLinksProps {
  currentUser: CurrentUser | null;
}

export default function TopNavLinks({ currentUser }: TopNavLinksProps): React.ReactElement | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
          over the banner is the whole point here. */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[900px] bg-accent rounded-full shadow-lg">
        <div className="px-6 h-14 flex items-center justify-between gap-6">
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
        <div className="flex items-center gap-6">
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
          {/* Library is now a persistent link like the two above, instead of
              borrowing the CTA button's slot (that button used to relabel
              itself to "Browse Library" on every non-home page, which read
              as two different actions rather than one consistent nav). */}
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
          {/* CTA is always "Create Liturgy" now -- same primary action on
              every page, not context-dependent. */}
          <Link
            href="/liturgy/new"
            className="bg-cta-yellow text-cta-yellow-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            Create Liturgy
          </Link>
          <AccountMenu currentUser={currentUser} />
        </div>
        </div>
      </nav>
      {!isHomepage && <div className="h-[72px]" aria-hidden="true" />}
    </>
  );
}
