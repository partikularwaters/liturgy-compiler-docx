import Link from "next/link";
import LoginForm from "@/app/login/LoginForm";

export default function LoginPage(): React.ReactElement {
  return (
    <div className="max-w-[400px] mx-auto p-8 flex flex-col gap-6">
      <h1 className="text-[28px] font-bold leading-9 text-text-primary">Sign In</h1>
      <p className="text-sm text-text-muted">Sign in to Reformed Life Covenant Church Liturgy Compiler</p>
      <LoginForm />
      <div className="flex flex-col gap-1 text-sm">
        <Link href="/forgot-password" className="text-accent hover:underline">
          Forgot your password?
        </Link>
        <Link href="/signup" className="text-accent hover:underline">
          Don’t have an account? Sign up here.
        </Link>
      </div>
    </div>
  );
}
