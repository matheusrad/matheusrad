-- ============================================================
-- Migração 004: Corrige views para usar SECURITY INVOKER
-- Garante que as views respeitem o RLS do usuário que consulta
-- Execute no Supabase → SQL Editor → New query → Run
-- ============================================================

ALTER VIEW public.vw_aguardando_confirmacao  SET (security_invoker = true);
ALTER VIEW public.vw_consultas_semana        SET (security_invoker = true);
ALTER VIEW public.vw_financeiro_mes          SET (security_invoker = true);
ALTER VIEW public.vw_prontuario_paciente     SET (security_invoker = true);
