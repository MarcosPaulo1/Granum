-- ============================================================
-- PATCH v3 — Auto-recalcular percentual_finalizada da obra
-- Executar no SQL Editor do Supabase DEPOIS do PATCH_V2
-- ============================================================

-- Funcao que recalcula o percentual da obra baseado na media das tarefas
CREATE OR REPLACE FUNCTION public.recalc_obra_percentual()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.obra
    SET percentual_finalizada = COALESCE(
        (SELECT ROUND(AVG(t.percentual_concluido)::numeric, 2)
         FROM public.tarefa t
         WHERE t.id_obra = COALESCE(NEW.id_obra, OLD.id_obra)),
        0
    )
    WHERE id_obra = COALESCE(NEW.id_obra, OLD.id_obra);
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger: recalcular quando tarefa e inserida, atualizada ou deletada
DROP TRIGGER IF EXISTS tr_tarefa_recalc_obra ON public.tarefa;
CREATE TRIGGER tr_tarefa_recalc_obra
    AFTER INSERT OR UPDATE OF percentual_concluido, status OR DELETE
    ON public.tarefa
    FOR EACH ROW
    EXECUTE FUNCTION public.recalc_obra_percentual();
