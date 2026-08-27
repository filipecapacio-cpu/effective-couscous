import BottomNav from "@/components/BottomNav";
import { ShareIcon } from "@/components/icons";

export default function PerfilPage() {
  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col bg-ink-bg text-on-ink relative overflow-hidden">
      <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-accent opacity-20 blur-[2px] pointer-events-none" />

      <header className="px-5 pt-5 flex items-center justify-center relative">
        <div className="text-[13px] text-on-ink-soft uppercase tracking-[0.08em]">
          Resumo da semana
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <div className="mx-5 mt-5 bg-ink-bg-2 rounded-[28px] border border-white/10 p-6 relative flex-shrink-0">
          <div className="flex items-center gap-3 mb-5.5">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-[15px] font-bold text-accent-ink">
              M
            </div>
            <div>
              <div className="text-sm font-semibold">Marina Alves</div>
              <div className="text-xs text-on-ink-soft">18 – 24 de maio</div>
            </div>
          </div>

          <div className="font-serif italic text-[34px] leading-[1.15] mb-5.5">
            Seis dias de ritmo, uma semana inteira de prova.
          </div>

          <div className="flex gap-2.5 mb-5.5">
            {[
              { value: "6/6", label: "treinos feitos" },
              { value: "91%", label: "consistência" },
              { value: "3", label: "recordes pessoais" },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 bg-white/5 rounded-2xl p-3.5">
                <div className="font-serif italic text-[28px] text-accent">{stat.value}</div>
                <div className="text-[11.5px] text-on-ink-soft mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={7} />
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke="var(--accent)"
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray="188.5"
                strokeDashoffset="18.8"
                transform="rotate(-90 36 36)"
              />
            </svg>
            <div>
              <div className="text-xs text-on-ink-soft">Meta semanal</div>
              <div className="text-lg font-semibold mt-0.5">90% concluída</div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4.5 border-t border-white/10">
            <div className="font-serif italic text-[19px]">Pulso</div>
            <div className="text-[11px] text-on-ink-faint">pulso.app</div>
          </div>
        </div>

        <div className="flex-1" />

        <div className="px-5 pb-7 pt-4.5">
          <button className="w-full h-13 rounded-full bg-accent text-accent-ink flex items-center justify-center gap-2.5 font-semibold text-[15px]">
            <ShareIcon size={17} />
            Compartilhar resumo
          </button>
        </div>
      </main>

      <BottomNav dark />
    </div>
  );
}
