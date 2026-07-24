"use client";

import { useRef, useState } from "react";
import { toEnglishCitation, parseCitationReference } from "@/lib/bible/bookNamesTagalog";
import type { BibleVerse } from "@/types/bible";

interface ScriptureCitationLinkProps {
  citation: string;
  translation?: "fil" | "en";
  className?: string;
}

// BibleGateway's RefTag/BGLinks widget (ScriptureLinker.tsx) only
// recognizes English book names/abbreviations in its own text-scanning --
// it never found a Filipino-named citation like "Mga Awit 95:1-3" on its
// own, which is why the hover widget worked in some Sections and not
// others (whichever ones happened to still have a legacy English citation).
// Builds the link by hand instead of relying on the scan: `data-bibleref`
// (confirmed present in bglinks.js's own source) overrides what the widget
// looks up, so the visible label can stay Filipino while the tooltip still
// resolves the correct passage.
function ABLink({ citation, className }: { citation: string; className?: string }): React.ReactElement {
  const english = toEnglishCitation(citation);
  const href = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(english)}&version=ABTAG2001&src=tools`;

  return (
    <a href={href} data-bibleref={english} className={`bibleref ${className ?? ""}`.trim()}>
      {citation}
    </a>
  );
}

// A BSB citation is already showing our own self-hosted text -- previewing
// that exact same excerpt again in a hover popup adds nothing. What's
// actually useful is more of it: a window of surrounding verses (see
// lib/bible/contextWindow.ts), fetched from our own data on hover, no
// external widget involved. Clicking through opens the Reader at that
// chapter for the full context.
function BSBLink({ citation, className }: { citation: string; className?: string }): React.ReactElement {
  const [verses, setVerses] = useState<BibleVerse[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipSide, setTooltipSide] = useState<"left" | "right">("left");
  const hasFetched = useRef(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const parsed = parseCitationReference(citation);
  const href = parsed
    ? `/reader?book=${encodeURIComponent(parsed.book)}&chapter=${parsed.chapter}&translation=en`
    : "/reader?translation=en";

  const showTooltip = (): void => {
    const rect = linkRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceOnRight = window.innerWidth - rect.left;
      setTooltipSide(spaceOnRight >= 320 ? "left" : "right");
    }
    setIsOpen(true);
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetch(`/api/bible/context?citation=${encodeURIComponent(citation)}`)
      .then((res) => res.json())
      .then((data) => setVerses(data.verses ?? []))
      .catch(() => setVerses([]));
  };

  return (
    <span className="relative inline-block">
      <a
        ref={linkRef}
        href={href}
        className={className}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setIsOpen(false)}
      >
        {citation}
      </a>
      {isOpen && (
        <span
          className={[
            "pointer-events-none absolute top-full mt-1 w-72 rounded-md border border-border bg-surface p-3 text-[13px] text-text-primary shadow-lg z-10 font-serif-body leading-[1.5]",
            tooltipSide === "left" ? "left-0" : "right-0",
          ].join(" ")}
        >
          {verses === null ? (
            <span className="block text-text-muted">Loading…</span>
          ) : verses.length === 0 ? (
            <span className="block text-text-muted">Unable to load this passage.</span>
          ) : (
            verses.map((v) => (
              <span key={v.number} className="block mb-1 last:mb-0">
                <span className="text-[11px] font-medium text-accent-dark align-super">{v.number}</span> {v.text}
              </span>
            ))
          )}
        </span>
      )}
    </span>
  );
}

export default function ScriptureCitationLink({
  citation,
  translation = "fil",
  className,
}: ScriptureCitationLinkProps): React.ReactElement {
  return translation === "en" ? (
    <BSBLink citation={citation} className={className} />
  ) : (
    <ABLink citation={citation} className={className} />
  );
}
