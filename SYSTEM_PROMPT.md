# Sistema de Gestão de Obras — Instrução de Projeto para Claude Code

## LEIA ISTO PRIMEIRO

Este é o documento mestre do projeto. Antes de escrever qualquer código, leia TODOS os arquivos nesta pasta:

- `SYSTEM_PROMPT.md` — Este arquivo. Contexto, regras, stack, comportamento.
- `SCHEMA.sql` — Banco de dados completo. Execute no Supabase.
- `TELAS.md` — Mapa de todas as 28 telas com campos, ações e permissões.
- `INTEGRACOES.md` — Endpoints, webhooks, n8n, Claude API, SharePoint.
- `RLS_POLICIES.sql` — Row Level Security policies para Supabase.
- `DESIGN_SYSTEM.md` — Padrões visuais, componentes, cores, tipografia.

---

## CONTEXTO DO PROJETO

### O que é
Sistema web de gestão integrada de obras de construção civil para uma empresa de arquitetura e engenharia no Brasil. Controla:
- **Parte física**: obras, etapas, tarefas, cronograma, diários de obra
- **Parte financeira**: lançamentos, parcelas, plano de contas, centros de custo, curva S
- **Mão de obra**: contratos, escala diária, presença, folha de pagamento semanal
- **Documentos**: projetos, fotos, transcrições, relatórios (SharePoint)
- **Automações**: notificações, diários por IA, relatórios semanais (n8n)

### Para quem
Usuários internos da empresa: diretor, engenheiros, arquiteta, financeiro, mestre de obra.
Acessam via navegador (desktop e celular no campo).
Quantidade inicial: 5-15 usuários.

---

## STACK TECNOLÓGICO

| Componente | Tecnologia | Função |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + React + TypeScript | Interface de usuário |
| Componentes UI | shadcn/ui + Tailwind CSS + 21st.dev | Componentes visuais |
| Backend/Auth | Supabase (Auth + PostgreSQL + RLS + Realtime) | Autenticação, banco, autorização |
| Automações | n8n (self-hosted Docker) | Fluxos automatizados, webhooks |
| IA | Claude API (Sonnet) | Orçamentos, diários, relatórios |
| Documentos | SharePoint (Microsoft Graph API) | Armazenamento de arquivos |
| Deploy | VPS Hostinger 8GB RAM / 100GB SSD | Servidor de produção |

