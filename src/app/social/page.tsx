export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SetupNotice from "@/components/SetupNotice";
import FeedList from "@/components/social/FeedList";
import HandleSetupForm from "@/components/social/HandleSetupForm";
import { PlusIcon } from "@/components/icons";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getFeedPage, getViewer, suggestHandle } from "@/lib/social";

export default async function SocialPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const viewer = await getViewer(supabase, user.id);

  // Sem identidade pública ainda: o feed inteiro dá lugar à escolha do @.
  // Mostrar os posts dos outros antes disso seria só frustração — a pessoa
  // não conseguiria curtir nem comentar nenhum deles.
  if (!viewer) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();

    const name = profile?.name?.trim() || user.email?.split("@")[0] || "Atleta";

    return (
      <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
        <header className="px-5 pt-6 pb-4">
          <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-[30px] leading-none">
            Social
          </h1>
        </header>
        <main className="flex-1 px-4">
          <HandleSetupForm
            suggestedHandle={suggestHandle(profile?.name || user.email || "")}
            suggestedName={name}
          />
        </main>
        <BottomNav />
      </div>
    );
  }

  const page = await getFeedPage(supabase, user.id, null);

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-[30px] leading-none">
          Social
        </h1>
        <Link
          href="/social/novo"
          aria-label="Publicar um treino"
          className="w-10 h-10 rounded-full bg-accent text-accent-ink flex items-center justify-center active:bg-accent-press"
        >
          <PlusIcon size={20} strokeWidth={2.2} />
        </Link>
      </header>

      <main className="flex-1 px-4 pb-6">
        <FeedList
          initialPosts={page.posts}
          initialCursor={page.nextCursor}
          viewer={viewer}
          source={{ kind: "feed" }}
          emptyState={
            <div className="bg-card rounded-lg p-6 flex flex-col gap-3">
              <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-[24px] leading-[1.15]">
                O feed começa com você
              </h2>
              <p className="text-[13px] text-ink-soft leading-relaxed">
                Ninguém publicou nada ainda. Toda publicação parte de um treino que você já registrou
                — escolhe um do seu histórico, anexa uma foto e manda.
              </p>
              <Link
                href="/social/novo"
                className="mt-1 bg-accent text-accent-ink rounded-lg py-3.5 text-center font-display font-bold uppercase tracking-[0.01em] text-sm active:bg-accent-press"
              >
                Publicar um treino
              </Link>
            </div>
          }
        />
      </main>

      <BottomNav />
    </div>
  );
}
