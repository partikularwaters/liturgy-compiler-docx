import SignupForm from "@/app/signup/SignupForm";

export default function SignupPage(): React.ReactElement {
  return (
    <div className="max-w-[400px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">Sign Up</h1>
      <p className="text-sm text-text-muted">
        Creates your account and submits it to the Curator for approval -- browsing the Library, Bible Reader, and
        public liturgies never requires an account at all.
      </p>
      <SignupForm />
    </div>
  );
}
