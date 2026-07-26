import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getAccountRequests } from "@/lib/curatorInbox/getAccountRequests";
import { getLibrarySubmissions } from "@/lib/curatorInbox/getLibrarySubmissions";
import { getActiveAccounts } from "@/lib/curatorInbox/getActiveAccounts";
import { getBinnedItems } from "@/lib/curatorInbox/getBinnedItems";
import AccountRequestsTab from "@/app/curator-inbox/AccountRequestsTab";
import LibrarySubmissionsTab from "@/app/curator-inbox/LibrarySubmissionsTab";
import ActiveAccountsTab from "@/app/curator-inbox/ActiveAccountsTab";
import BinTab from "@/app/curator-inbox/BinTab";

export const dynamic = "force-dynamic";

export default async function CuratorInboxPage(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "curator") {
    return (
      <div className="max-w-[960px] mx-auto p-8">
        <p className="text-sm text-text-muted">The Curator Inbox is only visible to a Curator account.</p>
      </div>
    );
  }

  const [accountRequests, librarySubmissions, activeAccounts, binnedItems] = await Promise.all([
    getAccountRequests(),
    getLibrarySubmissions(),
    getActiveAccounts(),
    getBinnedItems(),
  ]);

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">Curator Inbox</h1>
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-text-primary">
            Account Requests {accountRequests.length > 0 && `(${accountRequests.length})`}
          </h2>
          <AccountRequestsTab requests={accountRequests} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-text-primary">Library Submissions</h2>
          <LibrarySubmissionsTab submissions={librarySubmissions} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-text-primary">Active Accounts</h2>
          <ActiveAccountsTab accounts={activeAccounts} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-text-primary">Bin</h2>
          <BinTab items={binnedItems} />
        </section>
      </div>
    </div>
  );
}
