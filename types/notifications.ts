// Fired by exactly four server-side mutation points -- account approval and
// the three Library Submission review outcomes. See
// lib/notifications/createNotification.ts for where each is raised.
export type NotificationType =
  | "account_approved"
  | "submission_amended"
  | "submission_created_as_new"
  | "submission_rejected";

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}
