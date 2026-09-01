import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "@/lib/supabase/config";

/**
 * Client com a service role key — ignora RLS. Usar SOMENTE em código que
 * roda no servidor e nunca é exposto ao navegador (ex.: o webhook do
 * Asaas, que precisa atualizar o profile de um usuário sem estar logado
 * como esse usuário).
 *
 * Exige a variável de ambiente SUPABASE_SERVICE_ROLE_KEY (pegue em
 * Supabase -> Project Settings -> API -> service_role). NUNCA prefixe
 * essa variável com NEXT_PUBLIC_.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase admin não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
