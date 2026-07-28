import Link from "next/link";
import LoginForm from "@/app/login/LoginForm";

export default function LoginPage(): React.ReactElement {
  return (
    <div className="max-w-[400px] mx-auto p-8 flex flex-col gap-6">
      <div className="font-serif-body text-[19px] font-bold leading-[26px] text-text-primary text-center">
        <p>Sign in to</p>
        <p>Reformed Life Covenant Church</p>
        <p>Liturgy Compiler</p>
      </div>
      <LoginForm />
      <div className="flex flex-col gap-1 text-sm items-center text-center">
        <Link href="/signup" className="text-accent hover:underline">
          Don’t have an account? Sign up here.
        </Link>
      </div>
    </div>
  );
}
