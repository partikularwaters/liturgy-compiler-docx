import { Suspense } from "react";
import TopNavLinks from "@/components/layout/TopNavLinks";

export default function TopNav(): React.ReactElement {
  return (
    <nav className="w-full bg-accent">
      <Suspense fallback={<div className="h-14" />}>
        <TopNavLinks />
      </Suspense>
    </nav>
  );
}
