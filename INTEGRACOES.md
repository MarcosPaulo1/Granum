# Integrações — Sistema de Gestão de Obras

## Visão geral da arquitetura de integração

```
[Navegador]  ──HTTPS──>  [Next.js App]  ──>  [Supabase (Auth + DB + RLS)]
                              │
                              ├──>  [API Routes /api/claude/*]  ──>  [Claude API]
                              ├──>  [API Routes /api/webhooks/*]  <──  [n8n]
                              └──>  [Supabase client]  ──>  [PostgreSQL]

[n8n]  ──>  [Supabase PostgreSQL direto]  (service_role key, ignora RLS)
[n8n]  ──>  [Claude API]
[n8n]  ──>  [SharePoint / Microsoft Graph API]
[n8n]  ──>  [WhatsApp / Evolution API]
[n8n]  ──>  [Next.js webhooks]

[Plaud]  ──email──>  [n8n trigger]
[WhatsApp Bot]  ──webhook──>  [n8n trigger]
```

---

## 1. SUPABASE

### Configuração
- **Modo**: Supabase Cloud (plano gratuito para começar) OU self-hosted via Docker
- **URL**: `NEXT_PUBLIC_SUPABASE_URL` no `.env.local`
- **Anon Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (público, usado no frontend)
- **Service Role Key**: `SUPABASE_SERVICE_ROLE_KEY` (secreto, usado APENAS server-side)

### Uso no Next.js
```typescript
// lib/supabase/client.ts (browser)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts (server components e API routes)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { /* cookie handlers */ } }
  )
}

// lib/supabase/admin.ts (para operações sem RLS — n8n, cron jobs)
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### Auth Flow
1. Usuário faz login com email/senha via Supabase Auth
2. Supabase retorna JWT com `user.id`
3. App busca `responsavel` onde `auth_user_id = user.id`
4. Obtém `id_perfil` → sabe o role
5. RLS filtra automaticamente os dados nas queries

### Realtime (opcional, usar em T14 Escala e T08 Painel da obra)
```typescript
supabase
  .channel('obra-updates')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tarefa', filter: `id_obra=eq.${obraId}` },
    (payload) => { /* atualiza UI em tempo real */ }
  )
  .subscribe()
```

---

## 2. N8N

### Deploy
- **Local**: VPS Hostinger, Docker container
- **Porta interna**: 5678
- **Acesso externo**: via Nginx reverse proxy em `https://n8n.seudominio.com.br`
- **Banco**: SQLite interno OU PostgreSQL do Supabase (recomendado para persistência)

### Conexão com PostgreSQL do Supabase
- **Host**: endereço do Supabase DB (db.xxxx.supabase.co)
- **Porta**: 5432 (ou 6543 para connection pooler)
- **User**: postgres
- **Password**: senha do projeto Supabase
- **Database**: postgres
- **SSL**: required

### 6 Workflows a implementar

#### WF-01: Criação de pasta SharePoint (trigger: email do Plaud)
```
[Email Trigger: IMAP] → [Extract: nome do cliente, assunto] → 
[SharePoint: criar pasta com estrutura] → 
[PostgreSQL: INSERT INTO documento] → 
[Notificação: Slack/email para arquiteta]
```
Estrutura de pastas padrão:
```
Cliente_Nome/
├── Reuniões/
├── Projetos/
├── Fotos/
├── Orçamentos/
├── Relatórios/
└── Contratos/
```

#### WF-02: Áudio WhatsApp → Diário de obra (trigger: webhook)
```
[Webhook: recebe payload do bot WhatsApp] →
[PostgreSQL: SELECT responsavel WHERE telefone_whatsapp = numero] →
[IF não encontrado: responde "número não reconhecido", STOP] →
[PostgreSQL: SELECT obra WHERE id_responsavel = resp.id AND status = 'em_andamento'] →
[IF múltiplas obras: responde pedindo para especificar, STOP] →
[Transcribe: áudio para texto (Whisper ou outro)] →
[Claude API: gerar diário formatado] →
[PostgreSQL: INSERT INTO diario_obra (status_revisao = 'pendente')] →
[Notificação: avisa responsável para revisar]
```

Prompt para Claude (diário):
```
Você é assistente de obra. Receba a transcrição de um áudio do responsável de obra e gere um diário de obra profissional.

CONTEXTO DA OBRA:
- Nome: {obra.nome}
- Etapa atual: {etapa_ativa}
- Tarefas ativas: {lista_tarefas}
- Trabalhadores escalados hoje: {lista_escalados}

TRANSCRIÇÃO DO ÁUDIO:
{transcricao}

FORMATO DO DIÁRIO:
- Data: {data}
- Condições climáticas: (extrair do áudio se mencionado)
- Atividades realizadas: (listar em bullets)
- Mão de obra presente: (listar nomes e funções)
- Materiais utilizados: (se mencionado)
- Ocorrências: (problemas, atrasos, imprevistos)
- Observações: (próximos passos, pendências)

Responda APENAS com o diário formatado, sem explicações adicionais.
```

