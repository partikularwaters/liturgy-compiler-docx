import { Suspense } from "react";
import TopNavLinks from "@/components/layout/TopNavLinks";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getSessionStatus } from "@/lib/auth/getSessionStatus";

export default async function TopNav(): Promise<React.ReactElement> {
  const [currentUser, sessionStatus] = await Promise.all([getCurrentUser(), getSessionStatus()]);

  return (
    <Suspense
      fallback={
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
          <div className="w-full max-w-[900px] bg-accent rounded-full shadow-lg h-14" />
        </div>
      }
    >
      <TopNavLinks currentUser={currentUser} sessionStatus={sessionStatus} />
    </Suspense>
  );
}
