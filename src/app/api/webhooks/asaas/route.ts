import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// https://docs.asaas.com/docs/webhook-eventos
const ACTIVE_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const PAST_DUE_EVENTS = new Set(["PAYMENT_OVERDUE"]);
const CANCELED_EVENTS = new Set([
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
]);

export async function POST(request: NextRequest) {
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const receivedToken = request.headers.get("asaas-access-token");

  if (!expectedToken || receivedToken !== expectedToken) {
    return NextResponse.json({ error: "token inválido" }, { status: 401 });
  }

  const body = await request.json();
  const event: string | undefined = body?.event;
  const payment = body?.payment;
  const subscriptionId: string | undefined = payment?.subscription;
  const externalReference: string | undefined = payment?.externalReference;

  if (!event || !subscriptionId) {
    return NextResponse.json({ ok: true, ignored: "sem subscription" });
  }

  let newStatus: "active" | "past_due" | "canceled" | null = null;
  if (ACTIVE_EVENTS.has(event)) newStatus = "active";
  else if (PAST_DUE_EVENTS.has(event)) newStatus = "past_due";
  else if (CANCELED_EVENTS.has(event)) newStatus = "canceled";

  if (!newStatus) {
    return NextResponse.json({ ok: true, ignored: event });
  }

  const supabase = createAdminClient();

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ subscription_status: newStatus, subscription_updated_at: new Date().toISOString() })
    .eq("asaas_subscription_id", subscriptionId)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if ((!updated || updated.length === 0) && externalReference) {
    const { error: fallbackError } = await supabase
      .from("profiles")
      .update({ subscription_status: newStatus, subscription_updated_at: new Date().toISOString() })
      .eq("id", externalReference);

    if (fallbackError) {
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
