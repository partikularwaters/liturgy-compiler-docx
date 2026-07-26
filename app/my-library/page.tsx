import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getMyDrafts } from "@/lib/personalLibrary/getMyDrafts";
import MyDraftsList from "@/app/my-library/MyDraftsList";

export const dynamic = "force-dynamic";

export default async function MyLibraryPage(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="max-w-[960px] mx-auto p-8">
        <p className="text-sm text-text-muted">Sign in to see your own Library drafts.</p>
      </div>
    );
  }

  const drafts = await getMyDrafts(currentUser.id);

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">My Library</h1>
      <p className="text-sm text-text-muted">
        Your own drafts -- Prayer/Song edits saved to your Personal Library, and any new Formula proposals. Submit
        one when it's ready for the Curator to review.
      </p>
      <MyDraftsList drafts={drafts} />
    </div>
  );
}
