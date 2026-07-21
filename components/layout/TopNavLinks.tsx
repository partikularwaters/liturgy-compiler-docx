"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { HomeIcon } from "@/components/liturgy/icons";

export default function TopNavLinks(): React.ReactElement | null {
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

  const isHomepage = pathname === "/";
  const ctaLabel = isHomepage ? "Create Liturgy" : "Browse Library";
  const ctaHref = isHomepage ? "/liturgy/new" : "/library";

  return (
    <nav className="w-full bg-accent">
      <div className="max-w-[960px] mx-auto px-8 h-14 flex items-center justify-between gap-6">
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
          <Link
            href={ctaHref}
            className="bg-cta-yellow text-cta-yellow-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </nav>
  );
}