### Estrutura do projeto Next.js
```
gestao-obras/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                 # Sidebar + header + auth guard
│   │   ├── page.tsx                   # Redirect para /obras
│   │   ├── clientes/
│   │   │   ├── page.tsx               # Listagem
│   │   │   └── [id]/page.tsx          # Perfil do cliente
│   │   ├── fornecedores/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── trabalhadores/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── responsaveis/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── obras/
│   │   │   ├── page.tsx               # Listagem de obras
│   │   │   └── [id]/
│   │   │       ├── page.tsx           # Painel da obra (hub com abas)
│   │   │       ├── tarefas/page.tsx   # Cronograma/Gantt
│   │   │       ├── equipe/page.tsx    # Escala semanal
│   │   │       ├── diarios/page.tsx   # Histórico de diários
│   │   │       ├── diarios/novo/page.tsx  # Formulário diário + presença
│   │   │       ├── documentos/page.tsx
│   │   │       ├── lancamentos/page.tsx
│   │   │       └── lancamentos/novo/page.tsx
│   │   ├── financeiro/
│   │   │   ├── lancamentos/page.tsx   # Todos os lançamentos (cross-obra)
│   │   │   ├── contas/page.tsx        # Contas a pagar/receber
│   │   │   ├── plano-contas/page.tsx  # Árvore hierárquica
│   │   │   └── folha/page.tsx         # Folha de pagamento semanal
│   │   ├── dashboards/
│   │   │   ├── financeiro/page.tsx    # Curva S, receita x despesa
│   │   │   └── alocacao/page.tsx      # Grid trabalhador x dia
│   │   ├── configuracoes/page.tsx     # Perfis, etapas, grupos, centros
│   │   └── integracoes/page.tsx       # Status n8n, webhooks, Claude API
│   └── api/
│       ├── webhooks/
│       │   ├── n8n/route.ts           # Receber dados do n8n
│       │   └── whatsapp/route.ts      # Receber áudios transcritos
│       ├── claude/
│       │   ├── orcamento/route.ts     # Gerar orçamento
│       │   ├── diario/route.ts        # Gerar diário de obra
│       │   └── relatorio/route.ts     # Gerar relatório semanal
│       └── cron/
│           └── parcelas/route.ts      # Atualizar parcelas atrasadas
├── components/
│   ├── ui/                            # shadcn/ui components
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── breadcrumb.tsx
│   ├── forms/
│   │   ├── lancamento-form.tsx
│   │   ├── obra-form.tsx
│   │   ├── tarefa-form.tsx
│   │   ├── contrato-form.tsx
│   │   └── presenca-form.tsx
│   ├── tables/
│   │   ├── data-table.tsx             # Componente base reutilizável
│   │   ├── columns/                   # Definições de colunas por entidade
│   │   └── filters/                   # Componentes de filtro
│   ├── charts/
│   │   ├── curva-s.tsx
│   │   ├── receita-despesa.tsx
│   │   └── distribuicao-gastos.tsx
│   └── shared/
│       ├── obra-selector.tsx          # Select de obra (usado em muitas telas)
│       ├── status-badge.tsx
│       ├── progress-bar.tsx
│       ├── role-guard.tsx             # Componente que esconde conteúdo por perfil
│       └── loading-skeleton.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Cliente browser
│   │   ├── server.ts                  # Cliente server-side
│   │   ├── middleware.ts              # Auth middleware
│   │   └── types.ts                   # Types gerados do schema
│   ├── hooks/
│   │   ├── use-user.ts                # Hook do usuário logado + role
│   │   ├── use-obra.ts                # Hook de contexto da obra ativa
│   │   └── use-realtime.ts            # Supabase realtime subscriptions
│   ├── utils/
│   │   ├── format.ts                  # Formatação BR (moeda, data, CPF, CNPJ)
│   │   ├── validators.ts             # Validações de formulário
│   │   └── permissions.ts            # Checagem de permissões por role
│   └── constants.ts                   # Enums de status, tipos, turnos
├── middleware.ts                      # Supabase Auth + redirect
└── .env.local                         # Supabase URL + keys
```

---

## REGRAS DE DESENVOLVIMENTO

### Gerais
- **Idioma do código**: variáveis, funções e componentes em inglês. Labels, textos e mensagens de UI em português BR.
- **TypeScript strict**: sem `any`. Gerar types do Supabase com `supabase gen types typescript`.
- **Server Components por padrão**. Use `'use client'` só quando precisar de interatividade.
- **Formatação brasileira**: datas em DD/MM/AAAA, moeda em R$ 1.234,56, CPF com pontos, CNPJ formatado.
- **Mobile-first**: todas as telas devem funcionar em celular. Engenheiros acessam do campo.
- **Validação dupla**: no frontend (form validation) E no backend (RLS + check constraints).

### Supabase
- Toda query usa o Supabase client, nunca SQL direto do frontend.
- RLS está ativo em TODAS as tabelas. Sem RLS = sem acesso.
- O campo `auth_user_id` na tabela `responsavel` vincula login à pessoa.
- Após login, buscar o `responsavel` vinculado para obter id_perfil e role.
- Armazenar role no JWT via Auth Hook (ver RLS_POLICIES.sql).

### Componentes UI
- Usar shadcn/ui como base. Customizar cores/espaçamento via Tailwind.
- Toda tabela de listagem usa o componente `data-table.tsx` reutilizável com: paginação, busca, filtros, ordenação.
- Formulários usam react-hook-form + zod para validação.
- Modais de confirmação antes de deletar qualquer coisa.
- Loading skeletons em toda tela que busca dados.

### Padrão de CRUD (repetir para cada entidade)
Cada entidade segue o mesmo padrão:
1. **Listagem** (`page.tsx`): tabela com busca, filtros, paginação. Botão "Novo" no topo.
2. **Perfil/Detalhe** (`[id]/page.tsx`): dados da entidade + relacionamentos. Botão "Editar".
3. **Formulário** (modal ou página): campos com validação, selects com busca, campos obrigatórios marcados.
4. **Delete**: soft-delete quando possível (campo `ativo`), hard-delete só em rascunhos.

