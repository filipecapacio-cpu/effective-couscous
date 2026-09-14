export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import SetupNotice from "@/components/SetupNotice";
import CreatePostForm from "@/components/social/CreatePostForm";
import { BackArrowIcon } from "@/components/icons";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/social";
import { getPublishableWorkouts } from "@/app/actions/social";

export default async function NovoPostPage(props: PageProps<"/social/novo">) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  // `?treino=<id>` vem do atalho da tela de Plano. É só uma pré-seleção na
  // lista — quem manda na posse do treino é a action, não este parâmetro.
  const { treino } = await props.searchParams;
  const preselectedId = typeof treino === "string" ? treino : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  // Sem @ escolhido não dá pra publicar — a tela de Social é onde isso é
  // resolvido.
  const viewer = await getViewer(supabase, user.id);
  if (!viewer) redirect("/social");

  const workouts = await getPublishableWorkouts();

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <header className="px-4 pt-5 pb-4 flex items-center gap-3">
        <Link href="/social" aria-label="Voltar" className="p-1 -ml-1 text-ink-soft">
          <BackArrowIcon size={22} />
        </Link>
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-[22px] leading-none">
          Publicar treino
        </h1>
      </header>

      <main className="flex-1 px-4 pb-10">
        <CreatePostForm workouts={workouts} preselectedId={preselectedId} />
      </main>
    </div>
  );
}
