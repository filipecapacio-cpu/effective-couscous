export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import SetupNotice from "@/components/SetupNotice";
import CreateInfluencerForm from "@/components/CreateInfluencerForm";
import ToggleCouponButton from "@/components/ToggleCouponButton";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL } from "@/lib/plans";
import { aggregateCouponStats, couponCommission } from "@/lib/coupons";

/**
 * Ferramenta interna só pra founders (você e o Arthur) criarem parceiros/
 * influencers e cupons. Não tem link em nenhum menu do app de propósito -
 * quem não é founder que tentar acessar cai pro dashboard.
 */
export default async function AdminParceirosPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?proximo=/admin/parceiros");

  const { data: profile } = await supabase.from("profiles").select("is_founder").eq("id", user.id).single();
  if (!profile?.is_founder) redirect("/dashboard");

  // Usa o client admin pra listar todos os cupons (não só os do usuário
  // logado - a policy de coupons só libera leitura do próprio influencer).
  const admin = createAdminClient();
  const { data: coupons } = await admin
    .from("coupons")
    .select("id, code, discount_percent, commission_percent, active, created_at, influencer_id")
    .order("created_at", { ascending: false });

  const influencerIds = [...new Set((coupons ?? []).map((c) => c.influencer_id))];
  const { data: influencers } = influencerIds.length
    ? await admin.from("profiles").select("id, name").in("id", influencerIds)
    : { data: [] as { id: string; name: string }[] };
  const nameById = new Map((influencers ?? []).map((i) => [i.id, i.name]));

  const couponIds = (coupons ?? []).map((c) => c.id);
  const { data: sales } = couponIds.length
    ? await admin
        .from("profiles")
        .select("coupon_id, first_payment_value")
        .in("coupon_id", couponIds)
        .not("first_payment_confirmed_at", "is", null)
    : { data: [] as { coupon_id: string; first_payment_value: number | null }[] };

  const statsByCoupon = aggregateCouponStats(sales ?? []);

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-10 min-h-svh">
      <Link href="/">
        <Logo className="text-2xl" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl">Parceiros</h1>
        <p className="text-ink-soft text-[15px]">
          Cria a conta e o cupom de um influencer. Ele vê as vendas e a comissão dele em{" "}
          <span className="font-mono">/parceiro</span>, logado com o e-mail que você cadastrar aqui.
        </p>
      </div>

      <CreateInfluencerForm />

      <div className="flex flex-col gap-3">
        <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-xl">Cupons ativos</h2>
        {(coupons ?? []).length === 0 ? (
          <p className="text-ink-soft text-sm">Nenhum cupom criado ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(coupons ?? []).map((c) => {
              const stats = statsByCoupon.get(c.id) ?? { vendas: 0, receita: 0 };
              const comissao = couponCommission(stats.receita, c.commission_percent);
              return (
                <div key={c.id} className="border border-line rounded-lg p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono font-bold">{c.code}</div>
                    <div className="text-sm text-ink-soft">
                      {nameById.get(c.influencer_id) ?? "—"} · {c.discount_percent}% desconto ·{" "}
                      {c.commission_percent}% comissão
                    </div>
                    <div className="text-sm text-ink-soft mt-0.5">
                      {stats.vendas} venda{stats.vendas === 1 ? "" : "s"} · {formatBRL(stats.receita)} em receita ·{" "}
                      <strong className="text-ink">{formatBRL(comissao)} de comissão</strong>
                    </div>
                  </div>
                  <ToggleCouponButton couponId={c.id} active={c.active} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
