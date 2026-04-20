-- ============================================================
-- PATCH v2 — Incrementa o banco existente (NÃO SUBSTITUI)
-- Executar no SQL Editor do Supabase DEPOIS do schema v1
-- Todas as operações são idempotentes (seguro re-executar)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. COLUNAS NOVAS EM TABELAS EXISTENTES
-- ============================================================

-- Cliente: suporte a portal do cliente
ALTER TABLE public.cliente ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.cliente ADD COLUMN IF NOT EXISTS portal_ativo BOOLEAN DEFAULT FALSE;

-- Obra: geolocalização
ALTER TABLE public.obra ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE public.obra ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

-- Tarefa: dependência entre tarefas
ALTER TABLE public.tarefa ADD COLUMN IF NOT EXISTS id_tarefa_predecessora INTEGER REFERENCES public.tarefa(id_tarefa);

-- Diário: campos de clima
ALTER TABLE public.diario_obra ADD COLUMN IF NOT EXISTS clima_temperatura NUMERIC(4,1);
ALTER TABLE public.diario_obra ADD COLUMN IF NOT EXISTS clima_condicao VARCHAR(50);
ALTER TABLE public.diario_obra ADD COLUMN IF NOT EXISTS clima_chuva BOOLEAN DEFAULT FALSE;
ALTER TABLE public.diario_obra ADD COLUMN IF NOT EXISTS clima_descricao VARCHAR(200);

-- Documento: incluir tipo 'inspecao'
ALTER TABLE public.documento DROP CONSTRAINT IF EXISTS documento_tipo_check;
ALTER TABLE public.documento ADD CONSTRAINT documento_tipo_check
    CHECK (tipo IN ('projeto','foto','transcricao','orcamento','relatorio','contrato','inspecao','outro'));

-- ============================================================
-- 2. TABELAS NOVAS
-- ============================================================

