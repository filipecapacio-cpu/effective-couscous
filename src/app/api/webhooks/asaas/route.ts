import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Eventos do Asaas que consideramos "pagamento confirmado".
// https://docs.asaas.com/docs/webhook-eventos
const CONFIRMED_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const CANCELED_EVENTS = new Set([
  "PAYMENT_DELETED",
  "PAYMENT_OVERDUE",
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
  const externalReference: string | undefined = payment?.externalReference;
  const paymentId: string | undefined = payment?.id;

  if (!event || !paymentId) {
    return NextResponse.json({ error: "payload inesperado" }, { status: 400 });
  }

  if (!CONFIRMED_EVENTS.has(event) && !CANCELED_EVENTS.has(event)) {
    // Evento que não muda o status de acesso (ex.: PAYMENT_CREATED) — só confirma o recebimento.
    return NextResponse.json({ ok: true, ignored: event });
  }

  const supabase = createAdminClient();
  const newStatus = CONFIRMED_EVENTS.has(event) ? "active" : "canceled";

  // Localiza o profile pelo id do pagamento (setado na criação da cobrança)
  // ou, se não achar, pelo externalReference (id do usuário).
  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ subscription_status: newStatus, subscription_updated_at: new Date().toISOString() })
    .eq("asaas_payment_id", paymentId)
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
