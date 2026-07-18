"use client";

import { useState } from "react";
import { CopyLinkIcon, CheckIcon } from "@/components/liturgy/icons";

interface CopyLinkButtonProps {
  path: string;
}

// Replaces the old "View / Share Liturgy" text link -- an icon button that
// copies the public Web View URL to the clipboard, with a "Copy Link" hover
// tooltip and a brief checkmark confirmation after clicking. Takes a path
// (not a full URL) and resolves the origin client-side via
// `window.location.origin` -- the parent is a Server Component with no
// access to the request's actual browser-facing origin.
export default function CopyLinkButton({ path }: CopyLinkButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const handleClick = (): void => {
    navigator.clipboard.writeText(`${window.location.origin}${path}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Copy Link"
      aria-label="Copy Link"
      className="bg-accent text-accent-foreground rounded-md p-2.5"
    >
      {copied ? <CheckIcon /> : <CopyLinkIcon />}
    </button>
  );
}
