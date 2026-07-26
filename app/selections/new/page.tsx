import { getSectionNames } from "@/lib/liturgy/getSectionNames";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import NewScriptureClient from "@/app/selections/new/NewScriptureClient";

export default async function NewScripturePage(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return (
      <div className="max-w-[960px] mx-auto p-8">
        <p className="text-sm text-text-muted">Sign in to create a new Scripture item.</p>
      </div>
    );
  }

  const sectionNames = await getSectionNames("selection");

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">New Scripture</h1>
      <NewScriptureClient sectionNames={sectionNames} />
    </div>
  );
}
