import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import NewFormulaClient from "@/app/formulas/new/NewFormulaClient";

export default async function NewFormulaPage(): Promise<React.ReactElement> {
  const sectionNames = await getSectionNames();

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">New Formula</h1>
      <NewFormulaClient sectionNames={sectionNames} />
    </div>
  );
}
