import { getAccountRequests } from "@/lib/curatorInbox/getAccountRequests";
import { getLibrarySubmissions } from "@/lib/curatorInbox/getLibrarySubmissions";

// Combined count of everything actionable in the Curator Inbox -- Account
// Requests and Library Submissions only. Active Accounts, Bin, and Deletion
// Log are informational tabs, not a queue awaiting a decision, so they never
// contribute to this count.
export async function getPendingCuratorCount(): Promise<number> {
  const [accountRequests, librarySubmissions] = await Promise.all([getAccountRequests(), getLibrarySubmissions()]);
  return (
    accountRequests.length + librarySubmissions.prayersAndSongs.length + librarySubmissions.formulas.length
  );
}
