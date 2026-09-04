-- Onmode — registro de consentimento (LGPD)
-- Rode depois da 0011_founder_users.sql.
--
-- Guarda quando o usuário aceitou os Termos de Uso / Política de Privacidade
-- no cadastro (profiles.terms_accepted_at) e quando deu consentimento
-- específico pro tratamento dos dados sensíveis de saúde da anamnese
-- (anamneses.health_data_consent_at) — a LGPD (art. 11) pede consentimento
-- destacado e específico pra dado sensível, separado do aceite geral dos
-- Termos.

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz;

alter table public.anamneses
  add column if not exists health_data_consent_at timestamptz;
