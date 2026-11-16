import { NextResponse } from "next/server";
import { BachsWebhookError } from "@bachs/sdk";
import { verifyAndConstructBachsWebhook, processBachsWebhookEvent } from "@/lib/payment/service";

/**
 * Bachs Webhook Endpoint
 *
 * Rules:
 * - Reads RAW request body before JSON parsing (preserves byte exactness for HMAC-SHA256)
 * - Verifies signature using official `@bachs/sdk` `webhooks.constructEvent`
 * - Validates timestamp replay window (5 minutes)
 * - Returns HTTP 400 ONLY on invalid signature / rejection
 * - Returns HTTP 200 on successful processing or deduplicated delivery
 * - Returns HTTP 5xx on internal database failure to trigger Bachs delivery retry
 */
export async function POST(request: Request) {
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch (err: any) {
    return new NextResponse("Unable to read request payload", { status: 400 });
  }

  let event;
  try {
    event = verifyAndConstructBachsWebhook(rawBody, request.headers);
  } catch (err: any) {
    if (err instanceof BachsWebhookError || err.name === "BachsWebhookError") {
      console.warn("Bachs webhook signature verification failed:", err.message);
      return new NextResponse(`Invalid signature: ${err.message}`, { status: 400 });
    }
    // If webhook secret is missing or misconfigured in env
    console.error("Bachs webhook construction error:", err);
    return new NextResponse("Webhook verification misconfigured", { status: 500 });
  }

  try {
    const result = await processBachsWebhookEvent(event);
    return NextResponse.json({
      received: true,
      eventId: event.id,
      duplicate: result.duplicate || false,
      message: result.message,
    });
  } catch (err: any) {
    console.error("Internal processing error for Bachs webhook:", err);
    // Return 500 so Bachs retries delivery up to 5 times over ~80 minutes
    return new NextResponse("Internal server error processing webhook event", {
      status: 500,
    });
  }
}
