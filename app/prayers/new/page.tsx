import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import { getPrayers } from "@/lib/prayers/getPrayers";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import NewPrayerClient from "@/app/prayers/new/NewPrayerClient";

export default async function NewPrayerPage(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return (
      <div className="max-w-[960px] mx-auto p-8">
        <p className="text-sm text-text-muted">Sign in to create a new Prayer.</p>
      </div>
    );
  }

  const [sectionNames, allPrayersResult] = await Promise.all([getSectionNames("prayer"), getPrayers()]);
  const allPrayers = allPrayersResult ?? [];

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">New Prayer</h1>
      <NewPrayerClient sectionNames={sectionNames} allPrayers={allPrayers} />
    </div>
  );
}
