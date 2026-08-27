import BottomNav from "@/components/BottomNav";
import { BellIcon, CheckIcon, FlameIcon, PlayIcon } from "@/components/icons";

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <header className="px-6 pt-6 pb-1.5 flex items-center justify-between">
        <div>
          <div className="text-[13px] text-ink-soft">Bom dia, Marina</div>
          <div className="font-serif italic text-2xl mt-0.5">Sexta, 24 de maio</div>
        </div>
        <div className="w-11 h-11 rounded-full bg-card flex items-center justify-center flex-shrink-0">
          <BellIcon size={20} />
        </div>
      </header>

      <main className="flex-1 px-6 pt-4.5 flex flex-col gap-4">
        {/* streak + recovery */}
        <div className="flex gap-3">
          <div className="flex-1 bg-ink-bg rounded-[20px] p-4.5 flex flex-col justify-between h-[132px]">
            <div className="flex items-center justify-between">
              <span className="text-on-ink-soft text-xs">Sequência</span>
              <FlameIcon size={16} className="text-accent" />
            </div>
            <div className="font-serif italic text-on-ink text-4xl">
              7 <span className="font-sans not-italic text-[15px] text-on-ink-soft">dias</span>
            </div>
          </div>
          <div className="flex-1 bg-card rounded-[20px] p-4.5 flex flex-col justify-between h-[132px]">
            <span className="text-ink-soft text-xs">Recuperação</span>
            <div className="flex items-end gap-2">
              <div className="font-serif italic text-4xl">82%</div>
              <div className="text-xs text-accent font-semibold mb-1.5">bom</div>
            </div>
          </div>
        </div>

        {/* today's training */}
        <div className="bg-ink rounded-[22px] p-5 text-paper flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-ink-soft uppercase tracking-[0.08em]">Treino de hoje</span>
            <span className="text-xs text-on-ink-soft">45 min</span>
          </div>
          <div className="font-serif italic text-2xl">Upper Body · Força</div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div className="w-2 h-2 rounded-full bg-white/25" />
              <div className="w-2 h-2 rounded-full bg-white/25" />
            </div>
            <div className="w-9.5 h-9.5 rounded-full bg-accent flex items-center justify-center">
              <PlayIcon size={15} className="text-accent-ink" />
            </div>
          </div>
        </div>

        {/* meals */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold">Refeições</span>
            <span className="text-[13px] text-ink-soft">2 de 4</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: "Café da manhã", kcal: "420 kcal", done: true },
              { label: "Almoço", kcal: "680 kcal", done: true },
            ].map((meal) => (
              <div key={meal.label} className="flex items-center gap-3 bg-card rounded-2xl px-3.5 py-3">
                <div className="w-5.5 h-5.5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <CheckIcon size={12} className="text-accent-ink" />
                </div>
                <span className="text-sm flex-1">{meal.label}</span>
                <span className="text-xs text-ink-faint">{meal.kcal}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 rounded-2xl px-3.5 py-3 border-[1.5px] border-dashed border-line">
              <div className="w-5.5 h-5.5 rounded-full border-[1.5px] border-line flex-shrink-0" />
              <span className="text-sm flex-1 text-ink-soft">Lanche da tarde</span>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
