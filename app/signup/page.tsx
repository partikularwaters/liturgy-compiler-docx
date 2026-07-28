import SignupForm from "@/app/signup/SignupForm";

export default function SignupPage(): React.ReactElement {
  return (
    <div className="max-w-[400px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">Sign Up</h1>
      <p className="text-sm text-text-muted">Sign up to Reformed Life Covenant Church Liturgy Compiler</p>
      <SignupForm />
    </div>
  );
}
