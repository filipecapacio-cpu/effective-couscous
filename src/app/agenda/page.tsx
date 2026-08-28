export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SetupNotice from "@/components/SetupNotice";
import AgendaClient from "@/components/AgendaClient";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_LABEL = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { date: rawDate } = await searchParams;
  const date = rawDate && DATE_RE.test(rawDate) ? rawDate : todayISO();
  const isToday = date === todayISO();

  const { data: items } = await supabase
    .from("agenda_items")
    .select("id, title, time, notes, done")
    .eq("user_id", user.id)
    .eq("date", date)
    .order("time", { ascending: true, nullsFirst: false })
    .order("position", { ascending: true });

  const dateLabel = DATE_LABEL.format(new Date(`${date}T12:00:00Z`));

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <header className="px-6 pt-6 pb-1">
        <div className="text-[13px] text-ink-soft">Agenda</div>
        <div className="flex items-center justify-between mt-1">
          <Link
            href={`/agenda?date=${shiftDate(date, -1)}`}
            aria-label="Dia anterior"
            className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0"
          >
            <ChevronLeftIcon size={17} className="text-ink-soft" />
          </Link>
          <h1 className="font-serif italic text-2xl capitalize text-center px-2 truncate">
            {isToday ? "Hoje" : dateLabel}
          </h1>
          <Link
            href={`/agenda?date=${shiftDate(date, 1)}`}
            aria-label="Próximo dia"
            className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0"
          >
            <ChevronRightIcon size={17} className="text-ink-soft" />
          </Link>
        </div>
        {!isToday && (
          <div className="text-center mt-1">
            <Link href="/agenda" className="text-[13px] text-accent font-semibold">
              Voltar pra hoje
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1 px-6 py-5">
        <AgendaClient userId={user.id} date={date} items={items ?? []} />
      </main>

      <BottomNav />
    </div>
  );
}