#### WF-03: Notificações diárias (trigger: cron 7h)
```
[Cron: 7:00] →
[PostgreSQL: SELECT tarefas do dia + escala do dia, agrupado por obra] →
[FOR EACH obra: montar mensagem com tarefas + trabalhadores esperados] →
[Notificação: email ou WhatsApp para responsável de cada obra]
```

#### WF-04: Atualização de parcelas atrasadas (trigger: cron 0h)
```
[Cron: 00:00] →
[PostgreSQL: UPDATE parcela SET status = 'atrasado' WHERE data_vencimento < CURRENT_DATE AND status = 'pendente'] →
[IF rows_affected > 0: notificar financeiro com lista de parcelas vencidas]
```

#### WF-05: Folha de pagamento semanal (trigger: cron sexta 18h)
```
[Cron: sexta 18:00] →
[PostgreSQL: SELECT * FROM vw_resumo_pagamento_semanal WHERE semana = current_week] →
[Formatar relatório: agrupar por obra, totalizar por trabalhador] →
[Notificação: enviar para financeiro + diretor para aprovação]
```

#### WF-06: Relatório semanal da obra (trigger: cron sexta 17h)
```
[Cron: sexta 17:00] →
[FOR EACH obra ativa:] →
  [PostgreSQL: buscar diários da semana + lançamentos + presenças] →
  [Claude API: gerar relatório consolidado] →
  [SharePoint: salvar PDF na pasta Relatórios do cliente] →
  [PostgreSQL: INSERT INTO documento (tipo = 'relatorio')]
```

Prompt para Claude (relatório semanal):
```
Gere um relatório semanal de obra profissional.

OBRA: {obra.nome}
PERÍODO: {data_inicio} a {data_fim}
CLIENTE: {cliente.nome}

DIÁRIOS DA SEMANA:
{diarios_texto}

RESUMO FINANCEIRO:
- Total planejado no período: R$ {total_planejado}
- Total realizado no período: R$ {total_realizado}
- Variação: {variacao}%

PRESENÇA DA EQUIPE:
{resumo_presenca}

TAREFAS CONCLUÍDAS:
{tarefas_concluidas}

TAREFAS EM ANDAMENTO:
{tarefas_em_andamento}

FORMATO: relatório executivo com seções: Resumo da Semana, Progresso Físico, Resumo Financeiro, Equipe, Ocorrências, Próxima Semana.
```

---

## 3. CLAUDE API

### Configuração
- **Modelo**: claude-sonnet-4-20250514 (para operações recorrentes — custo menor)
- **API Key**: `CLAUDE_API_KEY` no `.env.local`
- **Endpoint**: `https://api.anthropic.com/v1/messages`

### API Routes no Next.js

```typescript
// app/api/claude/diario/route.ts
export async function POST(request: Request) {
  const { transcricao, obraId } = await request.json()
  
  // Buscar contexto da obra (usando supabaseAdmin — sem RLS)
  const { data: obra } = await supabaseAdmin
    .from('obra').select('*, cliente(nome)').eq('id_obra', obraId).single()
  
  const { data: tarefas } = await supabaseAdmin
    .from('tarefa').select('nome, status, etapa(nome)')
    .eq('id_obra', obraId).eq('status', 'em_andamento')
  
  // Chamar Claude
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: montarPromptDiario(obra, tarefas, transcricao) }]
    })
  })
  
  const data = await response.json()
  const diarioTexto = data.content[0].text
  
  // Salvar no banco com status pendente
  await supabaseAdmin.from('diario_obra').insert({
    id_obra: obraId,
    data: new Date().toISOString().split('T')[0],
    conteudo: diarioTexto,
    origem: 'whatsapp',
    status_revisao: 'pendente'  // NUNCA 'aprovado' direto
  })
  
  return Response.json({ success: true, diario: diarioTexto })
}
```

### Regras para uso do Claude API
1. SEMPRE incluir tabela de preços de referência nos prompts de orçamento
2. Output SEMPRE em texto estruturado ou JSON — validar antes de salvar
3. Diários e relatórios SEMPRE entram como 'pendente' — revisão humana obrigatória
4. Monitorar consumo de tokens — logar cada chamada com tokens_used

---

## 4. SHAREPOINT (Microsoft Graph API)

### Configuração no n8n
- **Credencial**: OAuth2 (Microsoft Azure App Registration)
- **Permissões**: Files.ReadWrite.All, Sites.ReadWrite.All
- **Site**: site do SharePoint da empresa
- **Pasta raiz**: configurável na tela de integrações