-- Alterações de escopo (change orders)
CREATE TABLE IF NOT EXISTS public.alteracao_escopo (
    id_alteracao SERIAL PRIMARY KEY,
    id_obra INTEGER NOT NULL REFERENCES public.obra(id_obra),
    id_responsavel INTEGER REFERENCES public.responsavel(id_responsavel),
    descricao TEXT NOT NULL,
    justificativa TEXT,
    impacto_valor NUMERIC(14,2) DEFAULT 0,
    impacto_dias INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'proposta' CHECK (status IN ('proposta','aprovada_interna','aprovada_cliente','rejeitada','cancelada')),
    data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_aprovacao DATE,
    aprovado_por INTEGER REFERENCES public.responsavel(id_responsavel),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lançamento: vínculo com alteração de escopo (precisa existir a tabela antes)
DO $$ BEGIN
    ALTER TABLE public.lancamento ADD COLUMN IF NOT EXISTS id_alteracao_escopo INTEGER REFERENCES public.alteracao_escopo(id_alteracao);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Pendências (punch list)
CREATE TABLE IF NOT EXISTS public.pendencia (
    id_pendencia SERIAL PRIMARY KEY,
    id_obra INTEGER NOT NULL REFERENCES public.obra(id_obra),
    id_tarefa INTEGER REFERENCES public.tarefa(id_tarefa),
    id_responsavel INTEGER REFERENCES public.responsavel(id_responsavel),
    descricao TEXT NOT NULL,
    localizacao VARCHAR(200),
    prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('alta','media','baixa')),
    status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta','em_correcao','resolvida','aprovada_cliente')),
    data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
    data_resolucao DATE,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fotos de obra
CREATE TABLE IF NOT EXISTS public.foto_obra (
    id_foto SERIAL PRIMARY KEY,
    id_obra INTEGER NOT NULL REFERENCES public.obra(id_obra),
    id_diario INTEGER REFERENCES public.diario_obra(id_diario),
    id_tarefa INTEGER REFERENCES public.tarefa(id_tarefa),
    id_pendencia INTEGER REFERENCES public.pendencia(id_pendencia),
    id_responsavel INTEGER REFERENCES public.responsavel(id_responsavel),
    url_sharepoint TEXT NOT NULL,
    legenda VARCHAR(500),
    localizacao_obra VARCHAR(200),
    data_foto TIMESTAMPTZ DEFAULT NOW()
);

-- Inspeções e checklists
CREATE TABLE IF NOT EXISTS public.inspecao (
    id_inspecao SERIAL PRIMARY KEY,
    id_obra INTEGER NOT NULL REFERENCES public.obra(id_obra),
    id_responsavel INTEGER NOT NULL REFERENCES public.responsavel(id_responsavel),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('seguranca','qualidade','recebimento_material','vistoria_cliente')),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    checklist JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente','conforme','nao_conforme','parcial')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notificações
CREATE TABLE IF NOT EXISTS public.notificacao (
    id_notificacao SERIAL PRIMARY KEY,
    id_responsavel INTEGER NOT NULL REFERENCES public.responsavel(id_responsavel),
    id_obra INTEGER REFERENCES public.obra(id_obra),
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(300) NOT NULL,
    mensagem TEXT,
    link VARCHAR(500),
    lida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log de auditoria
CREATE TABLE IF NOT EXISTS public.log_auditoria (
    id_log SERIAL PRIMARY KEY,
    tabela VARCHAR(100) NOT NULL,
    id_registro INTEGER NOT NULL,
    acao VARCHAR(20) NOT NULL CHECK (acao IN ('insert','update','delete')),
    campo VARCHAR(100),
    valor_anterior TEXT,
    valor_novo TEXT,
    id_responsavel INTEGER REFERENCES public.responsavel(id_responsavel),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Versões de orçamento
CREATE TABLE IF NOT EXISTS public.orcamento_versao (
    id_versao SERIAL PRIMARY KEY,
    id_obra INTEGER NOT NULL REFERENCES public.obra(id_obra),
    numero_versao INTEGER NOT NULL,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    conteudo_json JSONB NOT NULL,
    valor_total NUMERIC(14,2) NOT NULL,
    prazo_dias INTEGER,
    id_responsavel INTEGER REFERENCES public.responsavel(id_responsavel),
    id_alteracao_escopo INTEGER REFERENCES public.alteracao_escopo(id_alteracao),
    status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho','apresentado','aprovado','rejeitado','substituido')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_obra, numero_versao)
);

-- ============================================================
-- 3. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tarefa_pred ON public.tarefa(id_tarefa_predecessora);
CREATE INDEX IF NOT EXISTS idx_lancamento_escopo ON public.lancamento(id_alteracao_escopo);
CREATE INDEX IF NOT EXISTS idx_foto_obra ON public.foto_obra(id_obra);
CREATE INDEX IF NOT EXISTS idx_foto_diario ON public.foto_obra(id_diario);
CREATE INDEX IF NOT EXISTS idx_foto_tarefa ON public.foto_obra(id_tarefa);
CREATE INDEX IF NOT EXISTS idx_pend_obra ON public.pendencia(id_obra);
CREATE INDEX IF NOT EXISTS idx_pend_status ON public.pendencia(status);
CREATE INDEX IF NOT EXISTS idx_alt_obra ON public.alteracao_escopo(id_obra);
CREATE INDEX IF NOT EXISTS idx_insp_obra ON public.inspecao(id_obra, data);
CREATE INDEX IF NOT EXISTS idx_notif_resp ON public.notificacao(id_responsavel, lida);
CREATE INDEX IF NOT EXISTS idx_audit_tab ON public.log_auditoria(tabela, id_registro);
CREATE INDEX IF NOT EXISTS idx_orc_obra ON public.orcamento_versao(id_obra);
CREATE INDEX IF NOT EXISTS idx_cli_auth ON public.cliente(auth_user_id);

-- ============================================================
-- 4. FUNÇÕES ATUALIZADAS
-- ============================================================

-- get_user_role: agora também verifica se é cliente
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT COALESCE(
        (SELECT p.nome FROM public.responsavel r JOIN public.perfil p ON p.id_perfil = r.id_perfil
         WHERE r.auth_user_id = auth.uid() AND r.ativo = TRUE LIMIT 1),
        (SELECT 'cliente' FROM public.cliente c WHERE c.auth_user_id = auth.uid() AND c.portal_ativo = TRUE LIMIT 1)
    );
$$;

-- Nova: get_user_cliente_id
CREATE OR REPLACE FUNCTION public.get_user_cliente_id()
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT c.id_cliente FROM public.cliente c
    WHERE c.auth_user_id = auth.uid() AND c.portal_ativo = TRUE LIMIT 1;
$$;

-- user_can_access_obra: agora inclui acesso de cliente
CREATE OR REPLACE FUNCTION public.user_can_access_obra(obra_id INTEGER)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.responsavel r JOIN public.perfil p ON p.id_perfil = r.id_perfil
        WHERE r.auth_user_id = auth.uid() AND r.ativo = TRUE AND (
            p.nome IN ('diretor','financeiro','arquiteta')
            OR (p.nome IN ('engenheiro','mestre_obra') AND EXISTS (
                SELECT 1 FROM public.obra o WHERE o.id_obra = obra_id AND o.id_responsavel = r.id_responsavel)))
    ) OR EXISTS (
        SELECT 1 FROM public.cliente c JOIN public.obra o ON o.id_cliente = c.id_cliente
        WHERE c.auth_user_id = auth.uid() AND c.portal_ativo = TRUE AND o.id_obra = obra_id
    );
$$;

-- ============================================================
-- 5. TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS tr_pend_upd ON public.pendencia;
CREATE TRIGGER tr_pend_upd BEFORE UPDATE ON public.pendencia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS tr_alt_upd ON public.alteracao_escopo;
CREATE TRIGGER tr_alt_upd BEFORE UPDATE ON public.alteracao_escopo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 6. VIEW: DASHBOARD MULTI-OBRA (semáforo)
-- ============================================================
CREATE OR REPLACE VIEW public.vw_dashboard_obras AS
SELECT
    o.id_obra, o.nome, o.status, o.percentual_finalizada,
    o.data_inicio_prevista, o.data_fim_prevista,
    c.nome AS cliente, r.nome AS responsavel,
    (SELECT COALESCE(SUM(l.valor),0) FROM public.lancamento l WHERE l.id_obra = o.id_obra AND l.tipo='planejado' AND l.entrada_saida='saida') AS total_planejado,
    (SELECT COALESCE(SUM(l.valor),0) FROM public.lancamento l WHERE l.id_obra = o.id_obra AND l.tipo='realizado' AND l.entrada_saida='saida') AS total_realizado,
    (SELECT COUNT(*) FROM public.tarefa t WHERE t.id_obra = o.id_obra AND t.status = 'em_andamento' AND t.data_fim < CURRENT_DATE) AS tarefas_atrasadas,
    (SELECT COUNT(*) FROM public.pendencia p WHERE p.id_obra = o.id_obra AND p.status IN ('aberta','em_correcao')) AS pendencias_abertas,
    (SELECT COUNT(DISTINCT ct.id_trabalhador) FROM public.contrato_trabalho ct WHERE ct.id_obra = o.id_obra AND ct.status='ativo') AS trabalhadores_ativos
FROM public.obra o
JOIN public.cliente c ON c.id_cliente = o.id_cliente
LEFT JOIN public.responsavel r ON r.id_responsavel = o.id_responsavel
WHERE o.status != 'cancelada';

-- ============================================================
-- 7. RLS PARA TABELAS NOVAS
-- ============================================================

-- PENDÊNCIAS
ALTER TABLE public.pendencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pendencias leitura" ON public.pendencia FOR SELECT TO authenticated
    USING (public.user_can_access_obra(id_obra));
CREATE POLICY "Pendencias escrita" ON public.pendencia FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('diretor','engenheiro') AND public.user_can_access_obra(id_obra));
CREATE POLICY "Pendencias update" ON public.pendencia FOR UPDATE TO authenticated
    USING (public.get_user_role() IN ('diretor','engenheiro') AND public.user_can_access_obra(id_obra));

-- FOTOS
ALTER TABLE public.foto_obra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Fotos leitura" ON public.foto_obra FOR SELECT TO authenticated
    USING (public.user_can_access_obra(id_obra));
CREATE POLICY "Fotos escrita" ON public.foto_obra FOR INSERT TO authenticated
    WITH CHECK (public.user_can_access_obra(id_obra));

-- ALTERAÇÃO DE ESCOPO
ALTER TABLE public.alteracao_escopo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alteracao leitura" ON public.alteracao_escopo FOR SELECT TO authenticated
    USING (public.user_can_access_obra(id_obra));
CREATE POLICY "Alteracao proposta" ON public.alteracao_escopo FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('diretor','engenheiro','arquiteta'));
CREATE POLICY "Alteracao aprovacao" ON public.alteracao_escopo FOR UPDATE TO authenticated
    USING (public.get_user_role() IN ('diretor') AND public.user_can_access_obra(id_obra));

