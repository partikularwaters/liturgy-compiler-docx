import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import { getFormulas } from "@/lib/formulas/getFormulas";
import NewFormulaClient from "@/app/formulas/new/NewFormulaClient";

export default async function NewFormulaPage(): Promise<React.ReactElement> {
  const [sectionNames, allFormulas] = await Promise.all([getSectionNames(), getFormulas()]);

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">New Formula</h1>
      <NewFormulaClient sectionNames={sectionNames} allFormulas={allFormulas} />
    </div>
  );
}
