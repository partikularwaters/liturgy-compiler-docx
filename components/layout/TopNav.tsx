import { Suspense } from "react";
import TopNavLinks from "@/components/layout/TopNavLinks";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export default async function TopNav(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();

  return (
    <Suspense fallback={<div className="w-full bg-accent h-14" />}>
      <TopNavLinks currentUser={currentUser} />
    </Suspense>
  );
}
