export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatBRL } from "@/lib/plans";
import { aggregateCouponStats, couponCommission } from "@/lib/coupons";

/**
 * Painel de parceiro/influencer - não é gateado pelo plano nem pelo
 * middleware (não está em PROTECTED_PATHS, essa página faz a própria
 * checagem): exige login e profiles.is_influencer = true. Um usuário comum
 * do app que tentar acessar direto cai de volta no dashboard.
 */
export default async function ParceiroPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?proximo=/parceiro");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, is_influencer")
    .eq("id", user.id)
    .single();

  if (!profile?.is_influencer) redirect("/dashboard");

  const { data: coupons } = await supabase
    .from("coupons")
    .select("id, code, discount_percent, commission_percent, active, created_at")
    .eq("influencer_id", user.id)
    .order("created_at", { ascending: true });

  const couponIds = (coupons ?? []).map((c) => c.id);

  // Client admin de propósito: a policy de profiles só deixa cada um ler a
  // própria linha, e aqui precisamos ler a linha de quem COMPROU com o
  // cupom desse influencer. couponIds já veio filtrado por influencer_id =
  // auth.uid() acima, então isso não vaza dado de cupom de outra pessoa.
  const admin = createAdminClient();
  const { data: sales } = couponIds.length
    ? await admin
        .from("profiles")
        .select("coupon_id, first_payment_value, first_payment_confirmed_at")
        .in("coupon_id", couponIds)
        .not("first_payment_confirmed_at", "is", null)
    : { data: [] as { coupon_id: string; first_payment_value: number | null }[] };

  const statsByCoupon = aggregateCouponStats(sales ?? []);

  const totalComissao = (coupons ?? []).reduce((acc, c) => {
    const stats = statsByCoupon.get(c.id);
    if (!stats) return acc;
    return acc + couponCommission(stats.receita, c.commission_percent);
  }, 0);

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col bg-ink-bg text-on-ink relative overflow-hidden">
      <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-accent opacity-20 blur-[2px] pointer-events-none" />

      <header className="px-5 pt-5 flex items-center justify-between relative">
        <Link href="/">
          <Logo className="text-xl" />
        </Link>
        <div className="text-[13px] font-mono text-on-ink-soft uppercase tracking-[0.08em]">Parceiro</div>
      </header>

      <main className="flex-1 flex flex-col px-5 pt-6 gap-6 pb-10">
        <div>
          <div className="text-sm text-on-ink-soft">Olá,</div>
          <div className="font-display font-bold uppercase tracking-[-0.02em] text-2xl">
            {profile?.name || user.email}
          </div>
        </div>

        <div className="bg-ink-bg-2 rounded-lg border border-white/10 p-5">
          <div className="text-[11px] font-mono uppercase tracking-[0.08em] text-on-ink-soft">
            Comissão acumulada
          </div>
          <div className="font-display font-bold tracking-[-0.02em] text-[34px] text-accent mt-1">
            {formatBRL(totalComissao)}
          </div>
          <div className="text-[12.5px] text-on-ink-soft mt-1">
            Pagamento combinado por fora do app — fale com a Onmode pra acertar.
          </div>
        </div>

        {(coupons ?? []).length === 0 ? (
          <div className="text-on-ink-soft text-[15px] bg-ink-bg-2 rounded-lg border border-white/10 p-5">
            Nenhum cupom vinculado a você ainda.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {(coupons ?? []).map((c) => {
              const stats = statsByCoupon.get(c.id) ?? { vendas: 0, receita: 0 };
              const comissao = couponCommission(stats.receita, c.commission_percent);
              return (
                <div key={c.id} className="bg-ink-bg-2 rounded-lg border border-white/10 p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="font-mono font-bold text-lg tracking-[0.04em]">{c.code}</div>
                    <span
                      className={`text-[11px] font-mono uppercase tracking-[0.08em] px-2 py-0.5 rounded-full ${
                        c.active ? "bg-accent/20 text-accent" : "bg-white/10 text-on-ink-faint"
                      }`}
                    >
                      {c.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className="text-[13px] text-on-ink-soft">
                    {c.discount_percent}% de desconto na 1ª cobrança pra quem usa · você ganha{" "}
                    {c.commission_percent}% de comissão por venda
                  </div>

                  <div className="flex gap-2.5">
                    <div className="flex-1 bg-white/5 rounded-lg p-3.5">
                      <div className="font-display font-bold tracking-[-0.02em] text-2xl">{stats.vendas}</div>
                      <div className="text-[11.5px] text-on-ink-soft mt-1">vendas</div>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-lg p-3.5">
                      <div className="font-display font-bold tracking-[-0.02em] text-2xl text-accent">
                        {formatBRL(comissao)}
                      </div>
                      <div className="text-[11.5px] text-on-ink-soft mt-1">comissão</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
