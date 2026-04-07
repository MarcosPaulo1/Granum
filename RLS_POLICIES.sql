-- ============================================================
-- ROW LEVEL SECURITY POLICIES — SUPABASE
-- Executar DEPOIS do SCHEMA.sql
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responsavel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centro_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_conta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupo_movimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabalhador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcela ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrato_trabalho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escala ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presenca ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABELAS DE REFERÊNCIA (leitura para todos autenticados)
-- ============================================================

CREATE POLICY "Todos leem perfis" ON public.perfil FOR SELECT TO authenticated USING (true);
CREATE POLICY "Diretor gerencia perfis" ON public.perfil FOR ALL TO authenticated
    USING (public.get_user_role() = 'diretor')
    WITH CHECK (public.get_user_role() = 'diretor');

CREATE POLICY "Todos leem etapas" ON public.etapa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Diretor gerencia etapas" ON public.etapa FOR ALL TO authenticated
    USING (public.get_user_role() = 'diretor')
    WITH CHECK (public.get_user_role() = 'diretor');

CREATE POLICY "Todos leem grupos" ON public.grupo_movimento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Diretor gerencia grupos" ON public.grupo_movimento FOR ALL TO authenticated
    USING (public.get_user_role() = 'diretor')
    WITH CHECK (public.get_user_role() = 'diretor');

CREATE POLICY "Todos leem centros" ON public.centro_custo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Diretor gerencia centros" ON public.centro_custo FOR ALL TO authenticated
    USING (public.get_user_role() = 'diretor')
    WITH CHECK (public.get_user_role() = 'diretor');

CREATE POLICY "Todos leem plano contas" ON public.plano_conta FOR SELECT TO authenticated USING (true);
CREATE POLICY "Dir+Fin gerenciam plano" ON public.plano_conta FOR ALL TO authenticated
    USING (public.get_user_role() IN ('diretor', 'financeiro'))
    WITH CHECK (public.get_user_role() IN ('diretor', 'financeiro'));

-- ============================================================
-- CLIENTES
-- ============================================================

CREATE POLICY "Leitura clientes" ON public.cliente FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('diretor', 'arquiteta', 'financeiro', 'engenheiro'));

CREATE POLICY "Dir+Arq criam clientes" ON public.cliente FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('diretor', 'arquiteta'));

CREATE POLICY "Dir+Arq editam clientes" ON public.cliente FOR UPDATE TO authenticated
    USING (public.get_user_role() IN ('diretor', 'arquiteta'))
    WITH CHECK (public.get_user_role() IN ('diretor', 'arquiteta'));

-- ============================================================
-- RESPONSÁVEIS
-- ============================================================

CREATE POLICY "Todos leem responsaveis" ON public.responsavel FOR SELECT TO authenticated USING (true);

CREATE POLICY "Diretor gerencia responsaveis" ON public.responsavel FOR ALL TO authenticated
    USING (public.get_user_role() = 'diretor')
    WITH CHECK (public.get_user_role() = 'diretor');

-- Permitir que o próprio usuário atualize seus dados básicos
CREATE POLICY "Proprio usuario edita seus dados" ON public.responsavel FOR UPDATE TO authenticated
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- ============================================================
-- FORNECEDORES
-- ============================================================

CREATE POLICY "Leitura fornecedores" ON public.fornecedor FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('diretor', 'financeiro', 'engenheiro'));

CREATE POLICY "Dir+Fin gerenciam fornecedores" ON public.fornecedor FOR ALL TO authenticated
    USING (public.get_user_role() IN ('diretor', 'financeiro'))
    WITH CHECK (public.get_user_role() IN ('diretor', 'financeiro'));

-- ============================================================
-- TRABALHADORES
-- ============================================================

CREATE POLICY "Leitura trabalhadores" ON public.trabalhador FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('diretor', 'engenheiro', 'financeiro', 'mestre_obra'));

CREATE POLICY "Dir+Eng criam trabalhadores" ON public.trabalhador FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('diretor', 'engenheiro'));

CREATE POLICY "Dir+Eng editam trabalhadores" ON public.trabalhador FOR UPDATE TO authenticated
    USING (public.get_user_role() IN ('diretor', 'engenheiro'))
    WITH CHECK (public.get_user_role() IN ('diretor', 'engenheiro'));

-- ============================================================
-- OBRAS (regra mais complexa: engenheiro/mestre vê só as dele)
-- ============================================================

CREATE POLICY "Diretor+Fin+Arq veem todas obras" ON public.obra FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('diretor', 'financeiro', 'arquiteta'));

CREATE POLICY "Eng+Mestre veem suas obras" ON public.obra FOR SELECT TO authenticated
    USING (
        public.get_user_role() IN ('engenheiro', 'mestre_obra')
        AND id_responsavel = public.get_user_responsavel_id()
    );

CREATE POLICY "Dir+Arq criam obras" ON public.obra FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('diretor', 'arquiteta'));

