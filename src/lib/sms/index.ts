export interface SMSPayload {
  recipientPhone: string;
  message: string;
  senderId?: string;
}

export interface SMSResponse {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  isSimulated?: boolean;
}

export interface SMSProvider {
  name: string;
  sendSMS(payload: SMSPayload): Promise<SMSResponse>;
}

/**
 * Mozosubz SMS Provider Implementation (Mozosubz.xyz)
 */
export class MozosubzSMSProvider implements SMSProvider {
  name = "Mozosubz";
  private apiKey: string;
  private senderId: string;

  constructor() {
    this.apiKey = process.env.MOZOSUBZ_API_KEY || "";
    this.senderId = process.env.MOZOSUBZ_SENDER_ID || "EMPRESS";
  }

  async sendSMS(payload: SMSPayload): Promise<SMSResponse> {
    if (!this.apiKey) {
      console.log(`[SMS:SIMULATED] Mozosubz dispatch to ${payload.recipientPhone}: ${payload.message}`);
      return {
        success: true,
        provider: this.name,
        isSimulated: true,
        messageId: `sim-mozo-${Date.now()}`,
      };
    }

    try {
      const response = await fetch("https://mozosubz.xyz/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          to: payload.recipientPhone,
          from: payload.senderId || this.senderId,
          message: payload.message,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && (data.status === "success" || data.success)) {
        return {
          success: true,
          provider: this.name,
          messageId: data.message_id || data.id,
        };
      }

      return {
        success: false,
        provider: this.name,
        error: data.message || `HTTP ${response.status} from Mozosubz`,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: this.name,
        error: err.message || "Failed to reach Mozosubz SMS gateway",
      };
    }
  }
}

/**
 * Pluggable SMS Dispatch Manager
 */
class SMSManager {
  private primaryProvider: SMSProvider;
  private fallbackProviders: SMSProvider[] = [];

  constructor() {
    this.primaryProvider = new MozosubzSMSProvider();
  }

  setPrimaryProvider(provider: SMSProvider) {
    this.primaryProvider = provider;
  }

  registerFallback(provider: SMSProvider) {
    this.fallbackProviders.push(provider);
  }

  async send(payload: SMSPayload): Promise<SMSResponse> {
    const res = await this.primaryProvider.sendSMS(payload);
    if (res.success || this.fallbackProviders.length === 0) {
      return res;
    }

    for (const fallback of this.fallbackProviders) {
      const fallbackRes = await fallback.sendSMS(payload);
      if (fallbackRes.success) {
        return fallbackRes;
      }
    }

    return res;
  }
}

export const smsManager = new SMSManager();
