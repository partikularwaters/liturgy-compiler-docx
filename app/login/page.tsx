import LoginForm from "@/app/login/LoginForm";

export default function LoginPage(): React.ReactElement {
  return (
    <div className="max-w-[400px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">Sign In</h1>
      <p className="text-sm text-text-muted">
        Curator and Compiler accounts only -- browsing the Library, Bible Reader, and public liturgies never
        requires signing in.
      </p>
      <LoginForm />
    </div>
  );
}
