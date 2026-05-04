# Granum — Sistema de Gestao de Obras

## Design system (white-label com acento Granum)

**Decisao de paleta (2026-05-04):** apos handoff do Claude Design, decidimos abandonar a aplicacao integral da identidade visual da Nathalia Ferreira Studio (terracota/azul-escuro/verde-oliva) porque os graficos ficavam dificeis de ler. O sistema agora e **white-label** com excecao da sidebar e da logo.

### Tokens (em `app/globals.css`)

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `#4F46E5` (Indigo-600) | CTAs, links, foco |
| `--background` | `#F8FAFC` (Slate-50) | Fundo do app |
| `--foreground` | `#0F172A` (Slate-900) | Texto primario |
| `--muted-foreground` | `#475569` (Slate-600) | Texto secundario |
| `--border` | `#E2E8F0` (Slate-200) | Bordas suaves |
| `--input` | `#CBD5E1` (Slate-300) | Bordas de input |
| `--sidebar` | `#5B6A7A` (**Granum azul-escuro**) | **Excecao branding na sidebar** |
| `--sidebar-foreground` | `#F1F5F9` | Texto da sidebar |
| `--sidebar-primary` | `#4F46E5` | Barra lateral do item ativo |
| `--success` / `--warning` / `--info` | Emerald / Amber / Blue | Badges de status |
| `--chart-1` ... `--chart-5` | Terracota, Verde-oliva, Indigo, Amber, Blue | **Series de grafico — preservam acento da marca** |
| `--granum-azul` / `--granum-terracota` / `--granum-verde-oliva` / `--granum-bege` | Marca | Acentos pontuais |

### Logos
- `public/granum-logo-branco.png` — sidebar (sobre `#5B6A7A`)
- `public/granum-logo-bege.png` — alternativa
- `public/granum-simbolo-branco.png` — favicon/compacto

### Fonte
- **Body**: Inter (via `next/font/google`, var `--font-sans`)
- **Mono**: Geist Mono (var `--font-mono`, valores monetarios use classe `.mono` ou `font-mono`)
- Fontes de marca (Zen Kaku Gothic New, Oooh Baby) **nao sao usadas** no app — fazem parte do material da marca, nao do produto.

### Regras
- Acessar paleta via classes Tailwind dos tokens: `bg-primary`, `text-muted-foreground`, `border-border`, `bg-success-soft`, `text-success-ink`, `bg-sidebar`, etc.
- **Nunca** hardcodar hex de cor em componentes — usar token.
- **Nao** usar `text-blue-700`, `bg-blue-50` (pre-tokens) em codigo novo. Fase 1 vai migrar os pendentes.
- Para acentos da marca em chart Recharts: `var(--chart-1)` (terracota) e `var(--chart-2)` (verde-oliva).
- Tabular numerics em valores monetarios: classe `.mono` ou `tabular` (ja aplicada por base) ou utility `font-mono`.

---

## Leia antes de codar

Leia TODOS os docs de spec antes de implementar qualquer feature nova:
- `SYSTEM_PROMPT.md` — Contexto, regras, stack, comportamento, RBAC, regras de negocio
- `SCHEMA.sql` — Banco de dados v1 (tabelas core)
- `PATCH_V2.sql` — Banco de dados v2 (pendencias, inspecoes, fotos, notificacoes, auditoria, orcamentos)
- `TELAS.md` — Mapa de todas as 28 telas com campos, acoes e permissoes
- `INTEGRACOES.md` — Endpoints, webhooks, n8n, Claude API, SharePoint
- `RLS_POLICIES.sql` — Row Level Security policies para Supabase
- `DESIGN_SYSTEM.md` — Padroes visuais, componentes, cores, tipografia

---

## Stack (decisoes fechadas — nao discutir)

| Componente | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript strict |
| UI | shadcn/ui + Tailwind CSS 4 + Lucide React |
| Backend/Auth | Supabase (Auth + PostgreSQL + RLS + Realtime) |
| Graficos | Recharts |
| Forms | react-hook-form + zod |
| Tabelas | @tanstack/react-table |
| Deploy | Vercel |

---

## Convencoes de nomenclatura

- **Arquivos**: kebab-case (`lancamento-form.tsx`, `data-table.tsx`)
- **Componentes React**: PascalCase (`LancamentoForm`, `DataTable`)
- **Variaveis/funcoes**: camelCase (`loadObras`, `formatBRL`)
- **Tabelas DB**: snake_case (`contrato_trabalho`, `diario_obra`)
- **Constantes/enums**: UPPER_SNAKE_CASE (`OBRA_STATUS`, `TAREFA_STATUS`)
- **Codigo**: ingles. **UI (labels, textos, mensagens)**: portugues BR
- **Server Components por padrao**. Usar `'use client'` so quando precisar de interatividade (hooks, eventos)

