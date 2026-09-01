import Link from "next/link";
import { PlusIcon } from "@/components/liturgy/icons";

export default function AddScriptureFromReaderLink(): React.ReactElement {
  return (
    <Link
      href="/reader?from=library"
      className="inline-flex items-center gap-1 bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium transition-transform duration-[var(--duration-press)] ease-[var(--ease-out-strong)] motion-safe:active:scale-[0.97]"
    >
      <PlusIcon size={15} /> New Scripture
    </Link>
  );
}
