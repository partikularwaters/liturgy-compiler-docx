import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import NewPrayerClient from "@/app/prayers/new/NewPrayerClient";

export default async function NewPrayerPage(): Promise<React.ReactElement> {
  const sectionNames = await getSectionNames();

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">New Prayer</h1>
      <NewPrayerClient sectionNames={sectionNames} />
    </div>
  );
}
