"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "empress-install-dismissed";

export function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (localStorage.getItem(DISMISS_KEY)) return;
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] mx-auto flex max-w-sm items-center gap-3 rounded border border-wine-900/15 bg-white p-3 shadow-lift lg:bottom-6 lg:left-auto lg:right-6 lg:mx-0">
      <Download className="size-5 shrink-0 text-wine-900" />
      <p className="flex-1 text-xs text-wine-900">Install Empress Delicacies for faster ordering.</p>
      <button
        type="button"
        onClick={async () => {
          await deferred.prompt();
          await deferred.userChoice;
          setDeferred(null);
        }}
        className="rounded bg-wine-900 px-3 py-1.5 text-xs font-semibold text-ivory-50"
      >
        Install
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setDeferred(null);
        }}
        className="text-wine-700"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
