import Link from "next/link";
import { getLiturgies } from "@/lib/liturgy/getLiturgies";
import { groupLiturgiesByDate } from "@/lib/liturgy/groupLiturgiesByDate";
import { getLiturgy } from "@/lib/liturgy/getLiturgy";
import { computeProgress } from "@/lib/liturgy/readiness";
import LiturgyDateRow from "@/components/liturgy/LiturgyDateRow";
import { PlusIcon } from "@/components/liturgy/icons";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getCurrentUserName } from "@/lib/auth/getCurrentUserName";

// Same reasoning as app/page.tsx — always reflect the live liturgy list.
export const dynamic = "force-dynamic";

export default async function LiturgiesPage(): Promise<React.ReactElement> {
  const [liturgies, currentUser] = await Promise.all([getLiturgies(), getCurrentUser()]);
  const dateGroups = groupLiturgiesByDate(liturgies);

  // Only this page's options menu needs "is this liturgy actually complete"
  // -- the homepage preview is readOnly and never renders the menu, so it
  // never pays for this. One computeProgress() per liturgy shown, accepted
  // at this app's scale (a small congregation, not hundreds of liturgies).
  let currentUserName: string | null = null;
  const readiness: Record<string, { status: "draft" | "ready"; canMarkReady: boolean }> = {};
  if (currentUser) {
    currentUserName = await getCurrentUserName();
    const fullLiturgies = await Promise.all(liturgies.map((summary) => getLiturgy(summary.id)));
    fullLiturgies.forEach((full) => {
      if (!full) return;
      const progress = computeProgress(full);
      readiness[full.id] = { status: full.status, canMarkReady: progress.missing.length === 0 };
    });
  }

  return (
    <div className="max-w-[1120px] mx-auto p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif-body text-[28px] font-bold leading-9 text-text-primary [font-variant:small-caps]">
          Liturgies
        </h1>
        {currentUser && (
          <Link
            href="/liturgy/new"
            className="flex items-center gap-1 bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
          >
            <PlusIcon size={15} /> New Liturgy
          </Link>
        )}
      </div>

      {dateGroups.length === 0 ? (
        <div>
          <p className="text-sm text-text-muted">No liturgies yet.</p>
          {currentUser && (
            <Link
              href="/liturgy/new"
              className="mt-4 inline-block bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium"
            >
              Start your first liturgy
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          {dateGroups.map((group, index) => (
            <LiturgyDateRow
              key={group.serviceDate}
              group={group}
              isLast={index === dateGroups.length - 1}
              currentUser={currentUser}
              currentUserName={currentUserName}
              readiness={readiness}
            />
          ))}
        </div>
      )}
    </div>
  );
}
