import { Suspense } from "react";
import TopNavLinks from "@/components/layout/TopNavLinks";

export default function TopNav(): React.ReactElement {
  return (
    <Suspense fallback={<div className="w-full bg-accent h-14" />}>
      <TopNavLinks />
    </Suspense>
  );
}