---

## Padrao de erros — OBRIGATORIO

- **Feedback ao usuario**: sempre `toast.success()` ou `toast.error()` via sonner
- **Nunca** `alert()`, `window.alert()`, ou `console.error` silencioso sem feedback
- **Pattern**: `const { error } = await supabase...` → `if (error) { toast.error("Erro: " + error.message); return }`
- **Loading**: botao com spinner durante submit, desabilitado ate validacao passar
- **Confirmacao**: usar `<ConfirmDialog>` antes de acoes destrutivas (deletar, cancelar, encerrar)

---

## Componentes existentes — USAR antes de criar novos

### Tabelas de listagem
```tsx
import { DataTable } from "@/components/tables/data-table"
// Props: columns, data, searchKey, searchPlaceholder, isLoading, onRowClick, emptyMessage, pageSize, toolbar
// Inclui: paginacao, busca, ordenacao, loading skeleton, empty state
```

### Status/badges
```tsx
import { StatusBadge } from "@/components/shared/status-badge"
import { OBRA_STATUS, TAREFA_STATUS } from "@/lib/constants"
<StatusBadge status={row.status} statusMap={OBRA_STATUS} />
```

### Progresso
```tsx
import { ProgressBar } from "@/components/shared/progress-bar"
<ProgressBar value={percentual} className="w-32" />
```

### Permissoes
```tsx
import { RoleGuard } from "@/components/shared/role-guard"
<RoleGuard roles={['diretor', 'financeiro']}> ... </RoleGuard>
```

### Confirmacao de acoes destrutivas
```tsx
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
<ConfirmDialog open={open} onOpenChange={setOpen} title="Excluir?" description="Acao irreversivel." onConfirm={handleDelete} variant="destructive" />
```

### Seletor de obra (reutilizar em todo contexto que filtra por obra)
```tsx
import { ObraSelector } from "@/components/shared/obra-selector"
<ObraSelector value={obraId} onValueChange={setObraId} className="w-64" />
```

### Loading
```tsx
import { PageSkeleton } from "@/components/shared/loading-skeleton"
if (isLoading) return <PageSkeleton />
```

### Formatacao BR
```tsx
import { formatBRL, formatDate, formatDateTime, formatCPF, formatCNPJ, formatCPFCNPJ, formatPhone, formatPercent, truncate } from "@/lib/utils/format"
```

### Constantes/enums
Todos os enums de status estao em `lib/constants.ts`. Nunca hardcodar strings de status — importar de la.

---

## Tipos TypeScript

### Fonte de verdade: `lib/supabase/types.ts`
Contem tipos manuais para todas as tabelas v1 + views + functions.
Quando o project-id do Supabase estiver configurado, substituir por types gerados automaticamente.

### Como usar
```tsx
import type { Database } from "@/lib/supabase/types"
type Obra = Database["public"]["Tables"]["obra"]["Row"]
type ObraInsert = Database["public"]["Tables"]["obra"]["Insert"]
```

### Regra: minimizar `as` casts
Quando o TypeScript reclamar de tipo do Supabase, corrigir o tipo em `types.ts` — nao silenciar com `as`.
Casts manuais escondem bugs que so aparecem em producao.

---

## Supabase — padroes

### Clientes
```tsx
// Browser (client components)
import { createClient } from "@/lib/supabase/client"
const supabase = createClient()

// Server (server components, API routes)
import { createServerSupabase } from "@/lib/supabase/server"
const supabase = await createServerSupabase()

// Admin (sem RLS — so para cron jobs, webhooks)
import { supabaseAdmin } from "@/lib/supabase/admin"
```

### Queries com relacionamentos
NAO usar `.select("*, cliente(nome)")` — o Supabase gera ambiguidade em FKs.
USAR queries separadas com `Promise.all` e mapear com `Map`:
```tsx
const { data: obras } = await supabase.from("obra").select("*")
const clienteIds = [...new Set(obras.map(o => o.id_cliente))]
const { data: clientes } = await supabase.from("cliente").select("id_cliente, nome").in("id_cliente", clienteIds)
const clienteMap = new Map(clientes.map(c => [c.id_cliente, c.nome]))
```

### Auth flow
1. Login email/senha via Supabase Auth
2. `useUser()` hook busca role via `get_user_role()` RPC
3. RLS filtra dados automaticamente
4. Sidebar filtra itens por role

---

## Padrao de CRUD (repetir para cada entidade)

1. **Listagem** (`page.tsx`): `DataTable` + busca + filtros + botao "Novo"
2. **Detalhe** (`[id]/page.tsx`): header + dados + relacionamentos + botao "Editar"
3. **Formulario** (`components/forms/xxx-form.tsx`): Dialog modal com react-hook-form + zod
4. **Delete**: soft-delete (campo `ativo`) quando possivel, `ConfirmDialog` sempre

