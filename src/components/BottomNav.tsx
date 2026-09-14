"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ClipboardIcon, HomeIcon, PeopleIcon, SparkleIcon, UserIcon } from "@/components/icons";

const items = [
  { href: "/dashboard", label: "Início", Icon: HomeIcon },
  { href: "/agenda", label: "Agenda", Icon: CalendarIcon },
  { href: "/plano", label: "Plano", Icon: ClipboardIcon },
  { href: "/social", label: "Social", Icon: PeopleIcon },
  { href: "/assistente", label: "IA", Icon: SparkleIcon },
  { href: "/perfil", label: "Perfil", Icon: UserIcon },
] as const;

export default function BottomNav({ dark = false }: { dark?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={`h-[78px] flex items-center justify-around flex-shrink-0 border-t ${
        dark ? "border-white/10 bg-ink-bg" : "border-line bg-paper"
      }`}
    >
      {items.map(({ href, label, Icon }) => {
        // O Social tem telas filhas (/social/novo, /social/post/...) e o
        // perfil público mora fora do prefixo — as três continuam
        // acendendo a mesma aba.
        const active =
          href === "/social"
            ? pathname.startsWith("/social") || pathname.startsWith("/atleta")
            : pathname === href;
        const activeColor = dark ? "text-on-ink" : "text-ink";
        const inactiveColor = dark ? "text-on-ink-faint" : "text-ink-faint";
        return (
          <Link
            key={href}
            href={href}
            // flex-1 + min-w-0: com 6 abas, num aparelho de 360px cada uma
            // fica com 60px. Sem isso a maior ("Agenda") empurra as vizinhas.
            className={`flex-1 min-w-0 flex flex-col items-center gap-1 text-[10px] ${
              active ? activeColor : inactiveColor
            }`}
          >
            <Icon size={20} strokeWidth={active ? 1.9 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
