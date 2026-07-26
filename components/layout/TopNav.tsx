import { Suspense } from "react";
import TopNavLinks from "@/components/layout/TopNavLinks";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default async function TopNav(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();

  return (
    <Suspense
      fallback={
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
          <div className="w-full max-w-[900px] bg-accent rounded-full shadow-lg h-14" />
        </div>
      }
    >
      <TopNavLinks currentUser={currentUser} />
    </Suspense>
  );
}
