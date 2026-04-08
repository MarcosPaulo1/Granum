-- ============================================================
-- DADOS FICTÍCIOS PARA TESTE — GRANUM
-- Todos os registros possuem "[TESTE]" no nome/histórico
-- Para remover: execute o bloco "CLEANUP" no final deste arquivo
-- ============================================================

BEGIN;

-- ============================================================
-- 1. CLIENTES
-- ============================================================
INSERT INTO public.cliente (nome, cpf_cnpj, telefone, email, endereco, observacoes) VALUES
('[TESTE] João da Silva Construções', '12.345.678/0001-90', '(21) 99999-0001', 'joao.teste@email.com', 'Rua das Palmeiras, 100 - Botafogo, RJ', 'Cliente fictício para testes'),
('[TESTE] Ana Costa Empreendimentos', '98.765.432/0001-10', '(21) 99999-0002', 'ana.teste@email.com', 'Av. Brasil, 500 - Centro, RJ', 'Cliente fictício para testes'),
('[TESTE] Pedro Oliveira', '123.456.789-00', '(21) 99999-0003', 'pedro.teste@email.com', 'Rua do Catete, 250 - Catete, RJ', 'Cliente PF fictício para testes');

-- ============================================================
-- 2. RESPONSÁVEIS (sem auth_user_id — apenas cadastro interno)
-- ============================================================
INSERT INTO public.responsavel (auth_user_id, id_perfil, nome, telefone, email, departamento, cargo, data_admissao, ativo) VALUES
(NULL, (SELECT id_perfil FROM public.perfil WHERE nome = 'engenheiro'), '[TESTE] Carlos Engenheiro', '(21) 98888-0001', 'carlos.teste@granum.com', 'Engenharia', 'Engenheiro Civil', '2024-01-15', TRUE),
(NULL, (SELECT id_perfil FROM public.perfil WHERE nome = 'financeiro'), '[TESTE] Maria Financeira', '(21) 98888-0002', 'maria.teste@granum.com', 'Financeiro', 'Analista Financeiro', '2024-03-01', TRUE),
(NULL, (SELECT id_perfil FROM public.perfil WHERE nome = 'mestre_obra'), '[TESTE] Roberto Mestre', '(21) 98888-0003', 'roberto.teste@granum.com', 'Obras', 'Mestre de Obras', '2024-02-10', TRUE);

-- ============================================================
-- 3. FORNECEDORES
-- ============================================================
INSERT INTO public.fornecedor (cnpj, nome, email, contato, tipo, observacoes, ativo) VALUES
('11.111.111/0001-01', '[TESTE] Cimentex Materiais LTDA', 'vendas@cimentex-teste.com', 'Marcos Vendas', 'materiais', 'Fornecedor fictício — cimento, argamassa', TRUE),
('22.222.222/0001-02', '[TESTE] EletroForce Instalações', 'contato@eletroforce-teste.com', 'Sandra Comercial', 'serviços', 'Fornecedor fictício — materiais elétricos', TRUE),
('33.333.333/0001-03', '[TESTE] HidroTech Comércio', 'orcamento@hidrotech-teste.com', 'Paulo Orçamentos', 'materiais', 'Fornecedor fictício — materiais hidráulicos', TRUE),
('44.444.444/0001-04', '[TESTE] LocaMaq Equipamentos', 'locacao@locamaq-teste.com', 'Fábio Locação', 'equipamentos', 'Fornecedor fictício — locação de máquinas', TRUE);

-- ============================================================
-- 4. CENTROS DE CUSTO PARA OBRAS
-- ============================================================
INSERT INTO public.centro_custo (codigo, nome, descricao, ativo) VALUES
('OBR01', '[TESTE] Obra Botafogo', 'Centro de custo da reforma Botafogo', TRUE),
('OBR02', '[TESTE] Obra Centro', 'Centro de custo da construção Centro', TRUE),
('OBR03', '[TESTE] Obra Catete', 'Centro de custo da reforma Catete', TRUE);

