<div align="center">

<img src="public/screenshot-login.png" alt="Pulsus" width="860" />

# Pulsus

**Plataforma SaaS multi-tenant de gestão de clínicas médicas.**  
Agendamento de consultas, gestão de médicos e pacientes, com controle de acesso por papel (RBAC).

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-latest-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tech Stack](#tech-stack)
- [Arquitetura](#arquitetura)
- [Segurança](#segurança)
- [Começando](#começando)
- [Licença](#licença)

---

## Sobre o projeto

O Pulsus é um sistema web completo para clínicas médicas, construído como SaaS multi-tenant. Cada clínica possui seu espaço isolado, com usuários, médicos, pacientes e agendamentos independentes. O acesso é controlado por três papéis distintos — `admin`, `receptionist` e `doctor` — cada um com permissões granulares aplicadas tanto no servidor quanto na interface.

---

## Funcionalidades

- **Multi-tenancy** — isolamento total por clínica via `clinicId` em todas as queries
- **RBAC** — papéis `admin`, `receptionist` e `doctor` com verificação server-side em todas as mutations
- **Agendamentos** — criação com detecção de conflitos via índices parciais únicos; ciclo de vida completo (agendado → concluído / cancelado / não compareceu)
- **Médicos** — CRUD com disponibilidade semanal por horário, especialidade e valor de consulta
- **Pacientes** — CRUD com CPF criptografado (AES-256-GCM) e busca por hash HMAC para unicidade sem expor o dado
- **Dashboard** — métricas de agendamentos e gráficos por período
- **Segurança** — proxy de autenticação no edge, rate limiting por IP, CSP, HSTS e criptografia de PII

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 — App Router, Server Actions, Turbopack |
| Linguagem | TypeScript 5 |
| Autenticação | Better Auth — email/senha, sessões HTTP-only |
| Banco de dados | PostgreSQL + Drizzle ORM |
| UI | Tailwind CSS v4 + Shadcn UI + Lucide React |
| Formulários | React Hook Form + Zod |
| Tabelas | TanStack Table |
| Gráficos | Recharts |
| Notificações | Sonner |

---

## Arquitetura

```
app/
├── (auth)/              # Páginas públicas — sign-in e sign-up
├── (dashboard)/         # Páginas protegidas — médicos, pacientes, agenda
└── api/                 # Route handlers — auth e agenda pública

features/
├── appointments/        # Agendamentos (actions, components, schemas, lib)
├── auth/                # Autenticação e autorização
├── doctors/             # Médicos
├── patients/            # Pacientes
└── users/               # Usuários da clínica

lib/
├── auth.ts              # Configuração Better Auth
├── crypto.ts            # Criptografia AES-256-GCM + HMAC
├── db/                  # Schema Drizzle e conexão PostgreSQL
├── logger.ts            # Logger estruturado (JSON em produção)
└── rate-limit.ts        # Rate limiter in-memory por IP
```

### Fluxo de dados

```
Request
  └── Proxy (edge)          → verifica sessão, redireciona não autenticados
        └── Layout           → valida sessão completa, carrega contexto da clínica
              └── Server Action
                    ├── getRequiredClinicId()   → extrai clinicId da sessão
                    ├── requirePermission()     → verifica papel do usuário
                    ├── Zod schema              → valida payload
                    └── db.transaction()        → mutação + revalidatePath()
```

### Padrões de implementação

- **Server Actions** retornam `{ success: boolean; message?: string; fieldErrors?: Record<string, string[]> }`
- **Dual schemas** — schema de dados (server action) e schema de formulário (com coerção de strings e toggles), conectados por helpers `toXxxPayload()`
- **Isolamento de tenant** — toda query inclui `where eq(table.clinicId, clinicId)` extraído da sessão
- **Conflict detection** — índices parciais únicos com `WHERE status != 'cancelled'` para impedir double-booking

---

## Segurança

| Camada | Implementação |
|--------|--------------|
| Autenticação | Better Auth com sessões HTTP-only e cookies seguros |
| Autorização | RBAC com `requirePermission()` em todas as server actions |
| Edge proxy | Proteção de rotas antes do layout renderizar |
| Rate limiting | 10 req/min em sign-in, 5 req/min em sign-up por IP |
| HTTP Headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| PII | CPF armazenado com AES-256-GCM; unicidade via HMAC-SHA256 |
| Logging | Logger estruturado com saída JSON em produção |

---

## Começando

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

Para gerar um valor seguro para `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
```

> As chaves de criptografia do CPF (AES-256-GCM e HMAC-SHA256) são derivadas automaticamente do `BETTER_AUTH_SECRET` — não é necessário configurar variáveis adicionais.

### Instalação

```bash
npm install
npm run db:migrate
npm run db:seed:specialities
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e crie a primeira clínica pelo formulário de cadastro.

### Comandos disponíveis

```bash
npm run dev                    # Servidor de desenvolvimento (Turbopack)
npm run build                  # Build de produção
npm run lint                   # ESLint

npm run db:generate            # Gerar migrations a partir do schema
npm run db:migrate             # Aplicar migrations pendentes
npm run db:studio              # Abrir Drizzle Studio (GUI do banco)
npm run db:seed:specialities   # Popular especialidades médicas
npm run db:backfill:cpf        # Criptografar CPFs existentes no banco
```

---

## Licença

Este projeto é open source e desenvolvido para fins de portfólio.
