"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Display-only AB2001 hover preview via BibleGateway's own RefTag/BGLinks
// widget — it scans visible page text for citation patterns itself (no
// per-reference markup needed) and fetches tooltip content directly from
// BibleGateway's servers. No AB2001/MBB text is ever fetched, stored, or
// persisted in this codebase (architecture.md's invariant). AB2001 is the
// fixed default version; the widget only supports one active version at a
// time, so this is a deliberate simplification, not a partial toggle.
declare global {
  interface Window {
    BGLinks?: {
      version: string;
      linkVerses: () => void;
    };
  }
}

const SCRIPT_SRC = "https://www.biblegateway.com/public/link-to-us/tooltips/bglinks.js";
const VERSION = "ABTAG2001";

export default function ScriptureLinker(): null {
  const pathname = usePathname();

  useEffect(() => {
    if (window.BGLinks) {
      window.BGLinks.version = VERSION;
      window.BGLinks.linkVerses();
      return;
    }

    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.BGLinks) {
        window.BGLinks.version = VERSION;
        window.BGLinks.linkVerses();
      }
    };
    document.body.appendChild(script);
  }, [pathname]);

  return null;
}
