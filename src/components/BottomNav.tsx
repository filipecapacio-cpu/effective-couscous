"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, ClipboardIcon, HomeIcon, SparkleIcon, UserIcon } from "@/components/icons";

const items = [
  { href: "/dashboard", label: "Início", Icon: HomeIcon },
  { href: "/agenda", label: "Agenda", Icon: CalendarIcon },
  { href: "/plano", label: "Plano", Icon: ClipboardIcon },
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
        const active = pathname === href;
        const activeColor = dark ? "text-on-ink" : "text-ink";
        const inactiveColor = dark ? "text-on-ink-faint" : "text-ink-faint";
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 text-[11px] ${
              active ? activeColor : inactiveColor
            }`}
          >
            <Icon size={21} strokeWidth={active ? 1.9 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
