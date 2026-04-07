# Design System — Sistema de Gestão de Obras

## Princípios visuais
- Clean e profissional, sem exagero visual
- Informação densa mas organizada (gestores precisam ver números rápido)
- Mobile-friendly (engenheiros acessam no campo)
- Consistência: mesmos padrões se repetem em todas as telas

## Stack de UI
- **shadcn/ui** como base de componentes
- **Tailwind CSS** para estilização
- **Recharts** para gráficos (Curva S, barras, pizza)
- **Lucide React** para ícones
- **21st.dev** para componentes adicionais quando necessário

## Cores

### Status de obra
| Status | Cor | Tailwind |
|---|---|---|
| planejamento | cinza | `bg-gray-100 text-gray-700` |
| em_andamento | azul | `bg-blue-100 text-blue-700` |
| pausada | amarelo | `bg-yellow-100 text-yellow-700` |
| concluida | verde | `bg-green-100 text-green-700` |
| cancelada | vermelho | `bg-red-100 text-red-700` |

### Financeiro
| Tipo | Cor |
|---|---|
| Entrada (receita) | verde `text-green-600` |
| Saída (despesa) | vermelho `text-red-600` |
| Planejado | azul tracejado |
| Realizado | azul sólido |

### Presença
| Status | Cor |
|---|---|
| Presente (integral) | verde `bg-green-500` |
| Meia | verde claro `bg-green-300` |
| Falta | vermelho `bg-red-500` |
| Falta justificada | amarelo `bg-yellow-500` |
| Escalado (futuro) | azul `bg-blue-400` |
| Sem escala | cinza `bg-gray-200` |

### Revisão de diário
| Status | Badge |
|---|---|
| pendente | amarelo |
| aprovado | verde |
| rejeitado | vermelho |

## Padrão de telas de listagem

Todas as telas de listagem seguem este layout:

```
┌──────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Obras > Clientes]            │
│                                                    │
│ Clientes                           [+ Novo]       │
│                                                    │
│ [🔍 Buscar por nome ou CPF...] [Filtros ▼]       │
│                                                    │
│ ┌────────┬──────────┬─────────┬────────┬────┐    │
│ │ Nome   │ CPF/CNPJ │ Telefone│ Email  │ Obras│   │
│ ├────────┼──────────┼─────────┼────────┼────┤    │
│ │ João   │ 123.456..│ (21)... │ j@...  │  3  │   │
│ │ Maria  │ 987.654..│ (21)... │ m@...  │  1  │   │
│ └────────┴──────────┴─────────┴────────┴────┘    │
│                                                    │
│ Mostrando 1-10 de 45    [< 1 2 3 4 5 >]         │
└──────────────────────────────────────────────────┘
```

### Componentes obrigatórios em toda listagem:
1. **Breadcrumb** no topo
2. **Título** + botão de ação principal (canto direito)
3. **Barra de busca** + botão de filtros avançados
4. **Tabela** com ordenação por coluna (clique no header)
5. **Paginação** no rodapé (10 items por página)
6. **Loading skeleton** enquanto carrega
7. **Empty state** quando não há dados ("Nenhum cliente cadastrado. Crie o primeiro.")

## Padrão de telas de detalhe/perfil

```
┌──────────────────────────────────────────────────┐
│ [Breadcrumb: Home > Clientes > João Silva]       │
│                                                    │
│ ┌────────────────────────────────────────────┐   │
│ │ 👤 João Silva                    [Editar]  │   │
│ │ CPF: 123.456.789-00                        │   │
│ │ Tel: (21) 99999-9999                       │   │
│ │ Email: joao@email.com                      │   │
│ └────────────────────────────────────────────┘   │
│                                                    │
│ Obras deste cliente                   [+ Nova]    │
│ ┌────────┬──────────┬────────┬──────────────┐    │
│ │ Obra   │ Status   │ %      │ Período      │    │
│ ├────────┼──────────┼────────┼──────────────┤    │
│ │ Ref AP │ 🟢 Ativa │ ████ 65%│ Jan-Jul/26  │    │
│ └────────┴──────────┴────────┴──────────────┘    │
└──────────────────────────────────────────────────┘
```

## Padrão de formulários

```
┌──────────────────────────────────────────────────┐
│ Novo lançamento                          [X]      │
│──────────────────────────────────────────────────│
│                                                    │
│ Obra *              [▼ Selecione a obra     ]     │
│ Centro de custo *   [▼ Selecione             ]    │
│                                                    │
│ Valor *             [R$ 0,00              ]       │
│ Tipo *              (●) Planejado (○) Realizado   │
│ Entrada/Saída *     (○) Entrada   (●) Saída      │
│                                                    │
│ Data competência *  [DD/MM/AAAA           ]       │
│ Fornecedor          [🔍 Buscar por CNPJ...  ]    │
│ Plano de contas     [▼ Árvore hierárquica   ]    │
│ Histórico           [________________________]    │
│                                                    │
│ □ Pagamento parcelado                             │
│                                                    │
│                      [Cancelar]  [Salvar]          │
└──────────────────────────────────────────────────┘
```

### Regras de formulário:
- Campos obrigatórios marcados com `*`
- Validação em tempo real (borda vermelha + mensagem abaixo do campo)
- Selects com busca (combobox) para fornecedor, cliente, obra
- Plano de contas como tree dropdown (mostrar hierarquia)
- Botão "Salvar" desabilitado até validação passar
- Loading spinner no botão durante submit
- Toast de sucesso/erro após submit

## Sidebar

### Desktop (expandida)
```
┌──────────────┐
│ 🏗️ GestãoObras│
│              │
│ 📊 Dashboard │
│ 📋 Obras     │
│ 👤 Clientes  │
│ 🏗 Trabalha..│
│ 👔 Responsá..│
│ 🏢 Fornece.. │
│ ─────────── │
│ 💰 Financeiro│
│   Lançamentos│
│   Contas     │
│   Pl. Contas │
│   Folha pgto │
│ ─────────── │
│ 📈 Relatórios│
│   Dashboard  │
│   Alocação   │
│ ─────────── │
│ ⚙️ Config    │
│ 🔗 Integra.. │
│              │
│ ─────────── │
│ 👤 Marcos P. │
│ Diretor      │
│ [Sair]       │
└──────────────┘
```

### Mobile (colapsada)
- Hamburger menu no header
- Sidebar abre como drawer (overlay)
- Mesmo conteúdo, fecha ao clicar fora

## Responsividade

### Breakpoints (Tailwind padrão)
- `sm` (640px): celular landscape
- `md` (768px): tablet
- `lg` (1024px): desktop pequeno
- `xl` (1280px): desktop

### Regras por breakpoint
- **Mobile** (< 768px): tabelas viram cards empilhados. Sidebar é drawer. Formulários ocupam tela cheia.
- **Tablet** (768-1024px): tabelas com scroll horizontal. Sidebar colapsada com ícones.
- **Desktop** (> 1024px): layout completo. Sidebar expandida. Tabelas com todas as colunas.

## Tipografia
- **Títulos**: font-semibold, text-xl a text-2xl
- **Subtítulos**: font-medium, text-lg
- **Corpo**: font-normal, text-sm a text-base
- **Labels**: font-medium, text-sm, text-muted-foreground
- **Valores monetários**: font-mono (alinha decimais)
- **Badges**: text-xs, font-medium

## Espaçamento
- Padding de página: `p-6` (desktop), `p-4` (mobile)
- Gap entre seções: `space-y-6`
- Gap entre cards: `gap-4`
- Padding interno de cards: `p-4` a `p-6`
