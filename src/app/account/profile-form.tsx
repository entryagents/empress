"use client";

import { useState } from "react";
import { User, Phone, Mail, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import type { CustomerProfile } from "@/types/customer";
import { updateProfileAction } from "../auth/actions";

interface Props {
  profile: CustomerProfile | null;
  email: string;
}

export function ProfileForm({ profile, email }: Props) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSaving(true);

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("phone", phone);

    try {
      const res = await updateProfileAction(formData);
      if (res.success) {
        setSuccessMsg(res.message || "Profile updated.");
      } else {
        setErrorMsg(res.error || "Failed to update profile.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-[2px] border border-wine-900/10 bg-white p-6 shadow-soft sm:p-8">
      <div className="border-b border-wine-900/10 pb-4">
        <h2 className="font-serif text-xl font-medium text-wine-950">
          Personal Information
        </h2>
        <p className="mt-1 text-xs text-wine-800/80">
          Update your contact details for delivery communication and order receipts.
        </p>
      </div>

      {errorMsg && (
        <div className="mt-4 flex items-center gap-2 rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mt-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 max-w-xl">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
            Email Address (Primary Account Key)
          </label>
          <div className="relative mt-1.5">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-wine-400" />
            <input
              type="email"
              disabled
              value={email}
              className="w-full rounded border border-wine-900/10 bg-ivory-100/50 pl-9 pr-3.5 py-2 text-sm text-wine-600 cursor-not-allowed"
            />
          </div>
          <p className="mt-1 text-[0.65rem] text-wine-600">
            Email address is protected. Contact Empress customer concierge to request email modifications.
          </p>
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
              className="w-full rounded border border-wine-900/20 bg-ivory-50/50 pl-9 pr-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-wine-900">
            Primary Nigerian Phone Number
          </label>
          <div className="relative mt-1.5">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-wine-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 803 123 4567"
              className="w-full rounded border border-wine-900/20 bg-ivory-50/50 pl-9 pr-3.5 py-2 text-sm text-wine-950 focus:border-champagne-500 focus:outline-none"
            />
          </div>
          <p className="mt-1 text-[0.65rem] text-wine-600">
            Pre-fills during checkout to facilitate driver communication.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded bg-wine-900 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory-50 shadow-xs hover:bg-wine-800 disabled:opacity-50 transition-colors"
          >
            <Save className="size-3.5 text-champagne-400" />
            {isSaving ? "Saving Changes..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
