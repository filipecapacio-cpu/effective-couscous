import Link from "next/link";
import { SparkleIcon } from "@/components/icons";
import { PLAN_LABELS, type PlanTier } from "@/lib/plans";

/**
 * Substitui uma funcionalidade paga quando o usuário não tem o plano
 * necessário — leva pra /assinatura em vez de mostrar a funcionalidade.
 */
export function PlanGate({
  minTier,
  title,
  body,
}: {
  minTier: PlanTier;
  title: string;
  body: string;
}) {
  return (
    <Link
      href="/assinatura"
      className="flex items-center gap-3 p-4 rounded-lg bg-card border border-line-strong"
    >
      <SparkleIcon size={18} className="text-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold">{title}</div>
        <div className="text-[12.5px] text-ink-soft mt-0.5">{body}</div>
      </div>
      <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-ink-faint flex-shrink-0">
        {PLAN_LABELS[minTier]}
      </span>
    </Link>
  );
}
