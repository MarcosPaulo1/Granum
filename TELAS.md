# Mapa de Telas — Sistema de Gestão de Obras

## Resumo: 28 telas em 7 módulos

---

## MÓDULO 1: CADASTROS BASE (6 telas)

### T01 — Listagem de clientes
- **Rota**: `/clientes`
- **Tipo**: listagem
- **Tabela**: `cliente`
- **Campos na tabela**: nome, cpf_cnpj, telefone, email, quantidade de obras (count)
- **Filtros**: busca por nome, busca por CPF/CNPJ
- **Ações**: botão "Novo cliente" (abre modal/form), clique na linha abre perfil
- **Acesso**: diretor, arquiteta, financeiro

### T02 — Perfil do cliente
- **Rota**: `/clientes/[id]`
- **Tipo**: detalhe
- **Tabelas**: `cliente` + `obra` (JOIN)
- **Seções**:
  - Header: nome, cpf_cnpj, telefone, email, endereço (editável inline ou modal)
  - Lista de obras: nome da obra, status (badge), data início, % concluída
- **Ações**: editar dados, criar nova obra para este cliente, clicar obra vai pra `/obras/[id]`
- **Acesso**: diretor, arquiteta

### T03 — Listagem de fornecedores
- **Rota**: `/fornecedores`
- **Tipo**: listagem
- **Tabela**: `fornecedor`
- **Campos**: nome, cnpj, tipo, contato, email, ativo (badge)
- **Filtros**: busca por nome, busca por CNPJ, filtro por tipo
- **Ações**: novo fornecedor, editar, desativar
- **Acesso**: diretor, financeiro

### T04 — Perfil do fornecedor
- **Rota**: `/fornecedores/[id]`
- **Tipo**: detalhe
- **Tabelas**: `fornecedor` + `lancamento` (JOIN)
- **Seções**:
  - Header: cnpj, nome, email, contato, tipo, observações
  - KPI: total já pago (sum de lançamentos realizados)
  - Lista de lançamentos: data, obra, histórico, valor
- **Acesso**: diretor, financeiro

### T05 — Listagem de responsáveis
- **Rota**: `/responsaveis`
- **Tipo**: listagem
- **Tabela**: `responsavel` + `perfil` (JOIN)
- **Campos**: nome, cargo, departamento, perfil (badge colorido), email, ativo
- **Filtros**: por perfil, por departamento, ativo/inativo
- **Ações**: criar (somente diretor), editar, vincular perfil
- **Acesso**: diretor

### T06 — Perfil do responsável
- **Rota**: `/responsaveis/[id]`
- **Tipo**: detalhe
- **Tabelas**: `responsavel` + `perfil` + `obra` + `tarefa` (JOINs)
- **Seções**:
  - Header: nome, cargo, perfil, email, telefone, data admissão
  - Obras atribuídas: lista de obras onde é responsável
  - Tarefas: lista de tarefas atribuídas com status
- **Acesso**: diretor

---

## MÓDULO 2: OBRAS E PLANEJAMENTO (5 telas)

### T07 — Listagem de obras
- **Rota**: `/obras`
- **Tipo**: listagem
- **Tabela**: `obra` + `cliente` + `responsavel` (JOINs)
- **Campos**: nome, cliente, status (badge com cor), % concluída (progress bar), responsável, data início, data fim prevista
- **Filtros**: por status (planejamento, em_andamento, pausada, concluida), por cliente, por responsável
- **Ações**: criar nova obra
- **Acesso**: diretor vê todas; engenheiro/mestre vê só as suas (RLS)
- **Nota**: esta é a tela de entrada principal para a maioria dos usuários

### T08 — Painel da obra (HUB PRINCIPAL)
- **Rota**: `/obras/[id]`
- **Tipo**: detalhe com abas
- **Nota**: ESTA É A TELA MAIS IMPORTANTE DO SISTEMA. Tudo converge aqui.
- **Header**: nome da obra, cliente, status, % concluída, responsável, datas
- **Abas**:
  - **Resumo**: cards KPI (total planejado, total realizado, variação, nº tarefas, nº trabalhadores), mini curva S, próximas tarefas
  - **Tarefas**: link para `/obras/[id]/tarefas`
  - **Equipe**: link para `/obras/[id]/equipe` (escala semanal)
  - **Financeiro**: últimos lançamentos, total receita/despesa. Link para lançamentos completos
  - **Documentos**: link para `/obras/[id]/documentos`
  - **Diários**: link para `/obras/[id]/diarios`
- **Ações**: editar obra, mudar status, adicionar tarefa rápida
- **Acesso**: todos (filtrado por RLS)

