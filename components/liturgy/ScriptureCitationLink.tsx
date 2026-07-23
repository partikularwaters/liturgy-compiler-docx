import { toEnglishCitation } from "@/lib/bible/bookNamesTagalog";

interface ScriptureCitationLinkProps {
  citation: string;
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
// resolves the correct passage. `addBiblerefListeners()` attaches to any
// element with "bibleref" in its className, not just ones the widget itself
// created, so this is a supported pattern, not a hack.
export default function ScriptureCitationLink({
  citation,
  className,
}: ScriptureCitationLinkProps): React.ReactElement {
  const english = toEnglishCitation(citation);
  const href = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(english)}&version=ABTAG2001&src=tools`;

  return (
    <a href={href} data-bibleref={english} className={`bibleref ${className ?? ""}`.trim()}>
      {citation}
    </a>
  );
}