-- ============================================================
-- 5. TRABALHADORES
-- ============================================================
INSERT INTO public.trabalhador (nome, cpf, telefone, especialidade, tipo_vinculo, pix_chave, ativo) VALUES
('[TESTE] Antônio Pedreiro', '111.111.111-11', '(21) 97777-0001', 'pedreiro', 'autonomo', '11111111111', TRUE),
('[TESTE] José Eletricista', '222.222.222-22', '(21) 97777-0002', 'eletricista', 'pj', '22222222222', TRUE),
('[TESTE] Luiz Encanador', '333.333.333-33', '(21) 97777-0003', 'encanador', 'autonomo', '33333333333', TRUE),
('[TESTE] Marcos Pintor', '444.444.444-44', '(21) 97777-0004', 'pintor', 'autonomo', '44444444444', TRUE),
('[TESTE] Paulo Servente', '555.555.555-55', '(21) 97777-0005', 'servente', 'clt', '55555555555', TRUE),
('[TESTE] Sérgio Carpinteiro', '666.666.666-66', '(21) 97777-0006', 'carpinteiro', 'empreiteiro', '66666666666', TRUE);

-- ============================================================
-- 6. OBRAS (3 projetos em estados diferentes)
-- ============================================================

-- Obra 1: Em andamento (reforma residencial)
INSERT INTO public.obra (id_cliente, id_centro_custo, id_responsavel, nome, descricao, endereco, status, percentual_finalizada, data_inicio_prevista, data_fim_prevista, data_inicio_real)
VALUES (
    (SELECT id_cliente FROM public.cliente WHERE nome LIKE '[TESTE] João%'),
    (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
    (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Carlos Engenheiro'),
    '[TESTE] Reforma Residencial Botafogo',
    'Reforma completa de apartamento 3 quartos — 120m²',
    'Rua das Palmeiras, 100 Apto 501 - Botafogo, RJ',
    'em_andamento',
    35.00,
    '2026-02-01',
    '2026-07-30',
    '2026-02-10'
);

-- Obra 2: Planejamento (construção comercial)
INSERT INTO public.obra (id_cliente, id_centro_custo, id_responsavel, nome, descricao, endereco, status, percentual_finalizada, data_inicio_prevista, data_fim_prevista)
VALUES (
    (SELECT id_cliente FROM public.cliente WHERE nome LIKE '%Ana Costa%'),
    (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR02'),
    (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Carlos Engenheiro'),
    '[TESTE] Loja Comercial Centro',
    'Construção de loja térrea — 80m² em terreno vazio',
    'Av. Brasil, 500 Loja A - Centro, RJ',
    'planejamento',
    0.00,
    '2026-05-01',
    '2026-12-15'
);

-- Obra 3: Pausada (reforma de sobrado)
INSERT INTO public.obra (id_cliente, id_centro_custo, id_responsavel, nome, descricao, endereco, status, percentual_finalizada, data_inicio_prevista, data_fim_prevista, data_inicio_real)
VALUES (
    (SELECT id_cliente FROM public.cliente WHERE nome = '[TESTE] Pedro Oliveira'),
    (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR03'),
    (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Carlos Engenheiro'),
    '[TESTE] Reforma Sobrado Catete',
    'Reforma estrutural de sobrado antigo — reforço de fundação e telhado',
    'Rua do Catete, 250 - Catete, RJ',
    'pausada',
    15.00,
    '2026-01-10',
    '2026-08-30',
    '2026-01-20'
);

-- ============================================================
-- 7. TAREFAS (para Obra 1 — Reforma Botafogo, a mais avançada)
-- ============================================================

-- Tarefas Obra 1
INSERT INTO public.tarefa (id_obra, id_etapa, id_responsavel, nome, descricao, ordem, status, percentual_concluido, orcamento_previsto, data_inicio, data_fim) VALUES
((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'DEMO'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Roberto Mestre'),
 '[TESTE] Demolição das paredes internas', 'Remoção de paredes não-estruturais e entulho', 1, 'concluida', 100, 8000.00, '2026-02-10', '2026-02-20'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'HIDR'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Roberto Mestre'),
 '[TESTE] Nova tubulação hidráulica', 'Substituição completa de água fria/quente e esgoto', 2, 'concluida', 100, 15000.00, '2026-02-21', '2026-03-10'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'ELET'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Roberto Mestre'),
 '[TESTE] Instalação elétrica completa', 'Nova fiação, quadro e pontos de luz/tomada', 3, 'em_andamento', 60, 18000.00, '2026-03-05', '2026-04-05'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'ALVE'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Roberto Mestre'),
 '[TESTE] Levantamento de novas paredes', 'Alvenaria do novo layout — 3 quartos + suíte', 4, 'em_andamento', 40, 12000.00, '2026-03-15', '2026-04-15'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'REVE'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Roberto Mestre'),
 '[TESTE] Revestimento de pisos e paredes', 'Porcelanato nos ambientes sociais, cerâmica nos banheiros', 5, 'pendente', 0, 22000.00, '2026-04-16', '2026-05-20'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'PINT'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Roberto Mestre'),
 '[TESTE] Pintura geral', 'Massa corrida, selador e 2 demãos de tinta acrílica', 6, 'pendente', 0, 9000.00, '2026-05-21', '2026-06-10'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'ACAB'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Roberto Mestre'),
 '[TESTE] Acabamento e louças', 'Instalação de louças, metais, espelhos e acessórios', 7, 'pendente', 0, 16000.00, '2026-06-11', '2026-07-10');

-- Tarefas Obra 2 (Planejamento — apenas projetadas)
INSERT INTO public.tarefa (id_obra, id_etapa, id_responsavel, nome, descricao, ordem, status, percentual_concluido, orcamento_previsto, data_inicio, data_fim) VALUES
((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Loja Comercial%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'PROJ'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Carlos Engenheiro'),
 '[TESTE] Projeto arquitetônico e estrutural', 'Plantas, memorial descritivo e ART', 1, 'em_andamento', 50, 25000.00, '2026-04-01', '2026-04-30'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Loja Comercial%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'FUND'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Carlos Engenheiro'),
 '[TESTE] Fundação radier', 'Escavação, compactação e concretagem do radier', 2, 'pendente', 0, 35000.00, '2026-05-01', '2026-05-30'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Loja Comercial%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'ESTR'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Carlos Engenheiro'),
 '[TESTE] Estrutura metálica', 'Montagem de pilares e vigas em perfil metálico', 3, 'pendente', 0, 60000.00, '2026-06-01', '2026-07-15');

-- Tarefas Obra 3 (Pausada — parcialmente executadas)
INSERT INTO public.tarefa (id_obra, id_etapa, id_responsavel, nome, descricao, ordem, status, percentual_concluido, orcamento_previsto, data_inicio, data_fim) VALUES
((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Sobrado%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'FUND'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Roberto Mestre'),
 '[TESTE] Reforço de fundação', 'Estacas de reforço e viga baldrame nova', 1, 'concluida', 100, 40000.00, '2026-01-20', '2026-02-28'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Sobrado%'),
 (SELECT id_etapa FROM public.etapa WHERE codigo = 'COBE'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Roberto Mestre'),
 '[TESTE] Troca de telhado', 'Remoção do telhado antigo e instalação de telha termoacústica', 2, 'bloqueada', 10, 28000.00, '2026-03-01', '2026-04-15');

-- ============================================================
-- 8. CONTRATOS DE TRABALHO (para Obra 1)
-- ============================================================
INSERT INTO public.contrato_trabalho (id_trabalhador, id_obra, tipo_pagamento, valor_acordado, unidade_valor, data_inicio, data_fim, status, observacoes) VALUES
((SELECT id_trabalhador FROM public.trabalhador WHERE nome = '[TESTE] Antônio Pedreiro'),
 (SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 'diaria', 250.00, 'por_dia', '2026-02-10', '2026-07-30', 'ativo', '[TESTE] Contrato de diária — pedreiro principal'),

((SELECT id_trabalhador FROM public.trabalhador WHERE nome = '[TESTE] José Eletricista'),
 (SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 'empreitada', 12000.00, 'por_servico', '2026-03-05', '2026-04-05', 'ativo', '[TESTE] Empreitada elétrica completa'),

((SELECT id_trabalhador FROM public.trabalhador WHERE nome = '[TESTE] Luiz Encanador'),
 (SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 'empreitada', 10000.00, 'por_servico', '2026-02-21', '2026-03-10', 'encerrado', '[TESTE] Empreitada hidráulica — concluída'),

((SELECT id_trabalhador FROM public.trabalhador WHERE nome = '[TESTE] Paulo Servente'),
 (SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 'diaria', 150.00, 'por_dia', '2026-02-10', '2026-07-30', 'ativo', '[TESTE] Servente — apoio geral'),

((SELECT id_trabalhador FROM public.trabalhador WHERE nome = '[TESTE] Antônio Pedreiro'),
 (SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Sobrado%'),
 'diaria', 250.00, 'por_dia', '2026-01-20', '2026-02-28', 'pausado', '[TESTE] Contrato pausado — obra pausada');

-- ============================================================
-- 9. LANÇAMENTOS FINANCEIROS
-- ============================================================

-- === OBRA 1 (Reforma Botafogo) — Lançamentos PLANEJADOS (orçamento) ===
INSERT INTO public.lancamento (id_obra, id_grupo_movimento, id_centro_custo, id_plano_conta, id_responsavel, historico, valor, tipo, entrada_saida, data_competencia) VALUES
-- Receita planejada (contrato com cliente)
((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 NULL,
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '1.1'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Contrato de reforma — valor total do cliente', 150000.00, 'planejado', 'entrada', '2026-02-01'),

-- Despesas planejadas por categoria
((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Demolição'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.2.1'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Orçamento mão de obra — demolição', 8000.00, 'planejado', 'saida', '2026-02-01'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Instalação hidráulica'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1.4'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Orçamento materiais hidráulicos', 15000.00, 'planejado', 'saida', '2026-02-01'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Instalação elétrica'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1.3'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Orçamento materiais elétricos', 18000.00, 'planejado', 'saida', '2026-02-01'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Revestimento'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1.7'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Orçamento cerâmica e porcelanato', 22000.00, 'planejado', 'saida', '2026-02-01'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Pintura'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1.6'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Orçamento tintas e acessórios', 9000.00, 'planejado', 'saida', '2026-02-01');

-- === OBRA 1 — Lançamentos REALIZADOS (gastos efetivos) ===
INSERT INTO public.lancamento (id_obra, id_grupo_movimento, id_centro_custo, id_plano_conta, id_fornecedor, id_responsavel, historico, valor, tipo, entrada_saida, forma_pagamento, data_pagamento, data_competencia) VALUES
-- Receita recebida (1ª parcela do cliente)
((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 NULL,
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '1.1'),
 NULL,
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] 1ª parcela recebida do cliente João', 50000.00, 'realizado', 'entrada', 'pix', '2026-02-05', '2026-02-01'),

-- Despesas realizadas
((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Demolição'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.2.1'),
 NULL,
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Pagamento mão de obra demolição — Antônio', 7500.00, 'realizado', 'saida', 'pix', '2026-02-22', '2026-02-22'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Instalação hidráulica'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1.4'),
 (SELECT id_fornecedor FROM public.fornecedor WHERE nome LIKE '[TESTE] HidroTech%'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] NF 4521 — tubos, conexões e registros', 8200.00, 'realizado', 'saida', 'boleto', '2026-03-05', '2026-03-01'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Instalação hidráulica'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.2.2'),
 NULL,
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Empreitada hidráulica — Luiz Encanador (conclusão)', 10000.00, 'realizado', 'saida', 'pix', '2026-03-12', '2026-03-10'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Instalação elétrica'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1.3'),
 (SELECT id_fornecedor FROM public.fornecedor WHERE nome LIKE '[TESTE] EletroForce%'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] NF 7890 — fiação, disjuntores e quadro', 6500.00, 'realizado', 'saida', 'boleto', '2026-03-20', '2026-03-15'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Alvenaria'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1.1'),
 (SELECT id_fornecedor FROM public.fornecedor WHERE nome LIKE '[TESTE] Cimentex%'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] NF 1234 — cimento, areia e tijolos', 4800.00, 'realizado', 'saida', 'boleto', '2026-03-18', '2026-03-15'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Administrativo'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR01'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.4.3'),
 NULL,
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Frete de entulho — caçamba', 1200.00, 'realizado', 'saida', 'dinheiro', '2026-02-21', '2026-02-21');

-- === OBRA 2 (Loja Centro) — Apenas planejados ===
INSERT INTO public.lancamento (id_obra, id_centro_custo, id_plano_conta, id_responsavel, historico, valor, tipo, entrada_saida, data_competencia) VALUES
((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Loja Comercial%'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR02'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '1.1'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Contrato de construção — valor total', 320000.00, 'planejado', 'entrada', '2026-05-01'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Loja Comercial%'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR02'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1.1'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Orçamento geral de materiais', 120000.00, 'planejado', 'saida', '2026-05-01'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Loja Comercial%'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR02'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.2.2'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Orçamento mão de obra total', 95000.00, 'planejado', 'saida', '2026-05-01');

-- === OBRA 3 (Sobrado Catete) — Alguns realizados ===
INSERT INTO public.lancamento (id_obra, id_grupo_movimento, id_centro_custo, id_plano_conta, id_responsavel, historico, valor, tipo, entrada_saida, forma_pagamento, data_pagamento, data_competencia) VALUES
((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Sobrado%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Fundação'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR03'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1.1'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Concreto usinado para fundação — 12m³', 9600.00, 'realizado', 'saida', 'boleto', '2026-02-10', '2026-02-05'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Sobrado%'),
 (SELECT id_grupo FROM public.grupo_movimento WHERE nome = 'Fundação'),
 (SELECT id_centro_custo FROM public.centro_custo WHERE codigo = 'OBR03'),
 (SELECT id_plano FROM public.plano_conta WHERE codigo = '2.1.2'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Maria Financeira'),
 '[TESTE] Aço CA-50 e CA-60 para estacas', 7200.00, 'realizado', 'saida', 'boleto', '2026-02-08', '2026-02-01');

-- ============================================================
-- 10. PARCELAS (para o lançamento da receita do cliente - Obra 1)
-- ============================================================

-- Parcelas da receita planejada (contrato de 150k em 3x)
INSERT INTO public.parcela (id_lancamento, numero, valor, data_vencimento, data_pagamento, status) VALUES
((SELECT id_lancamento FROM public.lancamento WHERE historico = '[TESTE] Contrato de reforma — valor total do cliente'),
 1, 50000.00, '2026-02-05', '2026-02-05', 'pago'),
((SELECT id_lancamento FROM public.lancamento WHERE historico = '[TESTE] Contrato de reforma — valor total do cliente'),
 2, 50000.00, '2026-04-15', NULL, 'pendente'),
((SELECT id_lancamento FROM public.lancamento WHERE historico = '[TESTE] Contrato de reforma — valor total do cliente'),
 3, 50000.00, '2026-07-01', NULL, 'pendente');

-- Parcela do boleto de material hidráulico (vencida!)
INSERT INTO public.parcela (id_lancamento, numero, valor, data_vencimento, data_pagamento, status) VALUES
((SELECT id_lancamento FROM public.lancamento WHERE historico LIKE '[TESTE] NF 4521%'),
 1, 4100.00, '2026-03-05', '2026-03-05', 'pago'),
((SELECT id_lancamento FROM public.lancamento WHERE historico LIKE '[TESTE] NF 4521%'),
 2, 4100.00, '2026-04-05', NULL, 'pendente');

-- Parcela do material elétrico (boleto a vencer)
INSERT INTO public.parcela (id_lancamento, numero, valor, data_vencimento, data_pagamento, status) VALUES
((SELECT id_lancamento FROM public.lancamento WHERE historico LIKE '[TESTE] NF 7890%'),
 1, 3250.00, '2026-03-20', '2026-03-20', 'pago'),
((SELECT id_lancamento FROM public.lancamento WHERE historico LIKE '[TESTE] NF 7890%'),
 2, 3250.00, '2026-04-20', NULL, 'pendente');

-- ============================================================
-- 11. DIÁRIOS DE OBRA (Obra 1)
-- ============================================================
INSERT INTO public.diario_obra (id_obra, id_responsavel, data, conteudo, origem, status_revisao) VALUES
((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Roberto Mestre'),
 '2026-04-07',
 '[TESTE] Equipe realizou instalação de eletrodutos no quarto principal e suite. Antônio iniciou levantamento da parede divisória da cozinha. Paulo auxiliou no transporte de material. Chegou carga de tijolos da Cimentex (1500 un). Sem ocorrências.',
 'manual', 'aprovado'),

((SELECT id_obra FROM public.obra WHERE nome LIKE '[TESTE] Reforma Residencial%'),
 (SELECT id_responsavel FROM public.responsavel WHERE nome = '[TESTE] Roberto Mestre'),
 '2026-04-08',
 '[TESTE] José continuou a passagem de fiação na sala e corredor. Antônio avançou na alvenaria da cozinha — falta apenas o respaldo. Paulo fez limpeza e organização do canteiro. Tempo bom, sem chuva.',
 'manual', 'pendente');

COMMIT;

-- ============================================================
-- ============================================================
-- BLOCO DE CLEANUP — Execute abaixo para REMOVER todos os dados de teste
-- ============================================================
-- ============================================================
/*

BEGIN;

-- Ordem inversa das dependências (filhos antes dos pais)
DELETE FROM public.presenca WHERE id_contrato IN (SELECT id_contrato FROM public.contrato_trabalho WHERE observacoes LIKE '[TESTE]%');
DELETE FROM public.escala WHERE id_contrato IN (SELECT id_contrato FROM public.contrato_trabalho WHERE observacoes LIKE '[TESTE]%');
DELETE FROM public.parcela WHERE id_lancamento IN (SELECT id_lancamento FROM public.lancamento WHERE historico LIKE '[TESTE]%');
DELETE FROM public.lancamento WHERE historico LIKE '[TESTE]%';
DELETE FROM public.diario_obra WHERE conteudo LIKE '[TESTE]%';
DELETE FROM public.documento WHERE nome LIKE '[TESTE]%';
DELETE FROM public.contrato_trabalho WHERE observacoes LIKE '[TESTE]%';
DELETE FROM public.tarefa WHERE nome LIKE '[TESTE]%';
DELETE FROM public.obra WHERE nome LIKE '[TESTE]%';
DELETE FROM public.trabalhador WHERE nome LIKE '[TESTE]%';
DELETE FROM public.fornecedor WHERE nome LIKE '[TESTE]%';
DELETE FROM public.responsavel WHERE nome LIKE '[TESTE]%';
DELETE FROM public.cliente WHERE nome LIKE '[TESTE]%' OR observacoes LIKE 'Cliente%fictício%';
DELETE FROM public.centro_custo WHERE codigo IN ('OBR01', 'OBR02', 'OBR03');

COMMIT;

*/
