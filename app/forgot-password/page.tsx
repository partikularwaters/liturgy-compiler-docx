import ForgotPasswordForm from "@/app/forgot-password/ForgotPasswordForm";

export default function ForgotPasswordPage(): React.ReactElement {
  return (
    <div className="max-w-[400px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">Forgot Password</h1>
      <p className="text-sm text-text-muted">Enter your account email and we’ll send you a password reset link.</p>
      <ForgotPasswordForm />
    </div>
  );
}
