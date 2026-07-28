"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/lib/auth/authActions";

export default function ForgotPasswordForm(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    requestPasswordReset(email).then((result) => {
      setIsSubmitting(false);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "Unable to send a reset email right now.");
      }
    });
  };

  if (submitted) {
    return (
      <p className="text-sm text-text-secondary">If that email has an account, a password reset link is on its way.</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-text-secondary" htmlFor="forgot-email">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-accent focus:border-accent"
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="self-start bg-accent text-accent-foreground rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {isSubmitting ? "Sending…" : "Send Reset Link"}
      </button>
    </form>
  );
}
