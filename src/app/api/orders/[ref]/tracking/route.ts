import { NextRequest, NextResponse } from "next/server";
import { getCustomerOrderTracking } from "@/lib/delivery/service";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ ref: string }> }
) {
  const { ref } = await context.params;
  const token = req.nextUrl.searchParams.get("token") || undefined;

  if (!ref) {
    return NextResponse.json({ error: "Order reference required." }, { status: 400 });
  }

  const tracking = await getCustomerOrderTracking(ref, token);
  if (!tracking) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json(tracking);
}
