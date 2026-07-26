import ResetPasswordForm from "@/app/reset-password/ResetPasswordForm";

export default function ResetPasswordPage(): React.ReactElement {
  return (
    <div className="max-w-[400px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">Set New Password</h1>
      <ResetPasswordForm />
    </div>
  );
}
