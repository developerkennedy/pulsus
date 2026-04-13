# Pulsus

Sistema SaaS multi-tenant de gerenciamento de clínicas médicas. Permite que clínicas gerenciem médicos, pacientes e agendamentos com controle de acesso baseado em papéis.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions, Turbopack)
- **Auth:** Better Auth (email/password, sessões HTTP-only)
- **ORM:** Drizzle ORM + PostgreSQL
- **UI:** Tailwind CSS v4 + Shadcn UI + Lucide React
- **Forms:** React Hook Form + Zod
- **Tabelas:** TanStack Table
- **Notificações:** Sonner

---

## Getting Started

### Pré-requisitos

- Node.js 18+
- PostgreSQL (local ou hospedado)

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<string-aleatória-segura>
```

### Instalação e setup

```bash
npm install

# Aplicar migrations
npm run db:migrate

# Popular especialidades médicas
npm run db:seed:specialities

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e crie a primeira clínica no cadastro.

### Comandos disponíveis

```bash
npm run dev              # Servidor de desenvolvimento (Turbopack)
npm run build            # Build de produção
npm run lint             # ESLint

npm run db:generate      # Gerar migrations a partir de mudanças no schema
npm run db:migrate       # Aplicar migrations pendentes
npm run db:studio        # Abrir Drizzle Studio (GUI do banco)
npm run db:seed:specialities  # Semear especialidades médicas
```

---

## Arquitetura

Multi-tenant SaaS: cada clínica, médico, paciente e agendamento é isolado por `clinicId`. Detalhes completos em [CLAUDE.md](CLAUDE.md).

**Papéis (RBAC):**
- `admin` — acesso total
- `receptionist` — gerencia pacientes e agendamentos
- `doctor` — somente leitura

---

## Status das Funcionalidades

| Funcionalidade | Status |
|---|---|
| Isolamento multi-tenant por clínica | ✅ Concluído |
| Autenticação (e-mail/senha) | ✅ Concluído |
| RBAC (admin / recepcionista / médico) | ✅ Concluído |
| Gerenciamento de médicos (CRUD + disponibilidade) | ✅ Concluído |
| Gerenciamento de pacientes (CRUD) | ✅ Concluído |
| Agendamento com detecção de conflitos | ✅ Concluído |
| Ciclo de vida de status do agendamento | ✅ Concluído |
| Ações rápidas de status nas linhas da tabela | ✅ Concluído |
| Desativar/reativar médico e paciente nas linhas | ✅ Concluído |
| Paginação e filtros por status | ✅ Concluído |
| Dashboard com métricas | 🚧 Dados mockados — sem consultas reais |
| Página de planos/preços | 🚧 Somente UI — sem integração de pagamento |
| Diálogos de confirmação para ações destrutivas | ✅ Concluído |
| Bloquear agendamentos no passado | ✅ Concluído |
| Headers de segurança (CSP, HSTS, X-Frame) | ✅ Concluído |
| Connection pooling no banco de dados | ✅ Concluído |
| Validação de variáveis de ambiente na inicialização | ✅ Concluído |
| Métricas reais no dashboard (queries no banco) | 📋 Planejado |
| Monitoramento de erros (Sentry) | 📋 Planejado |
| Endpoint de health check | 📋 Planejado |
| Notificações por e-mail (lembretes de consulta) | 📋 Planejado |
| Configurações da clínica (editar nome, contato) | 📋 Planejado |
| Gerenciamento de usuários (convidar/remover equipe) | 📋 Planejado |
| Log de auditoria | 📋 Planejado |
| Integração de pagamento/assinatura (Stripe) | 📋 Planejado |
| Portal de auto-agendamento para pacientes | 📋 Planejado |

---

## Roadmap para Produção

### 🔴 Crítico — ~~Antes de ir para produção~~ ✅ Concluído

- ✅ **Diálogos de confirmação** para desativar médico/paciente e para cancelar/não comparecimento em agendamentos
- ✅ **Bloquear datas passadas** no formulário de agendamento (`upsert-appointment-schema.ts`)
- ✅ **Connection pooling** — `lib/db/index.ts` configurado com `max: 10`, `idle_timeout` e `connect_timeout`
- ✅ **Validação de variáveis de ambiente** na inicialização — erro imediato se `DATABASE_URL` ou `BETTER_AUTH_SECRET` estiverem ausentes
- ✅ **Headers de segurança** via `next.config.ts` (X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)

### 🟡 Importante — Logo após o lançamento

- **Monitoramento de erros** — integrar Sentry (`@sentry/nextjs`) para capturar erros não tratados em server actions
- **Métricas reais no dashboard** — substituir os dados mockados em `app/(dashboard)/page.tsx` por queries de agregação no banco
- **Endpoint de health check** — `app/api/health/route.ts` que verifica a conexão com o banco
- **Loading skeletons** — adicionar `loading.tsx` nos segmentos de rota `/doctors`, `/patients`, `/appointments`

### 🟢 Planejado — Próximas versões

- Notificações por e-mail (confirmação e lembretes de consulta)
- Página de configurações da clínica (nome, logo, contato)
- Gerenciamento de usuários (convidar equipe por e-mail, definir papéis)
- Integração de pagamento (Stripe) com enforcement de limites por plano
- Log de auditoria (quem fez o quê e quando)
- Portal de auto-agendamento para pacientes (página pública)
