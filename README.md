<h1 align="center">Pulsus</h1>

<p align="center">
  Sistema SaaS multi-tenant de gestão de clínicas médicas.<br/>
  Agende consultas, gerencie médicos e pacientes com controle de acesso por papel.
</p>

<p align="center">
  <img src="public/screenshot-login.png" alt="Pulsus — Tela de autenticação" width="820" />
</p>

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Auth | Better Auth (email/senha, sessões HTTP-only) |
| Banco | PostgreSQL + Drizzle ORM |
| UI | Tailwind CSS v4 + Shadcn UI + Lucide React |
| Formulários | React Hook Form + Zod |
| Tabelas | TanStack Table |
| Notificações | Sonner |

---

## Funcionalidades

- **Multi-tenancy** — cada clínica opera de forma isolada via `clinicId`
- **RBAC** — três papéis (`admin`, `receptionist`, `doctor`) com permissões granulares
- **Agendamentos** — criação com detecção de conflitos por índices parciais únicos, ciclo de vida de status (agendado, concluído, cancelado, não compareceu)
- **Médicos** — CRUD completo com disponibilidade semanal, especialidade e valor da consulta
- **Pacientes** — CRUD com CPF criptografado (AES-256-GCM) e busca por hash HMAC
- **Dashboard** — métricas e gráficos da clínica
- **Segurança** — proxy de autenticação no edge, rate limiting, CSP, HSTS, criptografia de PII

---

## Começando

### Pré-requisitos

- Node.js 18+
- PostgreSQL (local ou hospedado)

### Variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<string-aleatória-segura>
```

Para gerar um secret seguro:

```bash
openssl rand -base64 32
```

### Instalação

```bash
npm install
npm run db:migrate
npm run db:seed:specialities
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e crie a primeira clínica no cadastro.

### Comandos

```bash
npm run dev                    # Servidor de desenvolvimento
npm run build                  # Build de produção
npm run lint                   # ESLint
npm run db:generate            # Gerar migrations do schema
npm run db:migrate             # Aplicar migrations pendentes
npm run db:studio              # Drizzle Studio (GUI do banco)
npm run db:seed:specialities   # Semear especialidades médicas
npm run db:backfill:cpf        # Criptografar CPFs existentes
```

---

## Arquitetura

```
app/
├── (auth)/              # Páginas públicas (sign-in, sign-up)
├── (dashboard)/         # Páginas protegidas (médicos, pacientes, agenda)
└── api/                 # Route handlers (auth, schedule)

features/
├── appointments/        # Agendamentos (actions, components, schemas, lib)
├── auth/                # Autenticação e autorização
├── doctors/             # Médicos
├── patients/            # Pacientes
└── users/               # Usuários do sistema

lib/
├── auth.ts              # Configuração Better Auth
├── crypto.ts            # Criptografia AES-256-GCM + HMAC
├── db/                  # Drizzle ORM (schema, conexão)
├── logger.ts            # Logger estruturado
└── rate-limit.ts        # Rate limiter in-memory
```

### Fluxo de dados

1. **Proxy (edge)** — verifica cookie de sessão e redireciona não autenticados
2. **Layout** — valida sessão completa e carrega contexto da clínica
3. **Server Actions** — `getRequiredClinicId()` + `requirePermission()` + validação Zod + mutação em transação + `revalidatePath()`

---

## Segurança

| Camada | Implementação |
|--------|--------------|
| Autenticação | Better Auth com sessões HTTP-only e cookies seguros |
| Autorização | RBAC com `requirePermission()` em todas as server actions |
| Proxy | Proteção de rotas no edge antes do layout renderizar |
| Rate limiting | 10 req/min sign-in, 5 req/min sign-up por IP |
| Headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| PII | CPF criptografado com AES-256-GCM, deduplicação via HMAC-SHA256 |
| Monitoramento | Logger estruturado (JSON em produção, legível em dev) |

---

## Licença

Projeto privado.
