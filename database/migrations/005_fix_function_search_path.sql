-- ============================================================
-- Migração 005: Corrige search_path nas funções
-- Previne SQL injection via search_path em funções de trigger
-- Execute no Supabase → SQL Editor → New query → Run
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_atualiza_paciente_pos_consulta()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Realizado' AND (OLD.status IS NULL OR OLD.status != 'Realizado') THEN
    UPDATE pacientes
    SET
      total_consultas      = total_consultas + 1,
      data_ultima_consulta = NEW.data_consulta,
      novo_paciente        = FALSE
    WHERE id = NEW.paciente_id;
  END IF;
  RETURN NEW;
END;
$$;