-- INSPEÇÕES
ALTER TABLE public.inspecao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inspecao leitura" ON public.inspecao FOR SELECT TO authenticated
    USING (public.user_can_access_obra(id_obra));
CREATE POLICY "Inspecao escrita" ON public.inspecao FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('diretor','engenheiro','mestre_obra') AND public.user_can_access_obra(id_obra));

-- NOTIFICAÇÕES (cada um vê só as suas)
ALTER TABLE public.notificacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notificacao leitura" ON public.notificacao FOR SELECT TO authenticated
    USING (id_responsavel = public.get_user_responsavel_id());
CREATE POLICY "Notificacao update" ON public.notificacao FOR UPDATE TO authenticated
    USING (id_responsavel = public.get_user_responsavel_id());

-- LOG AUDITORIA (somente diretor)
ALTER TABLE public.log_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit leitura" ON public.log_auditoria FOR SELECT TO authenticated
    USING (public.get_user_role() = 'diretor');

-- ORÇAMENTO VERSÃO
ALTER TABLE public.orcamento_versao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orcamento leitura" ON public.orcamento_versao FOR SELECT TO authenticated
    USING (public.user_can_access_obra(id_obra));
CREATE POLICY "Orcamento escrita" ON public.orcamento_versao FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role() IN ('diretor','arquiteta'));
CREATE POLICY "Orcamento update" ON public.orcamento_versao FOR UPDATE TO authenticated
    USING (public.get_user_role() IN ('diretor','financeiro'));

COMMIT;