### T09 — Formulário de obra
- **Rota**: modal ou `/obras/nova`
- **Tipo**: formulário
- **Campos obrigatórios**: nome*, cliente* (select com busca), centro_custo* (select), responsavel* (select)
- **Campos opcionais**: data_inicio_prevista, data_fim_prevista, endereco, descricao
- **Lógica**: ao criar, status = 'planejamento'. Centro de custo pode ser criado on-the-fly
- **Acesso**: diretor, arquiteta

### T10 — Tarefas da obra (cronograma)
- **Rota**: `/obras/[id]/tarefas`
- **Tipo**: listagem com visual de timeline
- **Tabela**: `tarefa` + `etapa` + `responsavel` (JOINs)
- **Campos**: nome, etapa (badge), data início/fim, % concluído (progress), responsável, orçamento previsto, status
- **Visual**: idealmente um Gantt simplificado OU lista cronológica com barras de duração
- **Filtros**: por etapa, por status, por responsável
- **Ações**: criar tarefa, editar inline (% e status), reordenar, marcar concluída
- **Acesso**: diretor, engenheiro (da obra)

### T11 — Documentos da obra
- **Rota**: `/obras/[id]/documentos`
- **Tipo**: listagem
- **Tabela**: `documento`
- **Campos**: nome, tipo (badge: projeto/foto/transcricao/orcamento/relatorio), data criação, responsável, link SharePoint
- **Filtros**: por tipo
- **Ações**: adicionar documento (upload de referência com URL do SharePoint), abrir link externo
- **Acesso**: todos (filtrado por RLS da obra)

---

## MÓDULO 3: MÃO DE OBRA (4 telas)

### T12 — Listagem de trabalhadores
- **Rota**: `/trabalhadores`
- **Tipo**: listagem
- **Tabela**: `trabalhador`
- **Campos**: nome, cpf, especialidade (badge), tipo vínculo, telefone, ativo
- **Filtros**: por especialidade, ativo/inativo
- **Ações**: criar novo, editar, ver perfil
- **Acesso**: diretor, engenheiro, mestre_obra

### T13 — Perfil do trabalhador
- **Rota**: `/trabalhadores/[id]`
- **Tipo**: detalhe
- **Tabelas**: `trabalhador` + `contrato_trabalho` + `presenca` + `obra` (JOINs)
- **Seções**:
  - Header: nome, cpf, telefone, especialidade, pix, tipo vínculo
  - Contratos ativos: lista com obra, tipo pagamento, valor, período, status
  - Presenças da semana: dias trabalhados, faltas, total a receber
  - Histórico: resumo de pagamentos anteriores
- **Acesso**: diretor, engenheiro, financeiro

### T14 — Escala semanal
- **Rota**: `/obras/[id]/equipe`
- **Tipo**: grid interativo
- **Tabelas**: `escala` + `trabalhador` + `contrato_trabalho` (JOINs)
- **Visual**: GRID/MATRIX
  - Linhas = trabalhadores com contrato ativo na obra
  - Colunas = dias da semana (seg a sáb)
  - Células: vazia (cinza), planejado (azul), confirmado (azul escuro), cancelado (risco)
  - Mostrar especialidade e valor da diária em cada linha
- **Filtros**: seletor de semana (anterior/próxima)
- **Ações**: clicar célula vazia → escalar trabalhador. Clicar célula cheia → cancelar/confirmar
- **Alertas**: highlight quando tarefa ativa precisa de especialidade sem ninguém escalado
- **Totalizador**: custo previsto do dia (soma das diárias dos escalados)
- **Acesso**: diretor, engenheiro (da obra)

### T15 — Contratos de trabalho
- **Rota**: `/trabalhadores/contratos` ou dentro do perfil do trabalhador
- **Tipo**: listagem
- **Tabela**: `contrato_trabalho` + `trabalhador` + `obra` (JOINs)
- **Campos**: trabalhador, obra, tipo_pagamento (badge), valor_acordado, período, status (badge)
- **Filtros**: por obra, por status, por tipo pagamento
- **Ações**: criar contrato (formulário com: trabalhador, obra, tarefa opcional, tipo, valor, datas), editar, encerrar
- **Acesso**: diretor, engenheiro

---

## MÓDULO 4: OPERAÇÃO DIÁRIA (4 telas)

### T16 — Formulário de diário de obra
- **Rota**: `/obras/[id]/diarios/novo`
- **Tipo**: formulário composto (diário + presenças juntos)
- **NOTA**: Esta tela registra o diário E as presenças num único submit.
- **Campos do diário**: data (default: hoje), conteúdo (textarea grande), origem (select: manual/whatsapp/plaud)
- **Sub-seção presenças**: lista automática de trabalhadores escalados pro dia
  - Cada linha: nome, especialidade, tipo contrato, valor diária
  - Dropdown: integral / meia / falta / falta_justificada
  - Campo observação (opcional)
  - Valor calculado automaticamente: integral = valor_acordado, meia = valor/2, falta = 0
