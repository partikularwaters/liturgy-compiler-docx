import { Suspense } from "react";
import TopNavLinks from "@/components/layout/TopNavLinks";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getSessionStatus } from "@/lib/auth/getSessionStatus";
import { getPendingCuratorCount } from "@/lib/auth/getPendingCuratorCount";

export default async function TopNav(): Promise<React.ReactElement> {
  const [currentUser, sessionStatus] = await Promise.all([getCurrentUser(), getSessionStatus()]);
  // Only a Curator can ever see this count (AccountMenu's own role gate),
  // so skip the query entirely for every other visitor.
  const pendingCuratorCount = currentUser?.role === "curator" ? await getPendingCuratorCount() : 0;

  return (
    <Suspense
      fallback={
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
          <div className="w-full max-w-[900px] bg-accent rounded-full shadow-lg h-14" />
        </div>
      }
    >
      <TopNavLinks currentUser={currentUser} sessionStatus={sessionStatus} pendingCuratorCount={pendingCuratorCount} />
    </Suspense>
  );
}
