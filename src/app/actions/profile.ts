"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdateProfileResult = { error: string } | { ok: true } | null;

export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const name = String(formData.get("name") ?? "").trim();
  const weeklyGoal = Number(formData.get("weeklyGoal"));

  if (!name) {
    return { error: "O nome não pode ficar em branco." };
  }
  if (!Number.isInteger(weeklyGoal) || weeklyGoal < 1 || weeklyGoal > 7) {
    return { error: "A meta semanal precisa ser um número entre 1 e 7." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name, weekly_goal: weeklyGoal })
    .eq("id", user.id);

  if (error) {
    console.error("[updateProfile] failed:", error);
    return { error: "Não deu pra salvar agora. Tenta de novo em instantes." };
  }

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { ok: true };
}
