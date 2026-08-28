"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function nextPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  date: string
) {
  const { data } = await supabase
    .from("agenda_items")
    .select("position")
    .eq("user_id", userId)
    .eq("date", date)
    .order("position", { ascending: false })
    .limit(1);
  return (data?.[0]?.position ?? -1) + 1;
}

export async function addAgendaItem(
  userId: string,
  date: string,
  title: string,
  time: string | null,
  notes: string | null
) {
  if (!title.trim()) return;
  const supabase = await createClient();
  const position = await nextPosition(supabase, userId, date);
  const { error } = await supabase.from("agenda_items").insert({
    user_id: userId,
    date,
    title: title.trim(),
    time,
    notes,
    position,
  });
  if (error) console.error("[addAgendaItem] failed:", error);
  revalidatePath("/agenda");
}

export async function updateAgendaItem(
  id: string,
  title: string,
  time: string | null,
  notes: string | null
) {
  if (!title.trim()) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("agenda_items")
    .update({ title: title.trim(), time, notes })
    .eq("id", id);
  if (error) console.error("[updateAgendaItem] failed:", error);
  revalidatePath("/agenda");
}

export async function toggleAgendaItem(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("agenda_items").update({ done }).eq("id", id);
  if (error) console.error("[toggleAgendaItem] failed:", error);
  revalidatePath("/agenda");
}

export async function deleteAgendaItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("agenda_items").delete().eq("id", id);
  if (error) console.error("[deleteAgendaItem] failed:", error);
  revalidatePath("/agenda");
}
