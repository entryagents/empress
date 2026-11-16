"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { customerResetPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("email", email);

    try {
      const res = await customerResetPasswordAction(formData);
      if (res.success) {
        setSuccessMsg(res.message || "Password reset instructions have been sent to your email.");
      } else {
        setErrorMsg(res.error || "Unable to send reset email.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-[85vh] bg-ivory-100/60 pb-24 pt-36 text-wine-950 font-sans">
      <div className="container-x max-w-md">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-950 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Sign In
        </Link>

        <div className="mt-4 rounded-[2px] border border-wine-900/10 bg-white p-8 shadow-soft">
          <div className="text-center">
            <span className="font-serif text-2xl font-bold tracking-widest text-champagne-600">
              EMPRESS
            </span>
            <h1 className="mt-2 font-serif text-2xl font-light text-wine-950">
              Reset Password
            </h1>
            <p className="mt-1 text-xs text-wine-800/80">
              Enter your registered email address and we&apos;ll send a link to securely reset your password.
            </p>
          </div>

          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 rounded bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg ? (
            <div className="mt-6 rounded bg-emerald-50 border border-emerald-200 p-4 text-center">
              <CheckCircle2 className="mx-auto size-8 text-emerald-600 mb-2" />
              <p className="text-xs text-emerald-900 font-medium">{successMsg}</p>
              <Link
                href="/auth/login"
                className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider text-wine-900 hover:underline"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-wine-700/60" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.ng"
                    className="w-full rounded border border-wine-900/20 bg-ivory-50/50 py-2.5 pl-10 pr-3.5 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded bg-wine-900 py-3 text-xs font-semibold uppercase tracking-widest text-ivory-50 shadow-xs hover:bg-wine-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
