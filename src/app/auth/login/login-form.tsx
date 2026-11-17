"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, Mail, AlertCircle, ShoppingBag } from "lucide-react";
import { signIn } from "@/lib/auth/client";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/menu";
  const isCheckoutRedirect = redirectTarget === "/order";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error || !data?.user) {
        setErrorMsg(error?.message || "Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      window.location.href = redirectTarget;
    } catch (err: any) {
      setErrorMsg(err?.message || "An unexpected error occurred.");
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

        {isCheckoutRedirect && (
          <div className="mt-4 flex items-center gap-3 rounded border border-champagne-500/30 bg-champagne-500/10 p-3.5 text-xs text-wine-900">
            <ShoppingBag className="size-4 shrink-0 text-champagne-700" />
            <span>
              Please <strong>sign in</strong> to continue to checkout and complete your order.
            </span>
          </div>
        )}

        <div className="mt-4 rounded-[2px] border border-wine-900/10 bg-white p-8 shadow-soft">
          <div className="text-center">
            <span className="font-serif text-2xl font-bold tracking-widest text-champagne-600">
              EMPRESS
            </span>
            <h1 className="mt-2 font-serif text-3xl font-light text-wine-950">
              Welcome Back
            </h1>
            <p className="mt-1 text-xs text-wine-800/80">
              {isCheckoutRedirect
                ? "Sign in to place your order with verified Nigerian delivery and payment."
                : "Sign in to manage your orders, saved addresses, and dining privileges."}
            </p>
          </div>

          {errorMsg && (
            <div className="mt-6 flex items-start gap-2.5 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mt-6">
            <GoogleSignInButton
              label="Continue with Google"
              callbackURL={`/auth/onboarding${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
            />
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-wine-900/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[0.65rem] font-semibold text-wine-500">
                  Or sign in with email
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
                  Password *
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[0.7rem] text-champagne-700 hover:text-wine-950 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-wine-400" />
                <input
                  type="password"
                  required
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
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 border-t border-wine-900/10 pt-4 text-center text-xs text-wine-800">
            <span>Don&apos;t have an account yet? </span>
            <Link
              href={`/auth/signup${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ""}`}
              className="font-semibold text-champagne-700 hover:text-wine-950 hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