---

## PERMISSÕES POR PERFIL (RBAC)

| Funcionalidade | Diretor | Engenheiro | Financeiro | Arquiteta | Mestre Obra |
|---|---|---|---|---|---|
| Ver todas as obras | ✅ | ❌ só suas | ✅ | ✅ | ❌ só suas |
| Criar/editar obra | ✅ | ❌ | ❌ | ✅ | ❌ |
| Ver lançamentos | ✅ | ❌ | ✅ | ❌ | ❌ |
| Criar lançamento | ✅ | ❌ | ✅ | ❌ | ❌ |
| Criar/editar tarefa | ✅ | ✅ sua obra | ❌ | ❌ | ❌ |
| Registrar diário | ✅ | ✅ sua obra | ❌ | ❌ | ✅ sua obra |
| Aprovar diário | ✅ | ❌ | ❌ | ❌ | ❌ |
| Registrar presença | ✅ | ✅ sua obra | ❌ | ❌ | ✅ sua obra |
| Ver folha pagamento | ✅ | ❌ | ✅ | ❌ | ❌ |
| Aprovar folha | ✅ | ❌ | ✅ | ❌ | ❌ |
| Gerenciar cadastros | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configurações | ✅ | ❌ | ❌ | ❌ | ❌ |
| Montar escala | ✅ | ✅ sua obra | ❌ | ❌ | ❌ |
| Gerenciar documentos | ✅ | ✅ sua obra | ❌ | ✅ | ❌ |
| Dashboards financeiro | ✅ | ❌ | ✅ | ❌ | ❌ |
| Painel alocação | ✅ | ✅ sua obra | ❌ | ❌ | ❌ |

---

## SIDEBAR / NAVEGAÇÃO

```
📊 Dashboard
📋 Obras
👤 Clientes
🏗️ Trabalhadores
   └── Contratos
   └── Escala
👔 Responsáveis
🏢 Fornecedores
💰 Financeiro
   └── Lançamentos
   └── Contas a pagar
   └── Plano de contas
   └── Folha de pagamento
📈 Relatórios
   └── Dashboard financeiro
   └── Painel de alocação
⚙️ Configurações
🔗 Integrações
```

Itens da sidebar são filtrados por perfil. Engenheiro não vê "Financeiro". Mestre de obra vê só "Obras" e "Trabalhadores".

---

## REGRAS DE NEGÓCIO CRÍTICAS

Estas regras devem ser implementadas TANTO no frontend (validação) QUANTO no backend (RLS/constraints):

1. **Lançamento sem centro_custo → REJEITAR**
2. **Lançamento sem responsavel → REJEITAR**
3. **Diário gerado por IA → status_revisao = 'pendente' (nunca 'aprovado' direto)**
4. **Trabalhador não pode estar escalado em 2 obras no mesmo dia/turno** (UNIQUE constraint)
5. **Presença só em diário da mesma obra do contrato ativo**
6. **Valor da presença: integral = valor_acordado; meia = valor_acordado / 2**
7. **Parcela atrasada = vencimento < hoje AND status = 'pendente'** (cron atualiza diariamente)
8. **Lançamento pode existir sem tarefa (custos adm), mas NUNCA sem centro_custo**
9. **Ao criar obra, vincular automaticamente ao centro_custo selecionado**
10. **Ao encerrar contrato de trabalho, cancelar escalas futuras vinculadas**

---

## ALERTAS RECORRENTES

Ao desenvolver, lembrar:

- **Backup**: O Supabase cloud faz backup automático. Se self-hosted, configurar pg_dump.
- **SSL**: Supabase cloud já é HTTPS. VPS com n8n precisa de Nginx + Let's Encrypt.
- **Firewall VPS**: Só portas 80, 443 e SSH customizada abertas. n8n se comunica internamente.
- **Variáveis de ambiente**: Supabase URL, anon key, service role key NUNCA no código. Sempre .env.local.
- **Testar mobile**: Cada tela nova, testar em viewport de celular antes de prosseguir.
