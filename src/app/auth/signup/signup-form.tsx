"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, Mail, User, Phone, AlertCircle, CheckCircle2 } from "lucide-react";
import { customerSignUpAction } from "../actions";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/menu";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("password", password);

    try {
      const res = await customerSignUpAction(formData);
      if (res.success) {
        if (res.hasSession) {
          window.location.href = redirectTarget;
        } else {
          setSuccessMsg(res.message || "Account created! Please check your email for confirmation.");
        }
      } else {
        setErrorMsg(res.error || "Unable to register account.");
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
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-wine-700 hover:text-wine-950 transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Return Home
        </Link>

        <div className="mt-4 rounded-[2px] border border-wine-900/10 bg-white p-8 shadow-soft">
          <div className="text-center">
            <span className="font-serif text-2xl font-bold tracking-widest text-champagne-600">
              EMPRESS
            </span>
            <h1 className="mt-2 font-serif text-3xl font-light text-wine-950">
              Create an Account
            </h1>
            <p className="mt-1 text-xs text-wine-800/80">
              Enjoy express checkout, saved delivery addresses, and priority orders.
            </p>
          </div>

          {errorMsg && (
            <div className="mt-6 flex items-start gap-2.5 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-6 flex items-start gap-2.5 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="mt-6">
            <GoogleSignInButton
              label="Sign up with Google"
              callbackURL={`/auth/onboarding${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
            />
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-wine-900/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[0.65rem] font-semibold text-wine-500">
                  Or register with email
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Full Name *
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-wine-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Amina Bello"
                  className="w-full rounded border border-wine-900/20 bg-ivory-50/50 pl-9 pr-3.5 py-2.5 text-sm text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Email Address *
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-wine-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="amina@example.ng"
                  className="w-full rounded border border-wine-900/20 bg-ivory-50/50 pl-9 pr-3.5 py-2.5 text-sm text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Nigerian Phone Number *
              </label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-wine-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0803 123 4567"
                  className="w-full rounded border border-wine-900/20 bg-ivory-50/50 pl-9 pr-3.5 py-2.5 text-sm text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                Password * (min 6 characters)
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-wine-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded border border-wine-900/20 bg-ivory-50/50 pl-9 pr-3.5 py-2.5 text-sm text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded bg-wine-900 py-3 text-xs font-semibold uppercase tracking-widest text-ivory-50 shadow-md hover:bg-wine-800 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 border-t border-wine-900/10 pt-4 text-center text-xs text-wine-800">
            <span>Already have an account? </span>
            <Link
              href={`/auth/login${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
              className="font-semibold text-champagne-700 hover:text-wine-950 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