- **Validação**: conteúdo obrigatório, pelo menos 1 presença registrada
- **Ao salvar**: cria diario_obra + N registros em presença (batch insert)
- **Acesso**: engenheiro, mestre_obra (da obra)

### T17 — Histórico de diários
- **Rota**: `/obras/[id]/diarios`
- **Tipo**: listagem
- **Tabela**: `diario_obra`
- **Campos**: data, origem (badge), status_revisao (badge: pendente=amarelo, aprovado=verde, rejeitado=vermelho), resumo do conteúdo (truncado), responsável
- **Filtros**: por período, por status revisão
- **Ações**: ver diário completo, aprovar (diretor), rejeitar (diretor)
- **Acesso**: diretor (aprova), engenheiro (vê da obra)

### T18 — Registro de presença (standalone)
- **Rota**: parte do T16, mas pode ser acessada separadamente
- **Tipo**: formulário
- **Nota**: Se o diário do dia já existe, esta tela permite ajustar presenças sem reescrever o diário
- **Acesso**: engenheiro, mestre_obra

### T19 — Check de tarefas do dia
- **Rota**: `/obras/[id]/tarefas` (com filtro "hoje" ativo)
- **Tipo**: formulário inline
- **Visual**: lista das tarefas ativas da obra com:
  - Nome da tarefa
  - Etapa
  - Slider de % concluído (arrasta pra atualizar)
  - Botão "Marcar concluída"
  - Campo de observação rápida
- **Acesso**: engenheiro, mestre_obra

---

## MÓDULO 5: FINANCEIRO (4 telas)

### T20 — Listagem de lançamentos
- **Rota**: `/financeiro/lancamentos`
- **Tipo**: listagem
- **Tabela**: `lancamento` + `obra` + `fornecedor` + `plano_conta` + `centro_custo` (JOINs)
- **Campos**: data_competencia, obra, histórico (truncado), valor (formatado R$), tipo (badge: planejado/realizado), entrada_saida (badge: verde/vermelho), fornecedor, centro_custo
- **Filtros**: por obra, período, tipo, entrada/saída, centro custo, plano contas, fornecedor
- **Totalizadores**: soma entradas, soma saídas, saldo
- **Ações**: criar novo lançamento, editar, ver detalhes
- **Acesso**: diretor, financeiro

### T21 — Formulário de lançamento
- **Rota**: modal ou `/financeiro/lancamentos/novo`
- **Tipo**: formulário complexo
- **Campos OBRIGATÓRIOS**: obra* (select), centro_custo* (select), responsavel* (auto: logado), valor*, tipo* (planejado/realizado), entrada_saida* (entrada/saída), data_competencia*
- **Campos opcionais**: tarefa (select filtrado pela obra selecionada), grupo_movimento (select), plano_conta (select hierárquico — tree dropdown), fornecedor (select com busca por CNPJ), forma_pagamento, data_pagamento, historico (textarea)
- **Sub-seção "Parcelamento"**: toggle "Pagamento parcelado?"
  - Se sim: número de parcelas, valor da 1ª parcela, data 1º vencimento
  - Gera automaticamente N registros em `parcela` com vencimentos mensais
  - Preview das parcelas antes de confirmar
- **Validações**: valor > 0, centro_custo obrigatório, data_competencia obrigatória
- **Acesso**: diretor, financeiro

### T22 — Contas a pagar/receber
- **Rota**: `/financeiro/contas`
- **Tipo**: listagem
- **View**: `vw_contas_a_pagar`
- **Campos**: fornecedor, obra, histórico, valor parcela, data vencimento, dias para vencer, status_real (badge)
- **Filtros**: por status (pendente/atrasado), por obra, por período, por fornecedor
- **Visual**: parcelas atrasadas no topo com destaque vermelho
- **Ações**: marcar como pago (preenche data_pagamento, muda status para 'pago'), ver lançamento original
- **Acesso**: diretor, financeiro

### T23 — Plano de contas
- **Rota**: `/financeiro/plano-contas`
- **Tipo**: árvore hierárquica (tree view)
- **Tabela**: `plano_conta` (auto-referência id_pai)
- **Visual**: árvore expansível
  - 1 Receitas
    - 1.1 Receita de obras (analítica)
  - 2 Despesas
    - 2.1 Materiais
      - 2.1.1 Cimento e argamassa (analítica)
      - ...
- **Campos**: código, nome, tipo, analítica (badge)
- **Ações**: criar conta (informar pai), editar, reorganizar
- **Acesso**: diretor, financeiro

---

## MÓDULO 6: RELATÓRIOS E DASHBOARDS (3 telas)

