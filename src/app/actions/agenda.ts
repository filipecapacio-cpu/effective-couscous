"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { weekdayOfISO } from "@/lib/date";

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

/**
 * Garante que as tarefas recorrentes que caem no dia da semana de `date`
 * já existam como itens de verdade na agenda daquele dia. Idempotente -
 * chamar de novo pro mesmo dia não duplica nada (índice único cuida disso).
 */
export async function ensureRecurringAgendaForDate(userId: string, date: string) {
  const supabase = await createClient();
  const weekday = weekdayOfISO(date);

  const { data: rules, error: rulesError } = await supabase
    .from("agenda_recurring_items")
    .select("id, title, time, notes, weekdays")
    .eq("user_id", userId)
    .eq("active", true)
    .contains("weekdays", [weekday]);

  if (rulesError) {
    console.error("[ensureRecurringAgendaForDate] failed to read rules:", rulesError);
    return;
  }
  if (!rules || rules.length === 0) return;

  const rows = rules.map((rule) => ({
    user_id: userId,
    date,
    title: rule.title,
    time: rule.time,
    notes: rule.notes,
    recurring_item_id: rule.id,
    position: 0,
  }));

  const { error } = await supabase
    .from("agenda_items")
    .upsert(rows, { onConflict: "recurring_item_id,date", ignoreDuplicates: true });
  if (error) {
    console.error("[ensureRecurringAgendaForDate] failed to materialize:", error);
  }
}

export async function addRecurringAgendaItem(
  userId: string,
  date: string,
  title: string,
  time: string | null,
  notes: string | null,
  weekdays: number[]
) {
  if (!title.trim() || weekdays.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.from("agenda_recurring_items").insert({
    user_id: userId,
    title: title.trim(),
    time,
    notes,
    weekdays,
  });
  if (error) {
    console.error("[addRecurringAgendaItem] failed:", error);
    return;
  }
  // Materializa já a ocorrência de hoje (ou do dia que o usuário está vendo) se ele repetir nesse dia.
  await ensureRecurringAgendaForDate(userId, date);
  revalidatePath("/agenda");
}

/** Para de repetir - a regra some, mas as ocorrências já criadas continuam na agenda como itens avulsos. */
export async function stopRecurringAgendaItem(recurringItemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("agenda_recurring_items").delete().eq("id", recurringItemId);
  if (error) console.error("[stopRecurringAgendaItem] failed:", error);
  revalidatePath("/agenda");
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

export async function addChecklistItem(agendaItemId: string, text: string) {
  if (!text.trim()) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("agenda_checklist_items")
    .select("position")
    .eq("agenda_item_id", agendaItemId)
    .order("position", { ascending: false })
    .limit(1);
  const position = (data?.[0]?.position ?? -1) + 1;

  const { error } = await supabase
    .from("agenda_checklist_items")
    .insert({ agenda_item_id: agendaItemId, text: text.trim(), position });
  if (error) console.error("[addChecklistItem] failed:", error);
  revalidatePath("/agenda");
}

export async function toggleChecklistItem(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("agenda_checklist_items").update({ done }).eq("id", id);
  if (error) console.error("[toggleChecklistItem] failed:", error);
  revalidatePath("/agenda");
}

export async function deleteChecklistItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("agenda_checklist_items").delete().eq("id", id);
  if (error) console.error("[deleteChecklistItem] failed:", error);
  revalidatePath("/agenda");
}
