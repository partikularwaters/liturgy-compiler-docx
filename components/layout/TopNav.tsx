import { Suspense } from "react";
import TopNavLinks from "@/components/layout/TopNavLinks";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default async function TopNav(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();

  return (
    <Suspense
      fallback={
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[900px] bg-accent rounded-full shadow-lg h-14" />
      }
    >
      <TopNavLinks currentUser={currentUser} />
    </Suspense>
  );
}
