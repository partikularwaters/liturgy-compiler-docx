"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopNavLinks(): React.ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
    <div className="max-w-[960px] mx-auto px-8 h-14 flex items-center justify-end gap-6">
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
  );
}
