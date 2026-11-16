import { Bachs } from "@bachs/sdk";

/**
 * Bachs Configuration & Server-Side Client Factory
 *
 * Rules:
 * - API Key starts with `sk_sandbox_` for Sandbox, or `sk_live_` for Production.
 * - Key determines environment automatically.
 * - Secret credentials never leave the server.
 */

const bachsApiKey = process.env.BACHS_API_KEY || "";
const bachsWebhookSecret = process.env.BACHS_WEBHOOK_SECRET || "";
const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://empress-rosy.vercel.app";

export function isBachsConfigured(): boolean {
  return Boolean(bachsApiKey && bachsApiKey.trim().length > 0);
}

export function isBachsSandbox(): boolean {
  return bachsApiKey.startsWith("sk_sandbox_");
}

let bachsInstance: Bachs | null = null;

export function getBachsClient(): Bachs {
  if (!isBachsConfigured()) {
    throw new Error(
      "Bachs API Key is not configured. Please set BACHS_API_KEY in your environment."
    );
  }

  if (!bachsInstance) {
    bachsInstance = new Bachs({
      apiKey: bachsApiKey.trim(),
    });
  }

  return bachsInstance;
}

export function getBachsWebhookSecret(): string {
  if (!bachsWebhookSecret) {
    throw new Error(
      "Bachs Webhook Secret is not configured. Please set BACHS_WEBHOOK_SECRET in your environment."
    );
  }
  return bachsWebhookSecret.trim();
}

export function getAppBaseUrl(): string {
  // Never pass localhost to Bachs success_url/cancel_url as Bachs API rejects private/localhost addresses
  if (appBaseUrl.includes("localhost") || appBaseUrl.includes("127.0.0.1")) {
    return "https://empress-rosy.vercel.app";
  }
  return appBaseUrl.replace(/\/$/, "");
}
