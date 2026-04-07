-- ============================================================
-- SISTEMA DE GESTÃO DE OBRAS — SCHEMA COMPLETO PARA SUPABASE
-- PostgreSQL 16 (Supabase)
-- Executar no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- NOTA: A tabela auth.users é gerenciada pelo Supabase Auth.
-- A tabela 'responsavel' tem um campo auth_user_id que vincula
-- o login Supabase ao funcionário da empresa.
-- ============================================================

BEGIN;

-- ============================================================
-- TABELAS DE REFERÊNCIA (criar primeiro)
-- ============================================================

CREATE TABLE public.perfil (
    id_perfil SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    permissoes JSONB NOT NULL DEFAULT '{}',
    descricao TEXT
);

COMMENT ON TABLE public.perfil IS 'Perfis de acesso do sistema: diretor, engenheiro, financeiro, arquiteta, mestre_obra';

CREATE TABLE public.cliente (
    id_cliente SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    cpf_cnpj VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(200),
    endereco TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.responsavel (
    id_responsavel SERIAL PRIMARY KEY,
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    id_perfil INTEGER NOT NULL REFERENCES public.perfil(id_perfil),
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(20),
    telefone_whatsapp VARCHAR(20),
    email VARCHAR(200),
    departamento VARCHAR(100),
    cargo VARCHAR(100),
    data_admissao DATE,
    data_desligamento DATE,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN public.responsavel.auth_user_id IS 'Vincula o login Supabase Auth ao funcionário. Preenchido após signup.';
COMMENT ON COLUMN public.responsavel.telefone_whatsapp IS 'Número do WhatsApp para identificação pelo bot de áudio diário.';

CREATE TABLE public.fornecedor (
    id_fornecedor SERIAL PRIMARY KEY,
    cnpj VARCHAR(20) UNIQUE,
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    contato VARCHAR(200),
    tipo VARCHAR(50),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.centro_custo (
    id_centro_custo SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.plano_conta (
    id_plano SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE,
    nome VARCHAR(200) NOT NULL,
    id_pai INTEGER REFERENCES public.plano_conta(id_plano),
    tipo_plano VARCHAR(50) CHECK (tipo_plano IN ('receita', 'despesa')),
    analitica BOOLEAN DEFAULT FALSE
);

COMMENT ON COLUMN public.plano_conta.analitica IS 'TRUE = conta analítica (aceita lançamentos). FALSE = conta sintética (apenas agrupadora).';

CREATE TABLE public.grupo_movimento (
    id_grupo SERIAL PRIMARY KEY,
    nome VARCHAR(200) UNIQUE NOT NULL,
    descricao TEXT
);

COMMENT ON TABLE public.grupo_movimento IS 'Vincula o financeiro ao físico. Cada grupo representa um tipo de serviço da obra (alvenaria, elétrica, etc).';

CREATE TABLE public.etapa (
    id_etapa SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    ordem INTEGER NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.etapa IS 'Etapas padrão de obra (fundação, estrutura, alvenaria...). Lista fixa que se repete em todas as obras.';

CREATE TABLE public.trabalhador (
    id_trabalhador SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    especialidade VARCHAR(100),
    tipo_vinculo VARCHAR(50),
    pix_chave VARCHAR(200),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN public.trabalhador.tipo_vinculo IS 'autonomo, pj, clt, empreiteiro';
COMMENT ON COLUMN public.trabalhador.especialidade IS 'pedreiro, eletricista, encanador, pintor, servente, mestre, carpinteiro, serralheiro';

-- ============================================================
-- TABELAS PRINCIPAIS
-- ============================================================

CREATE TABLE public.obra (
    id_obra SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES public.cliente(id_cliente),
    id_centro_custo INTEGER REFERENCES public.centro_custo(id_centro_custo),
    id_responsavel INTEGER REFERENCES public.responsavel(id_responsavel),
    nome VARCHAR(300) NOT NULL,
    data_inicio_prevista DATE,
    data_fim_prevista DATE,
    data_inicio_real DATE,
    data_fim_real DATE,
    descricao TEXT,
    endereco TEXT,
    status VARCHAR(50) DEFAULT 'planejamento' CHECK (status IN ('planejamento', 'em_andamento', 'pausada', 'concluida', 'cancelada')),
    percentual_finalizada NUMERIC(5,2) DEFAULT 0 CHECK (percentual_finalizada >= 0 AND percentual_finalizada <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by INTEGER REFERENCES public.responsavel(id_responsavel)
);

CREATE TABLE public.tarefa (
    id_tarefa SERIAL PRIMARY KEY,
    id_obra INTEGER NOT NULL REFERENCES public.obra(id_obra) ON DELETE CASCADE,
    id_etapa INTEGER REFERENCES public.etapa(id_etapa),
    id_responsavel INTEGER REFERENCES public.responsavel(id_responsavel),
    nome VARCHAR(300) NOT NULL,
    descricao TEXT,
    data_inicio DATE,
    data_fim DATE,
    conclusao_real DATE,
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada', 'bloqueada')),
    percentual_concluido NUMERIC(5,2) DEFAULT 0 CHECK (percentual_concluido >= 0 AND percentual_concluido <= 100),
    orcamento_previsto NUMERIC(14,2) DEFAULT 0,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by INTEGER REFERENCES public.responsavel(id_responsavel)
);

CREATE TABLE public.lancamento (
    id_lancamento SERIAL PRIMARY KEY,
    id_obra INTEGER NOT NULL REFERENCES public.obra(id_obra),
    id_tarefa INTEGER REFERENCES public.tarefa(id_tarefa),
    id_grupo_movimento INTEGER REFERENCES public.grupo_movimento(id_grupo),
    id_centro_custo INTEGER NOT NULL REFERENCES public.centro_custo(id_centro_custo),
    id_plano_conta INTEGER REFERENCES public.plano_conta(id_plano),
    id_fornecedor INTEGER REFERENCES public.fornecedor(id_fornecedor),
    id_responsavel INTEGER NOT NULL REFERENCES public.responsavel(id_responsavel),
    historico TEXT,
    valor NUMERIC(14,2) NOT NULL CHECK (valor > 0),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('planejado', 'realizado')),
    entrada_saida VARCHAR(10) NOT NULL CHECK (entrada_saida IN ('entrada', 'saida')),
    forma_pagamento VARCHAR(50),
    data_pagamento DATE,
    data_competencia DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by INTEGER REFERENCES public.responsavel(id_responsavel)
);

CREATE TABLE public.parcela (
    id_parcela SERIAL PRIMARY KEY,
    id_lancamento INTEGER NOT NULL REFERENCES public.lancamento(id_lancamento) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    valor NUMERIC(14,2) NOT NULL CHECK (valor > 0),
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado'))
);

CREATE TABLE public.documento (
    id_documento SERIAL PRIMARY KEY,
    id_obra INTEGER NOT NULL REFERENCES public.obra(id_obra),
    id_responsavel INTEGER REFERENCES public.responsavel(id_responsavel),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('projeto', 'foto', 'transcricao', 'orcamento', 'relatorio', 'contrato', 'outro')),
    nome VARCHAR(300) NOT NULL,
    url_sharepoint TEXT,
    data_criacao TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.diario_obra (
    id_diario SERIAL PRIMARY KEY,
    id_obra INTEGER NOT NULL REFERENCES public.obra(id_obra),
    id_responsavel INTEGER REFERENCES public.responsavel(id_responsavel),
    data DATE NOT NULL,
    conteudo TEXT,
    origem VARCHAR(50) DEFAULT 'manual' CHECK (origem IN ('manual', 'whatsapp', 'plaud')),
    status_revisao VARCHAR(20) DEFAULT 'pendente' CHECK (status_revisao IN ('pendente', 'aprovado', 'rejeitado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(id_obra, data)
);

-- ============================================================
-- TABELAS DE MÃO DE OBRA
-- ============================================================

CREATE TABLE public.contrato_trabalho (
    id_contrato SERIAL PRIMARY KEY,
    id_trabalhador INTEGER NOT NULL REFERENCES public.trabalhador(id_trabalhador),
    id_obra INTEGER NOT NULL REFERENCES public.obra(id_obra),
    id_tarefa INTEGER REFERENCES public.tarefa(id_tarefa),
    tipo_pagamento VARCHAR(20) NOT NULL CHECK (tipo_pagamento IN ('diaria', 'empreitada', 'hora', 'metro_quadrado')),
    valor_acordado NUMERIC(14,2) NOT NULL CHECK (valor_acordado > 0),
    unidade_valor VARCHAR(30) NOT NULL DEFAULT 'por_dia',
    data_inicio DATE NOT NULL,
    data_fim DATE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'encerrado', 'cancelado')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.escala (
    id_escala SERIAL PRIMARY KEY,
    id_obra INTEGER NOT NULL REFERENCES public.obra(id_obra),
    id_trabalhador INTEGER NOT NULL REFERENCES public.trabalhador(id_trabalhador),
    id_contrato INTEGER NOT NULL REFERENCES public.contrato_trabalho(id_contrato),
    data_prevista DATE NOT NULL,
    turno VARCHAR(20) DEFAULT 'integral' CHECK (turno IN ('integral', 'manha', 'tarde')),
    status VARCHAR(20) DEFAULT 'planejado' CHECK (status IN ('planejado', 'confirmado', 'cancelado')),
    UNIQUE(id_trabalhador, data_prevista, turno)
);

CREATE TABLE public.presenca (
    id_presenca SERIAL PRIMARY KEY,
    id_diario INTEGER NOT NULL REFERENCES public.diario_obra(id_diario),
    id_trabalhador INTEGER NOT NULL REFERENCES public.trabalhador(id_trabalhador),
    id_contrato INTEGER NOT NULL REFERENCES public.contrato_trabalho(id_contrato),
    tipo_presenca VARCHAR(20) NOT NULL CHECK (tipo_presenca IN ('integral', 'meia', 'falta', 'falta_justificada')),
    horas_trabalhadas NUMERIC(4,1),
    valor_dia NUMERIC(14,2),
    observacoes TEXT,
    UNIQUE(id_diario, id_trabalhador)
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX idx_obra_cliente ON public.obra(id_cliente);
CREATE INDEX idx_obra_status ON public.obra(status);
CREATE INDEX idx_obra_responsavel ON public.obra(id_responsavel);
CREATE INDEX idx_tarefa_obra ON public.tarefa(id_obra);
CREATE INDEX idx_tarefa_etapa ON public.tarefa(id_etapa);
CREATE INDEX idx_tarefa_status ON public.tarefa(status);
CREATE INDEX idx_lancamento_obra ON public.lancamento(id_obra);
CREATE INDEX idx_lancamento_data ON public.lancamento(data_competencia);
CREATE INDEX idx_lancamento_tipo ON public.lancamento(tipo);
CREATE INDEX idx_lancamento_centro ON public.lancamento(id_centro_custo);
CREATE INDEX idx_parcela_vencimento ON public.parcela(data_vencimento);
CREATE INDEX idx_parcela_status ON public.parcela(status);
CREATE INDEX idx_diario_obra_data ON public.diario_obra(id_obra, data);
CREATE INDEX idx_contrato_obra ON public.contrato_trabalho(id_obra);
CREATE INDEX idx_contrato_trabalhador ON public.contrato_trabalho(id_trabalhador);
CREATE INDEX idx_contrato_status ON public.contrato_trabalho(status);
CREATE INDEX idx_escala_obra_data ON public.escala(id_obra, data_prevista);
CREATE INDEX idx_escala_trabalhador ON public.escala(id_trabalhador, data_prevista);
CREATE INDEX idx_presenca_diario ON public.presenca(id_diario);
CREATE INDEX idx_presenca_trabalhador ON public.presenca(id_trabalhador);
CREATE INDEX idx_documento_obra ON public.documento(id_obra);
CREATE INDEX idx_responsavel_auth ON public.responsavel(auth_user_id);
CREATE INDEX idx_responsavel_perfil ON public.responsavel(id_perfil);

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

CREATE OR REPLACE VIEW public.vw_folha_semanal AS
SELECT
    p.id_trabalhador,
    t.nome AS trabalhador,
    t.especialidade,
    t.pix_chave,
    o.id_obra,
    o.nome AS obra,
    ct.tipo_pagamento,
    ct.valor_acordado,
    d.data AS data_trabalho,
    p.tipo_presenca,
    p.valor_dia,
    DATE_TRUNC('week', d.data) AS semana
FROM public.presenca p
JOIN public.diario_obra d ON d.id_diario = p.id_diario
JOIN public.trabalhador t ON t.id_trabalhador = p.id_trabalhador
JOIN public.contrato_trabalho ct ON ct.id_contrato = p.id_contrato
JOIN public.obra o ON o.id_obra = d.id_obra
WHERE p.tipo_presenca IN ('integral', 'meia');

CREATE OR REPLACE VIEW public.vw_alocacao_diaria AS
SELECT
    e.id_obra,
    o.nome AS obra,
    e.data_prevista,
    e.id_trabalhador,
    t.nome AS trabalhador,
    t.especialidade,
    e.turno,
    e.status AS status_escala,
    p.tipo_presenca,
    CASE
        WHEN p.id_presenca IS NOT NULL THEN 'presente'
        WHEN e.data_prevista < CURRENT_DATE THEN 'ausente'
        ELSE 'futuro'
    END AS situacao
FROM public.escala e
JOIN public.obra o ON o.id_obra = e.id_obra
JOIN public.trabalhador t ON t.id_trabalhador = e.id_trabalhador
LEFT JOIN public.diario_obra d ON d.id_obra = e.id_obra AND d.data = e.data_prevista
LEFT JOIN public.presenca p ON p.id_diario = d.id_diario AND p.id_trabalhador = e.id_trabalhador;

CREATE OR REPLACE VIEW public.vw_curva_s_financeira AS
SELECT
    l.id_obra,
    o.nome AS obra,
    l.data_competencia,
    l.tipo,
    SUM(CASE WHEN l.entrada_saida = 'saida' THEN l.valor ELSE 0 END) AS total_saida,
    SUM(CASE WHEN l.entrada_saida = 'entrada' THEN l.valor ELSE 0 END) AS total_entrada
FROM public.lancamento l
JOIN public.obra o ON o.id_obra = l.id_obra
GROUP BY l.id_obra, o.nome, l.data_competencia, l.tipo
ORDER BY l.id_obra, l.data_competencia;

CREATE OR REPLACE VIEW public.vw_contas_a_pagar AS
SELECT
    pa.id_parcela,
    pa.id_lancamento,
    pa.numero,
    pa.valor,
    pa.data_vencimento,
    pa.status,
    pa.data_pagamento,
    l.historico,
    l.id_obra,
    f.nome AS fornecedor,
    f.cnpj,
    o.nome AS obra,
    CASE
        WHEN pa.data_vencimento < CURRENT_DATE AND pa.status = 'pendente' THEN 'atrasado'
        ELSE pa.status
    END AS status_real,
    pa.data_vencimento - CURRENT_DATE AS dias_para_vencer
FROM public.parcela pa
JOIN public.lancamento l ON l.id_lancamento = pa.id_lancamento
JOIN public.obra o ON o.id_obra = l.id_obra
LEFT JOIN public.fornecedor f ON f.id_fornecedor = l.id_fornecedor
WHERE pa.status IN ('pendente', 'atrasado')
ORDER BY pa.data_vencimento;

CREATE OR REPLACE VIEW public.vw_resumo_pagamento_semanal AS
SELECT
    DATE_TRUNC('week', d.data) AS semana,
    p.id_trabalhador,
    t.nome AS trabalhador,
    t.pix_chave,
    o.id_obra,
    o.nome AS obra,
    COUNT(CASE WHEN p.tipo_presenca = 'integral' THEN 1 END) AS dias_integral,
    COUNT(CASE WHEN p.tipo_presenca = 'meia' THEN 1 END) AS dias_meia,
    COUNT(CASE WHEN p.tipo_presenca IN ('falta', 'falta_justificada') THEN 1 END) AS faltas,
    SUM(COALESCE(p.valor_dia, 0)) AS total_a_pagar
FROM public.presenca p
JOIN public.diario_obra d ON d.id_diario = p.id_diario
JOIN public.trabalhador t ON t.id_trabalhador = p.id_trabalhador
JOIN public.obra o ON o.id_obra = d.id_obra
GROUP BY DATE_TRUNC('week', d.data), p.id_trabalhador, t.nome, t.pix_chave, o.id_obra, o.nome;

-- ============================================================
-- FUNÇÕES UTILITÁRIAS
-- ============================================================

-- Função para obter o role do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT p.nome
    FROM public.responsavel r
    JOIN public.perfil p ON p.id_perfil = r.id_perfil
    WHERE r.auth_user_id = auth.uid()
    AND r.ativo = TRUE
    LIMIT 1;
$$;

-- Função para obter o id_responsavel do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_responsavel_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT r.id_responsavel
    FROM public.responsavel r
    WHERE r.auth_user_id = auth.uid()
    AND r.ativo = TRUE
    LIMIT 1;
$$;

-- Função para verificar se o usuário tem acesso a uma obra
CREATE OR REPLACE FUNCTION public.user_can_access_obra(obra_id INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.responsavel r
        JOIN public.perfil p ON p.id_perfil = r.id_perfil
        WHERE r.auth_user_id = auth.uid()
        AND r.ativo = TRUE
        AND (
            p.nome IN ('diretor', 'financeiro', 'arquiteta')
            OR (p.nome IN ('engenheiro', 'mestre_obra')
                AND EXISTS (
                    SELECT 1 FROM public.obra o
                    WHERE o.id_obra = obra_id
                    AND o.id_responsavel = r.id_responsavel
                ))
        )
    );
$$;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_obra_updated BEFORE UPDATE ON public.obra FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_tarefa_updated BEFORE UPDATE ON public.tarefa FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_lancamento_updated BEFORE UPDATE ON public.lancamento FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_responsavel_updated BEFORE UPDATE ON public.responsavel FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_trabalhador_updated BEFORE UPDATE ON public.trabalhador FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_cliente_updated BEFORE UPDATE ON public.cliente FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER tr_contrato_updated BEFORE UPDATE ON public.contrato_trabalho FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- DADOS INICIAIS (SEED)
-- ============================================================

INSERT INTO public.perfil (nome, descricao, permissoes) VALUES
('diretor', 'Acesso total ao sistema', '{"ver_tudo": true, "editar_tudo": true}'),
('engenheiro', 'Gerencia obras atribuídas', '{"ver_obras_proprias": true, "editar_tarefas": true, "editar_diario": true, "editar_presenca": true}'),
('financeiro', 'Gerencia parte financeira', '{"ver_lancamentos": true, "editar_lancamentos": true, "ver_obras": true, "aprovar_folha": true}'),
('arquiteta', 'Gerencia projetos e documentos', '{"ver_obras": true, "editar_documentos": true, "solicitar_orcamento": true}'),
('mestre_obra', 'Operação de campo', '{"ver_obras_proprias": true, "editar_diario": true, "editar_presenca": true}');

INSERT INTO public.etapa (codigo, nome, descricao, ordem) VALUES
('PROJ', 'Projetos', 'Fase de projetos e planejamento', 1),
('DEMO', 'Demolição', 'Demolição e remoção', 2),
('FUND', 'Fundação', 'Fundação e infraestrutura', 3),
('ESTR', 'Estrutura', 'Estrutura (pilares, vigas, lajes)', 4),
('ALVE', 'Alvenaria', 'Levantamento de paredes', 5),
('HIDR', 'Hidráulica', 'Instalações hidrossanitárias', 6),
('ELET', 'Elétrica', 'Instalações elétricas', 7),
('REVE', 'Revestimento', 'Reboco, cerâmica, porcelanato', 8),
('PINT', 'Pintura', 'Massa corrida, tinta, textura', 9),
('ESQU', 'Esquadrias', 'Portas, janelas, vidros', 10),
('COBE', 'Cobertura', 'Telhado, impermeabilização', 11),
('ACAB', 'Acabamento', 'Louças, metais, acessórios', 12),
('LIMP', 'Limpeza final', 'Limpeza e entrega', 13);

INSERT INTO public.grupo_movimento (nome, descricao) VALUES
('Demolição', 'Serviços de demolição e remoção'),
('Fundação', 'Concreto, formas, armação de fundação'),
('Estrutura', 'Pilares, vigas, lajes, escadas'),
('Alvenaria', 'Levantamento de paredes e muros'),
('Instalação elétrica', 'Fiação, quadros, tomadas, luminárias'),
('Instalação hidráulica', 'Tubulação, registros, louças'),
('Revestimento', 'Reboco, cerâmica, porcelanato, pastilha'),
('Pintura', 'Massa corrida, tinta, textura, verniz'),
('Esquadrias', 'Portas, janelas, vidros, ferragens'),
('Cobertura', 'Estrutura de telhado, telhas, calhas'),
('Acabamento', 'Louças, metais, bancadas, marmoraria'),
('Administrativo', 'Custos administrativos gerais');

INSERT INTO public.plano_conta (codigo, nome, tipo_plano, analitica) VALUES
('1', 'Receitas', 'receita', FALSE),
('2', 'Despesas', 'despesa', FALSE);

INSERT INTO public.plano_conta (codigo, nome, id_pai, tipo_plano, analitica) VALUES
('1.1', 'Receita de obras', (SELECT id_plano FROM public.plano_conta WHERE codigo = '1'), 'receita', TRUE),
('1.2', 'Outras receitas', (SELECT id_plano FROM public.plano_conta WHERE codigo = '1'), 'receita', TRUE),
('2.1', 'Materiais', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2'), 'despesa', FALSE),
('2.2', 'Mão de obra', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2'), 'despesa', FALSE),
('2.3', 'Equipamentos', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2'), 'despesa', TRUE),
('2.4', 'Administrativo', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2'), 'despesa', FALSE);

INSERT INTO public.plano_conta (codigo, nome, id_pai, tipo_plano, analitica) VALUES
('2.1.1', 'Cimento e argamassa', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1'), 'despesa', TRUE),
('2.1.2', 'Aço e ferragens', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1'), 'despesa', TRUE),
('2.1.3', 'Material elétrico', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1'), 'despesa', TRUE),
('2.1.4', 'Material hidráulico', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1'), 'despesa', TRUE),
('2.1.5', 'Madeira', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1'), 'despesa', TRUE),
('2.1.6', 'Tintas e acessórios', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1'), 'despesa', TRUE),
('2.1.7', 'Cerâmica e revestimentos', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1'), 'despesa', TRUE),
('2.2.1', 'Diárias', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.2'), 'despesa', TRUE),
('2.2.2', 'Empreitadas', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.2'), 'despesa', TRUE),
('2.2.3', 'Horas extras', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.2'), 'despesa', TRUE),
('2.4.1', 'Marketing', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.4'), 'despesa', TRUE),
('2.4.2', 'Impostos', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.4'), 'despesa', TRUE),
('2.4.3', 'Transporte', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.4'), 'despesa', TRUE),
('2.4.4', 'Alimentação', (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.4'), 'despesa', TRUE);

-- Centro de custo padrão (necessário para primeiros lançamentos)
INSERT INTO public.centro_custo (codigo, nome, descricao) VALUES
('ADM', 'Administrativo', 'Custos administrativos da empresa'),
('MKT', 'Marketing', 'Custos de marketing e publicidade');

COMMIT;
