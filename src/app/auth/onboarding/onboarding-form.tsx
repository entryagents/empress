"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Phone, AtSign, AlertCircle } from "lucide-react";
import { completeGoogleOnboardingAction } from "../actions";

interface OnboardingFormProps {
  initialEmail: string;
  initialName: string;
}

export function OnboardingForm({ initialEmail, initialName }: OnboardingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get("redirect") || "/account";

  const [fullName, setFullName] = useState(initialName || "");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("username", username);
    formData.append("phone", phone);

    try {
      const res = await completeGoogleOnboardingAction(formData);
      if (res.success) {
        window.location.href = redirectTarget;
      } else {
        setErrorMsg(res.error || "Failed to complete onboarding.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {errorMsg && (
        <div className="flex items-start gap-2.5 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
          Signed In Email
        </label>
        <input
          type="email"
          disabled
          value={initialEmail}
          className="mt-1.5 w-full rounded border border-wine-900/10 bg-ivory-100/50 px-3.5 py-2.5 text-sm text-wine-800/80 cursor-not-allowed"
        />
      </div>

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
          Unique Username *
        </label>
        <div className="relative mt-1.5">
          <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-wine-400" />
          <input
            type="text"
            required
            pattern="^[a-zA-Z0-9_]{3,20}$"
            title="Username must be 3-20 alphanumeric characters or underscores"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="amina_b"
            className="w-full rounded border border-wine-900/20 bg-ivory-50/50 pl-9 pr-3.5 py-2.5 text-sm text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
          />
        </div>
        <p className="mt-1 text-[0.65rem] text-wine-600">
          Your unique identifier for culinary orders and dining reservations.
        </p>
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
        <p className="mt-1 text-[0.65rem] text-wine-600">
          Required for rider dispatch coordination and SMS notifications.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded bg-wine-900 py-3 text-xs font-semibold uppercase tracking-widest text-ivory-50 shadow-md hover:bg-wine-800 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? "Finalizing Account..." : "Complete & Continue"}
      </button>
    </form>
  );
}
