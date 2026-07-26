import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import NewLiturgyForm from "@/app/liturgy/new/NewLiturgyForm";

export default async function NewLiturgyPage(): Promise<React.ReactElement> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return (
      <div className="max-w-[960px] mx-auto p-8">
        <p className="text-sm text-text-muted">Sign in to create a new liturgy.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">New Liturgy</h1>
      <NewLiturgyForm />
    </div>
  );
}
