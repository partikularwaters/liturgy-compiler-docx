import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import { getFormulas } from "@/lib/formulas/getFormulas";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import NewFormulaClient from "@/app/formulas/new/NewFormulaClient";

export default async function NewFormulaPage(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return (
      <div className="max-w-[960px] mx-auto p-8">
        <p className="text-sm text-text-muted">Sign in to create a new Formula.</p>
      </div>
    );
  }

  const [sectionNames, allFormulasResult] = await Promise.all([getSectionNames("formula"), getFormulas()]);
  const allFormulas = allFormulasResult ?? [];

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">New Formula</h1>
      <NewFormulaClient sectionNames={sectionNames} allFormulas={allFormulas} />
    </div>
  );
}
