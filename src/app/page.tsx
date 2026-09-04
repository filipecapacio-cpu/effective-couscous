import Link from "next/link";
import { Logo } from "@/components/Logo";
import ContactIcons from "@/components/ContactIcons";
import {
  DumbbellIcon,
  LeafIcon,
  PeopleIcon,
  PulseIcon,
  QuoteIcon,
} from "@/components/icons";

const pillars = [
  {
    Icon: DumbbellIcon,
    title: "Treino",
    body: "Planos que se adaptam ao seu dia, não o contrário. Sessões objetivas, prontas pra encaixar entre uma aula e um call.",
  },
  {
    Icon: LeafIcon,
    title: "Nutrição",
    body: "Dieta pensada pra vida real: marmita, RU, delivery. Metas claras, sem contar caloria a vida inteira.",
  },
  {
    Icon: PulseIcon,
    title: "Performance & recuperação",
    body: "Sono, energia e constância acompanhados de verdade — pra entender o que funciona no seu corpo, não no genérico.",
  },
  {
    Icon: PeopleIcon,
    title: "Comunidade",
    body: "Gente que também concilia estudo, trabalho e treino. Motivação sem postura de influencer de academia.",
  },
];

const testimonials = [
  {
    quote:
      "Larguei a ideia de que precisava escolher entre estudar pra prova e treinar. O Onmode organiza os dois.",
    role: "Estudante de Medicina",
  },
  {
    quote:
      "Uso os 12 minutos entre reuniões pra registrar o treino e a refeição. É o único app que não me atrasa.",
    role: "Product Designer",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* NAV */}
      <header className="h-20 md:h-24 px-6 md:px-16 flex items-center justify-between border-b border-line">
        <Logo className="text-2xl" />
        <nav className="hidden md:flex items-center gap-10 text-[15px] text-ink-soft">
          <a href="#metodo">Método</a>
          <a href="#pilares">Treino</a>
          <a href="#pilares">Nutrição</a>
          <a href="#prova">Comunidade</a>
        </nav>
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/entrar" className="text-[15px] font-semibold hidden sm:block">
            Entrar
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center h-11 px-5 rounded bg-ink text-paper text-sm font-semibold hover:bg-accent transition-colors"
          >
            Começar agora
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="px-6 md:px-16 pt-16 md:pt-24 pb-16 md:pb-20 grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-6 flex flex-col gap-7">
          <div className="text-[13px] font-mono tracking-[0.14em] uppercase text-ink-soft font-semibold">
            Rotina real, performance real
          </div>
          <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-5xl md:text-[68px] leading-[1.03]">
            Alta performance que cabe na sua rotina.
          </h1>
          <p className="text-lg leading-relaxed text-ink-soft max-w-[480px]">
            Treino, nutrição e recuperação em um só lugar — pensado pra quem
            também tem aula, reunião e prazo. Sem crachá de academia, sem
            enrolação.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center h-13 px-7 rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors"
            >
              Comece seu ritmo
            </Link>
            <a
              href="#pilares"
              className="inline-flex items-center justify-center h-13 px-7 rounded border border-line font-semibold text-[15px] hover:border-ink transition-colors"
            >
              Ver como funciona
            </a>
          </div>
        </div>

        <div className="md:col-span-5 md:col-start-8">
          <div className="bg-ink-bg rounded-lg p-8 md:p-10 h-[460px] md:h-[520px] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-accent opacity-20" />
            <div className="flex items-center justify-between relative">
              <span className="text-[13px] font-mono text-on-ink-soft uppercase tracking-[0.14em]">
                Hoje · 24 mai
              </span>
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-ink text-[13px] font-display font-bold">
                7
              </div>
            </div>
            <div className="relative">
              <div className="text-on-ink-soft text-[13px] mb-1.5">Recuperação</div>
              <div className="font-display font-bold tracking-[-0.02em] text-on-ink text-5xl md:text-[56px] leading-none">
                82%
              </div>
              <svg width="100%" height="64" viewBox="0 0 300 64" className="mt-4" preserveAspectRatio="none">
                <polyline
                  points="0,40 30,40 45,14 60,52 75,26 90,40 130,40 145,10 160,50 175,30 190,40 230,40 245,16 260,48 275,28 300,40"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex gap-2.5 relative">
              <div className="flex-1 bg-white/6 rounded-lg px-4 py-3.5">
                <div className="text-on-ink-soft text-xs">Treino</div>
                <div className="text-on-ink text-[15px] font-semibold mt-1">Upper · 45min</div>
              </div>
              <div className="flex-1 bg-white/6 rounded-lg px-4 py-3.5">
                <div className="text-on-ink-soft text-xs">Refeições</div>
                <div className="text-on-ink text-[15px] font-semibold mt-1">2 de 4</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section id="pilares" className="px-6 md:px-16 pt-8 pb-16 md:pb-24 border-t border-line">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10">
          <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl md:text-[38px] max-w-[520px]">
            Um método, quatro frentes que se sustentam.
          </h2>
          <p className="text-ink-soft text-[15px] max-w-[320px]">
            Cada parte da sua semana falando com a outra — treino, prato, sono
            e comunidade.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map(({ Icon, title, body }) => (
            <div key={title} className="bg-card rounded-lg p-6 md:p-7 flex flex-col gap-4 min-h-[220px]">
              <Icon size={26} className="text-ink" />
              <div>
                <div className="font-semibold text-[17px] mb-2">{title}</div>
                <div className="text-ink-soft text-sm leading-relaxed">{body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="prova" className="bg-accent-soft px-6 md:px-16 py-16 md:py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
          {testimonials.map(({ quote, role }) => (
            <div key={role} className="flex flex-col gap-5">
              <QuoteIcon size={34} className="text-ink" />
              <p className="italic text-2xl md:text-[26px] leading-snug">{quote}</p>
              <div className="text-sm text-ink-soft font-semibold">{role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 md:px-16 py-20 md:py-24 text-center flex flex-col items-center gap-7">
        <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-4xl md:text-[44px] max-w-xl">Seu ritmo começa hoje.</h2>
        <Link
          href="/onboarding"
          className="h-13 px-8 inline-flex items-center justify-center rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors"
        >
          Criar minha conta
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink-bg text-on-ink px-6 md:px-16 pt-14 pb-10 mt-auto">
        <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 pb-12 border-b border-white/10">
          <div className="flex flex-col gap-3.5 col-span-2 md:col-span-1">
            <Logo className="text-2xl" />
            <p className="text-on-ink-soft text-sm max-w-[280px] leading-relaxed">
              Performance discreta pra quem também vive de agenda cheia.
            </p>
            <ContactIcons />
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-xs font-mono text-on-ink-soft uppercase tracking-[0.1em] mb-1.5">Produto</div>
            <a href="#pilares" className="text-on-ink text-sm">Treino</a>
            <a href="#pilares" className="text-on-ink text-sm">Nutrição</a>
            <a href="#pilares" className="text-on-ink text-sm">Performance</a>
            <a href="#prova" className="text-on-ink text-sm">Comunidade</a>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-xs font-mono text-on-ink-soft uppercase tracking-[0.1em] mb-1.5">Empresa</div>
            <Link href="/sobre" className="text-on-ink text-sm">Sobre</Link>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-xs font-mono text-on-ink-soft uppercase tracking-[0.1em] mb-1.5">Legal</div>
            <Link href="/privacidade" className="text-on-ink text-sm">Privacidade</Link>
            <Link href="/termos" className="text-on-ink text-sm">Termos</Link>
          </div>
        </div>
        <div className="pt-6 text-on-ink-soft text-xs">© Onmode</div>
      </footer>
    </div>
  );
}