---

## Estrutura de pastas

```
app/
  (auth)/login/          — Tela de login
  (dashboard)/           — Layout com sidebar + header + auth guard
    obras/               — Listagem + [id] (painel com abas) + [id]/tarefas|equipe|diarios|documentos
    clientes/            — Listagem + [id]
    fornecedores/        — Listagem + [id]
    responsaveis/        — Listagem + [id]
    trabalhadores/       — Listagem + [id] + contratos/
    financeiro/          — lancamentos/ + contas/ + plano-contas/ + folha/
    dashboards/          — geral/ + financeiro/ + alocacao/
    configuracoes/       — Perfis, etapas, grupos, centros
    integracoes/         — Status das integracoes
  api/                   — API routes (a implementar)
components/
  ui/                    — shadcn/ui (nao editar manualmente)
  layout/                — sidebar, header, breadcrumb
  forms/                 — Formularios por entidade
  tables/                — data-table reutilizavel
  shared/                — Componentes compartilhados (status-badge, role-guard, etc)
  obra-tabs/             — Componentes de abas do painel da obra
lib/
  supabase/              — client, server, admin, types
  hooks/                 — use-user
  utils/                 — format, validators, permissions
  constants.ts           — Todos os enums de status
```

---

## RBAC — 5 perfis

| Role | Acesso |
|---|---|
| `diretor` | Tudo. Unico que gerencia cadastros, configuracoes, integracoes |
| `engenheiro` | Obras (so as suas), tarefas, diarios, presenca, escala |
| `financeiro` | Financeiro completo, dashboards financeiros, todas as obras (readonly) |
| `arquiteta` | Todas as obras, criar/editar obra, documentos |
| `mestre_obra` | Obras (so as suas), diarios, presenca |

---

## Regras de negocio criticas (verificar frontend E backend)

1. Lancamento sem `centro_custo` → REJEITAR
2. Lancamento sem `responsavel` → REJEITAR
3. Diario gerado por IA → `status_revisao = 'pendente'` (nunca 'aprovado' direto)
4. Trabalhador NAO pode estar escalado em 2 obras no mesmo dia/turno (UNIQUE constraint)
5. Presenca so em diario da mesma obra do contrato ativo
6. Valor da presenca: integral = valor_acordado; meia = valor_acordado / 2
7. Parcela atrasada = vencimento < hoje AND status = 'pendente'
8. Lancamento pode existir sem tarefa, mas NUNCA sem centro_custo
9. Ao criar obra, vincular ao centro_custo selecionado
10. Ao encerrar contrato de trabalho, cancelar escalas futuras

---

## Formatacao brasileira — SEMPRE

- Datas: DD/MM/AAAA (usar `formatDate()`)
- Moeda: R$ 1.234,56 (usar `formatBRL()`)
- CPF: 123.456.789-00 (usar `formatCPF()`)
- CNPJ: 12.345.678/0001-90 (usar `formatCNPJ()`)
- Telefone: (21) 99999-9999 (usar `formatPhone()`)
- Valores monetarios: `font-mono` para alinhar decimais

---

## Mobile-first

- Todas as telas devem funcionar em celular (engenheiros acessam do campo)
- Sidebar mobile ja e drawer via Sheet (hamburger no header)
- Tabelas: em mobile, considerar scroll horizontal ou cards empilhados
- Formularios: tela cheia em mobile

---

## Isolamento de projeto — CRITICO

- **Repositorio**: somente `github.com/MarcosPaulo1/Granum` — NUNCA push para outro repo
- **Supabase**: somente org "granum", project-id `kljtmxctbhzicedyeqgw` — NUNCA usar outra conta/org
- Antes de rodar `supabase gen types` ou qualquer CLI, verificar que esta na org correta
- NUNCA copiar schemas, dados ou credenciais entre projetos

## Types do Supabase

Para regenerar os types apos mudar o schema:
```bash
npx supabase gen types typescript --project-id kljtmxctbhzicedyeqgw > lib/supabase/database.types.ts
```
Verificar que as tabelas no output sao do Granum (obra, cliente, tarefa) e NAO de outro projeto.

---

## O que NAO fazer

- Nao criar componentes que ja existem (DataTable, StatusBadge, ConfirmDialog, etc)
- Nao usar `alert()` ou `console.error` como feedback ao usuario
- Nao usar `any` no TypeScript
- Nao silenciar erros de tipo com `as` — corrigir o tipo na fonte
- Nao commitar .env ou credenciais
- Nao fazer query com JOIN via `.select("*, tabela(campo)")` — usar queries separadas
- Nao hardcodar strings de status — usar constantes de `lib/constants.ts`
- Nao criar arquivos de documentacao (README, etc) sem ser pedido
- Nao subir codigo/dados do Granum em outro repo ou Supabase