### T24 — Dashboard financeiro
- **Rota**: `/dashboards/financeiro`
- **Tipo**: dashboard com gráficos
- **View**: `vw_curva_s_financeira` + agregações de `lancamento`
- **Componentes**:
  - Seletor de obra (obrigatório) + seletor de período
  - Cards KPI: total planejado, total realizado, variação %, saldo
  - Gráfico Curva S: duas linhas (planejado acumulado vs realizado acumulado) no eixo tempo
  - Gráfico barras: receita vs despesa por mês
  - Gráfico pizza/donut: distribuição de gastos por plano de contas
- **Biblioteca de gráficos**: Recharts
- **Acesso**: diretor, financeiro

### T25 — Painel de alocação de equipe
- **Rota**: `/dashboards/alocacao`
- **Tipo**: dashboard grid
- **View**: `vw_alocacao_diaria`
- **Visual**: MATRIX COLORIDA
  - Linhas = trabalhadores
  - Colunas = dias da semana
  - Cores: verde (presente), azul (escalado/futuro), vermelho (falta), cinza (sem escala), amarelo (falta justificada)
- **Métricas**: total trabalhadores/dia, custo diário de mão de obra, taxa de presença (%)
- **Alertas**: destaque quando tarefa ativa não tem profissional da especialidade escalado
- **Filtros**: por obra, por semana, por especialidade
- **Acesso**: diretor, engenheiro (da obra)

### T26 — Folha de pagamento semanal
- **Rota**: `/financeiro/folha`
- **Tipo**: relatório tabular
- **View**: `vw_resumo_pagamento_semanal`
- **Campos**: trabalhador, obra, dias integral, dias meia, faltas, total a pagar (R$), chave pix
- **Totalizadores**: total geral da semana, subtotal por obra
- **Filtros**: seletor de semana, por obra
- **Ações**: aprovar folha (muda status interno), exportar CSV, gerar lançamentos automáticos (cria 1 lançamento por trabalhador na tabela lancamento, plano_conta = '2.2.1 Diárias')
- **Acesso**: diretor, financeiro

---

## MÓDULO 7: SISTEMA (2 telas)

### T27 — Configurações
- **Rota**: `/configuracoes`
- **Tipo**: formulário com tabs
- **Tabs**:
  - **Perfis de acesso**: CRUD de perfis com campo JSON de permissões
  - **Etapas padrão**: lista ordenável (drag) de etapas de obra
  - **Grupos de movimento**: CRUD simples (nome + descrição)
  - **Centros de custo**: CRUD simples (código + nome + descrição)
- **Acesso**: apenas diretor

### T28 — Integrações
- **Rota**: `/integracoes`
- **Tipo**: painel de status + configuração
- **Seções**:
  - **n8n**: URL do n8n, status (online/offline verificado por ping), link para abrir dashboard n8n. Lista dos 6 workflows com status (ativo/inativo) e última execução
  - **Claude API**: status da API key (válida/inválida), contagem de tokens usados no mês, link para configurar prompts
  - **SharePoint**: status da conexão Microsoft Graph, pasta raiz configurada
  - **WhatsApp Bot**: URL do webhook, último áudio recebido, números reconhecidos
  - **Supabase**: URL do projeto, status do banco, contagem de usuários ativos
- **Ações**: testar conexão de cada integração, copiar webhook URLs, configurar API keys
- **Acesso**: diretor
- **NOTA**: Esta tela NÃO executa as integrações — ela mostra o status e provê os dados necessários para configurar o n8n separadamente

---

## COMPONENTES COMPARTILHADOS (usar em múltiplas telas)

### Sidebar
- Navegação principal, colapsável em mobile
- Itens filtrados por perfil do usuário

### Header
- Breadcrumb, nome do usuário, botão logout, notificações

### ObraSelector
- Select de obra usado em contextos que precisam filtrar por obra (lançamentos, diários, escala)
- Engenheiro/mestre vê só suas obras; diretor/financeiro vê todas

### DataTable
- Componente base reutilizável: paginação, busca, filtros, ordenação, loading skeleton
- Usado em TODAS as telas de listagem

### StatusBadge
- Badge colorido para status: planejamento (cinza), em_andamento (azul), pausada (amarelo), concluida (verde), cancelada (vermelho)

### ProgressBar
- Barra de progresso para % concluída (0-100), com cor variável

### RoleGuard
- Wrapper que esconde conteúdo baseado no perfil: `<RoleGuard roles={['diretor', 'financeiro']}>...</RoleGuard>`

### ConfirmDialog
- Modal de confirmação antes de ações destrutivas (deletar, cancelar, encerrar)

### FormatUtils
- Formatação BR: moeda (R$ 1.234,56), data (DD/MM/AAAA), CPF (xxx.xxx.xxx-xx), CNPJ (xx.xxx.xxx/xxxx-xx)