### Operações usadas
- Criar pasta: `POST /drives/{driveId}/items/{parentId}/children`
- Upload de arquivo: `PUT /drives/{driveId}/items/{parentId}:/{filename}:/content`
- Listar arquivos: `GET /drives/{driveId}/items/{folderId}/children`

---

## 5. WHATSAPP BOT

### Opção recomendada: Evolution API (self-hosted)
- **Deploy**: Docker na mesma VPS
- **Webhook**: quando recebe áudio, envia POST para n8n

### Payload do webhook (exemplo)
```json
{
  "event": "messages.upsert",
  "instance": "gestao-obras",
  "data": {
    "key": { "remoteJid": "5521999999999@s.whatsapp.net" },
    "message": {
      "audioMessage": {
        "url": "https://...",
        "mimetype": "audio/ogg; codecs=opus",
        "seconds": 120
      }
    }
  }
}
```

### Fluxo de identificação
```
1. Extrair número: 5521999999999
2. SELECT id_responsavel FROM responsavel WHERE telefone_whatsapp = '21999999999'
3. Se não encontrar → responder "Número não cadastrado"
4. Se encontrar → buscar obra ativa vinculada
5. Se múltiplas obras → responder pedindo para especificar
6. Se única obra → processar áudio
```

---

## 6. TELA DE INTEGRAÇÕES (T28)

### O que mostrar

```
┌─────────────────────────────────────────────────┐
│  INTEGRAÇÕES                                      │
├─────────────────────────────────────────────────┤
│                                                   │
│  ● Supabase          🟢 Conectado                │
│    URL: db.xxx.supabase.co                       │
│    Usuários ativos: 5                            │
│    Banco: 12MB / 500MB                           │
│                                                   │
│  ● n8n               🟢 Online                   │
│    URL: https://n8n.dominio.com.br               │
│    Workflows ativos: 4/6                         │
│    Última execução: há 2 min                     │
│    [Abrir dashboard n8n ↗]                       │
│                                                   │
│  ● Claude API         🟢 Válida                  │
│    Modelo: claude-sonnet                         │
│    Tokens este mês: 45.230                       │
│    Custo estimado: R$ 3,20                       │
│    [Testar conexão]                              │
│                                                   │
│  ● SharePoint         🟡 Não configurado         │
│    [Configurar credenciais Microsoft]            │
│                                                   │
│  ● WhatsApp Bot       🟢 Ativo                   │
│    Webhook: https://n8n.../webhook/whatsapp      │
│    Último áudio: 14:32 hoje                      │
│    Números reconhecidos: 3                       │
│    [Copiar webhook URL]                          │
│                                                   │
│  WEBHOOKS DO SISTEMA                             │
│  POST /api/webhooks/n8n     → recebe dados n8n   │
│  POST /api/webhooks/whatsapp → recebe áudios     │
│  POST /api/claude/diario   → gera diário IA      │
│  POST /api/claude/orcamento → gera orçamento     │
│  POST /api/claude/relatorio → gera relatório     │
│  GET  /api/cron/parcelas   → atualiza parcelas   │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Implementação dos health checks
```typescript
// app/api/integrations/status/route.ts
export async function GET() {
  const status = {
    supabase: await checkSupabase(),
    n8n: await checkN8n(),
    claude: await checkClaude(),
    sharepoint: await checkSharepoint(),
    whatsapp: await checkWhatsapp(),
  }
  return Response.json(status)
}

async function checkN8n() {
  try {
    const res = await fetch(process.env.N8N_URL + '/healthz', { signal: AbortSignal.timeout(5000) })
    return { status: res.ok ? 'online' : 'offline' }
  } catch { return { status: 'offline' } }
}

async function checkClaude() {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': process.env.CLAUDE_API_KEY!, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 10, messages: [{ role: 'user', content: 'ping' }] })
    })
    return { status: res.ok ? 'valid' : 'invalid' }
  } catch { return { status: 'error' } }
}
```

---

## VARIÁVEIS DE AMBIENTE (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Claude API
CLAUDE_API_KEY=sk-ant-...

# n8n
N8N_URL=https://n8n.seudominio.com.br
N8N_API_KEY=...

# SharePoint (Microsoft Graph)
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=...
SHAREPOINT_SITE_ID=...
SHAREPOINT_DRIVE_ID=...

# WhatsApp (Evolution API)
WHATSAPP_WEBHOOK_SECRET=... (token para validar webhooks recebidos)

# App
NEXT_PUBLIC_APP_URL=https://app.seudominio.com.br
```

**NUNCA commitar .env.local no Git. Adicionar ao .gitignore.**
