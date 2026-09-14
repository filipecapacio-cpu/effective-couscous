export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SetupNotice from "@/components/SetupNotice";
import PostCard from "@/components/social/PostCard";
import { BackArrowIcon } from "@/components/icons";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getComments, getPost, getViewer } from "@/lib/social";

export default async function PostPage(props: PageProps<"/social/post/[id]">) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  // `params` é uma Promise no App Router — precisa de await antes de ler.
  const { id } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const [viewer, post] = await Promise.all([getViewer(supabase, user.id), getPost(supabase, id, user.id)]);
  if (!post) notFound();

  const comments = await getComments(supabase, post.id);

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <header className="px-4 pt-5 pb-4 flex items-center gap-3">
        <Link href="/social" aria-label="Voltar ao feed" className="p-1 -ml-1 text-ink-soft">
          <BackArrowIcon size={22} />
        </Link>
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-[22px] leading-none">
          Publicação
        </h1>
      </header>

      <main className="flex-1 px-4 pb-6">
        <PostCard post={post} viewer={viewer} expanded initialComments={comments} />
      </main>

      <BottomNav />
    </div>
  );
}
