"use client";

import { useRef, useState } from "react";
import { toEnglishCitation, parseCitationReference } from "@/lib/bible/bookNamesTagalog";
import { ExternalLinkIcon } from "@/components/liturgy/icons";
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
// external widget involved. A dedicated button inside the tooltip opens
// the Reader at that chapter, in a new tab, for the full context.
function BSBLink({ citation, className }: { citation: string; className?: string }): React.ReactElement {
  const [verses, setVerses] = useState<BibleVerse[] | null>(null);
  const [referencedVerses, setReferencedVerses] = useState<Set<number>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [highlightActive, setHighlightActive] = useState(true);
  const [tooltipSide, setTooltipSide] = useState<"left" | "right">("left");
  const hasFetched = useRef(false);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsed = parseCitationReference(citation);
  const href = parsed
    ? `/reader?book=${encodeURIComponent(parsed.book)}&chapter=${parsed.chapter}&translation=en`
    : "/reader?translation=en";

  const showTooltip = (): void => {
    const rect = linkRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceOnRight = window.innerWidth - rect.left;
      setTooltipSide(spaceOnRight >= 400 ? "left" : "right");
    }
    setIsOpen(true);

    // Briefly highlights the actually-referenced verse(s) so it's obvious,
    // at a glance, which lines are the citation itself versus the padding
    // added around it -- fades on its own rather than staying lit, since
    // it's an orientation cue, not a permanent marker.
    setHighlightActive(true);
    if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
    highlightTimeout.current = setTimeout(() => setHighlightActive(false), 1500);

    if (hasFetched.current) return;
    hasFetched.current = true;
    fetch(`/api/bible/context?citation=${encodeURIComponent(citation)}`)
      .then((res) => res.json())
      .then((data) => {
        setVerses(data.verses ?? []);
        setReferencedVerses(new Set<number>(data.referencedVerses ?? []));
      })
      .catch(() => setVerses([]));
  };

  return (
    // Hover tracking lives on this outer group, not the citation link alone --
    // the tooltip needs to stay open while the mouse crosses from the link
    // into the tooltip itself (e.g. to reach the "View in Reader" button
    // below), matching how BibleGateway's own widget persists rather than
    // vanishing the instant the cursor leaves the link text.
    <span className="relative inline-block" onMouseEnter={showTooltip} onMouseLeave={() => setIsOpen(false)}>
      <a ref={linkRef} href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {citation}
      </a>
      {isOpen && (
        <span
          className={[
            "absolute top-full mt-1 w-[374px] rounded-md border border-border bg-surface p-3 shadow-lg z-10 flex flex-col gap-2",
            "font-serif-body text-[16px] leading-[1.6] text-text-primary [font-variant:normal]",
            tooltipSide === "left" ? "left-0" : "right-0",
          ].join(" ")}
        >
          <span>
            {verses === null ? (
              <span className="block text-text-muted text-[13px]">Loading…</span>
            ) : verses.length === 0 ? (
              <span className="block text-text-muted text-[13px]">Unable to load this passage.</span>
            ) : (
              verses.map((v) => (
                <span
                  key={v.number}
                  className={[
                    "block mb-1 last:mb-0 -mx-1 px-1 rounded transition-colors duration-1000",
                    referencedVerses.has(v.number) && highlightActive ? "bg-warning/10" : "bg-transparent",
                  ].join(" ")}
                >
                  <span className="text-[11px] font-medium text-accent-dark align-super">{v.number}</span> {v.text}
                </span>
              ))
            )}
          </span>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start inline-flex items-center gap-1 bg-error text-error-foreground rounded-full px-3 py-1 text-[12px] font-medium [font-variant:normal] hover:opacity-90"
          >
            View in Reader <ExternalLinkIcon size={13} />
          </a>
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