CREATE POLICY "Dir+Eng editam obras" ON public.obra FOR UPDATE TO authenticated
    USING (
        public.get_user_role() = 'diretor'
        OR (public.get_user_role() = 'engenheiro' AND id_responsavel = public.get_user_responsavel_id())
    )
    WITH CHECK (
        public.get_user_role() = 'diretor'
        OR (public.get_user_role() = 'engenheiro' AND id_responsavel = public.get_user_responsavel_id())
    );

-- ============================================================
-- TAREFAS (filtradas pela obra)
-- ============================================================

CREATE POLICY "Leitura tarefas" ON public.tarefa FOR SELECT TO authenticated
    USING (public.user_can_access_obra(id_obra));

CREATE POLICY "Dir+Eng criam tarefas" ON public.tarefa FOR INSERT TO authenticated
    WITH CHECK (
        public.get_user_role() = 'diretor'
        OR (public.get_user_role() = 'engenheiro' AND public.user_can_access_obra(id_obra))
    );

CREATE POLICY "Dir+Eng+Mestre editam tarefas" ON public.tarefa FOR UPDATE TO authenticated
    USING (
        public.get_user_role() = 'diretor'
        OR (public.get_user_role() IN ('engenheiro', 'mestre_obra') AND public.user_can_access_obra(id_obra))
    );

-- ============================================================
-- LANÇAMENTOS (só diretor e financeiro)
-- ============================================================

CREATE POLICY "Dir+Fin leem lancamentos" ON public.lancamento FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('diretor', 'financeiro'));

CREATE POLICY "Dir+Fin criam lancamentos" ON public.lancamento FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('diretor', 'financeiro'));

CREATE POLICY "Dir+Fin editam lancamentos" ON public.lancamento FOR UPDATE TO authenticated
    USING (public.get_user_role() IN ('diretor', 'financeiro'));

-- ============================================================
-- PARCELAS (seguem o lançamento)
-- ============================================================

CREATE POLICY "Dir+Fin leem parcelas" ON public.parcela FOR SELECT TO authenticated
    USING (public.get_user_role() IN ('diretor', 'financeiro'));

CREATE POLICY "Dir+Fin gerenciam parcelas" ON public.parcela FOR ALL TO authenticated
    USING (public.get_user_role() IN ('diretor', 'financeiro'))
    WITH CHECK (public.get_user_role() IN ('diretor', 'financeiro'));

-- ============================================================
-- DOCUMENTOS, DIÁRIOS, CONTRATOS, ESCALA, PRESENÇA
-- ============================================================

CREATE POLICY "Docs leitura" ON public.documento FOR SELECT TO authenticated
    USING (public.user_can_access_obra(id_obra));

CREATE POLICY "Docs escrita" ON public.documento FOR INSERT TO authenticated
    WITH CHECK (public.user_can_access_obra(id_obra));

CREATE POLICY "Diarios leitura" ON public.diario_obra FOR SELECT TO authenticated
    USING (public.user_can_access_obra(id_obra));

CREATE POLICY "Diarios escrita" ON public.diario_obra FOR INSERT TO authenticated
    WITH CHECK (
        public.get_user_role() IN ('diretor', 'engenheiro', 'mestre_obra')
        AND public.user_can_access_obra(id_obra)
    );

CREATE POLICY "Diarios edicao" ON public.diario_obra FOR UPDATE TO authenticated
    USING (
        public.get_user_role() = 'diretor'
        OR (public.get_user_role() IN ('engenheiro', 'mestre_obra') AND public.user_can_access_obra(id_obra))
    );

CREATE POLICY "Contratos leitura" ON public.contrato_trabalho FOR SELECT TO authenticated
    USING (public.user_can_access_obra(id_obra) OR public.get_user_role() = 'financeiro');

CREATE POLICY "Contratos escrita" ON public.contrato_trabalho FOR ALL TO authenticated
    USING (public.get_user_role() IN ('diretor', 'engenheiro') AND public.user_can_access_obra(id_obra))
    WITH CHECK (public.get_user_role() IN ('diretor', 'engenheiro') AND public.user_can_access_obra(id_obra));

CREATE POLICY "Escala leitura" ON public.escala FOR SELECT TO authenticated
    USING (public.user_can_access_obra(id_obra));

CREATE POLICY "Escala escrita" ON public.escala FOR ALL TO authenticated
    USING (public.get_user_role() IN ('diretor', 'engenheiro') AND public.user_can_access_obra(id_obra))
    WITH CHECK (public.get_user_role() IN ('diretor', 'engenheiro') AND public.user_can_access_obra(id_obra));

CREATE POLICY "Presenca leitura" ON public.presenca FOR SELECT TO authenticated
    USING (true); -- Filtrada pela view/join com diário

CREATE POLICY "Presenca escrita" ON public.presenca FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('diretor', 'engenheiro', 'mestre_obra'));

-- ============================================================
-- GRANT para service_role (usado pelo n8n e API routes)
-- ============================================================
-- O service_role key do Supabase já ignora RLS.
-- Use-o APENAS em server-side (n8n, API routes do Next.js).
-- NUNCA exponha o service_role key no frontend.
