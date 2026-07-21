import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import NewScriptureClient from "@/app/selections/new/NewScriptureClient";

export default async function NewScripturePage(): Promise<React.ReactElement> {
  const sectionNames = await getSectionNames();

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">New Scripture</h1>
      <NewScriptureClient sectionNames={sectionNames} />
    </div>
  );
}
