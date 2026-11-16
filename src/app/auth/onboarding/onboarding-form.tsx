"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, AtSign, AlertCircle, Sparkles } from "lucide-react";
import { completeGoogleOnboardingAction } from "../actions";

interface OnboardingFormProps {
  initialEmail: string;
  initialName: string;
}

export function OnboardingForm({ initialEmail, initialName }: OnboardingFormProps) {
  const router = useRouter();
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
        router.push("/account");
        router.refresh();
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
          className="mt-1.5 w-full rounded border border-wine-900/10 bg-ivory-100/70 px-3.5 py-2 text-xs text-wine-600 cursor-not-allowed"
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
          Username *
        </label>
        <div className="relative mt-1.5">
          <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-wine-400" />
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            placeholder="amina_bello"
            className="w-full rounded border border-wine-900/20 bg-ivory-50/50 pl-9 pr-3.5 py-2.5 text-sm text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
          />
        </div>
        <p className="mt-1 text-[0.7rem] text-wine-600">
          Must be unique. Lowercase letters, numbers, and underscores only.
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
            placeholder="0803 123 4567 or +234 803 123 4567"
            className="w-full rounded border border-wine-900/20 bg-ivory-50/50 pl-9 pr-3.5 py-2.5 text-sm text-wine-950 placeholder:text-wine-400 focus:border-champagne-500 focus:outline-none"
          />
        </div>
        <p className="mt-1 text-[0.7rem] text-wine-600">
          Required for courier coordination during delivery.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full flex items-center justify-center gap-2 rounded bg-wine-900 py-3 text-xs font-semibold uppercase tracking-widest text-ivory-50 shadow-md hover:bg-wine-800 disabled:opacity-50 transition-colors"
      >
        <Sparkles className="size-3.5 text-champagne-400" />
        <span>{isSubmitting ? "Finalizing Profile..." : "Complete Setup & Continue"}</span>
      </button>
    </form>
  );
}
