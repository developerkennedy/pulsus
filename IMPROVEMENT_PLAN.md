# Plano de Melhoria — Dr. Agenda

## Contexto

O Dr. Agenda é um sistema multi-tenant de gestão de clínicas médicas (Next.js 16.2, React 19, Drizzle ORM, PostgreSQL, shadcn/ui). O sistema está funcional, mas uma análise detalhada revelou problemas de segurança, performance, qualidade de código e UX que precisam ser endereçados antes de ir para produção. Abaixo está o plano organizado por prioridade.

---

## 1. SEGURANÇA — CRÍTICO ✅ FASE 1 COMPLETADA

### ~~1.1 Secret exposto no `.env` versionado~~ ✅
- **Arquivo**: `.env`
- **Problema**: `BETTER_AUTH_SECRET` estava no repositório
- **Resolução**: `.gitignore` já protegia `.env*`. Lembrete: rotacionar o secret em produção.

### ~~1.2 Fallback de secret no código~~ ✅
- **Arquivo**: `lib/auth.ts:15-19`
- **Problema**: Fallback silencioso `?? 'dr-agenda-dev-secret-change-me'`
- **Resolução**: Agora lança erro se `BETTER_AUTH_SECRET` não estiver definido.

### ~~1.3 CSRF bypass no `createUserAction`~~ ✅
- **Arquivo**: `features/users/actions/create-user.ts:71`
- **Problema**: `headers: new Headers()` passava headers vazios
- **Resolução**: Corrigido para `headers: new Headers(await headers())` com import de `next/headers`.

### ~~1.4 Enumeração de e-mail via mensagens de erro de login~~ ✅
- **Arquivo**: `features/auth/lib/get-auth-error-message.ts:22-26`
- **Problema**: Mensagens diferenciavam "senha inválida" de "e-mail ou senha inválidos"
- **Resolução**: Unificado para sempre retornar "E-mail ou senha inválidos."

### ~~1.5 Conversão insegura de `session?.user?.id` para String~~ ✅
- **Arquivos**: `features/users/actions/update-user.ts:49-55`, `features/users/actions/deactivate-user.ts:43-49`
- **Problema**: `String(session?.user?.id)` retornava `"undefined"` se sessão fosse nula
- **Resolução**: Adicionada validação explícita de nulidade com retorno de erro antes da comparação.

### ~~1.6 Validação ausente de UUID na rota de API~~ ✅
- **Arquivo**: `app/api/doctors/[doctorId]/schedule/route.ts:35`
- **Problema**: `doctorId` validado apenas com `typeof`
- **Resolução**: Adicionado `isValidUuid(doctorId)` reutilizando utility existente.

### 1.7 Rate limiting ausente ⏳
- **Problema**: Nenhum rate limiting nos endpoints de autenticação
- **Ação**: Implementar rate limiting via middleware ou plugin do Better Auth

### 1.8 Headers de segurança ausentes ⏳
- **Problema**: Sem CSP, X-Frame-Options, X-Content-Type-Options
- **Ação**: Configurar headers de segurança no `next.config.ts`

### 1.9 Timeout de sessão não configurado ⏳
- **Arquivo**: `lib/auth.ts`
- **Problema**: Sem configuração explícita de timeout de sessão — dados médicos exigem sessões mais curtas
- **Ação**: Configurar `session.expiresIn` e `session.updateAge` no Better Auth

---

## 2. BANCO DE DADOS — ALTO ⏳

### 2.1 Index ausente em `doctorAvailabilities`
- **Arquivo**: `lib/db/schema.ts:170-180`
- **Problema**: Sem index em `doctorId` — consultas frequentes na criação de agendamentos
- **Ação**: Adicionar `index('doctor_availabilities_doctor_id_idx').on(t.doctorId)`

### 2.2 Index ausente na tabela `users`
- **Arquivo**: `lib/db/schema.ts:50-70`
- **Problema**: Sem index em `clinicId` — consultado em todas as páginas do dashboard
- **Ação**: Adicionar `clinicIdIdx` e `clinicActiveIdx` similar a doctors/patients

### 2.3 Constraints de unicidade globais vs. por clínica
- **Arquivo**: `lib/db/schema.ts`
- **Problemas**:
  - `patients.cpf` (linha 191): unique global — impede mesmo CPF em clínicas diferentes
  - `doctors.email` (linha 151): unique global — impede médico em múltiplas clínicas
  - `doctors.license` (linha 155): unique global — mesmo problema
- **Ação**: Migrar para constraints compostos `unique().on(t.campo, t.clinicId)`

### 2.4 `onDelete: 'set null'` em referências de clinicId
- **Arquivo**: `lib/db/schema.ts` (linhas 54, 147, 186, 211)
- **Problema**: Se uma clínica for deletada, registros ficam órfãos sem `clinicId`
- **Ação**: Trocar para `onDelete: 'cascade'` ou implementar proteção contra deleção de clínica

### 2.5 Race condition no sign-up
- **Arquivo**: `features/auth/actions/sign-up.ts`
- **Problema**: Criação de clínica e usuário não estão numa transação única — se `signUpEmail` falhar, clínica fica órfã
- **Ação**: Envolver operações em transação com rollback adequado

### 2.6 Rollback ad-hoc no `createUserAction`
- **Arquivo**: `features/users/actions/create-user.ts:93-96`
- **Problema**: Cleanup manual com `.catch()` silencioso — se o rollback falhar, dados inconsistentes
- **Ação**: Usar transação ou pelo menos logging do erro de rollback

---

## 3. PERFORMANCE — MÉDIO ⏳

### 3.1 `getRequiredClinicId` sem `cache()`
- **Arquivo**: `features/auth/lib/get-required-clinic-id.ts`
- **Problema**: Não usa `cache()` do React — chamadas múltiplas no mesmo request fazem queries repetidas
- **Ação**: Envolver com `cache()` como já feito em `getServerSession`

### 3.2 Queries de dropdown sem limite
- **Arquivo**: `app/(dashboard)/appointments/page.tsx` (linhas 86-114)
- **Problema**: Busca TODOS os médicos e pacientes ativos para dropdowns, sem `limit`
- **Ação**: Adicionar `.limit()` ou implementar busca com autocomplete

### 3.3 Pool de conexões pequeno
- **Arquivo**: `lib/db/index.ts:25`
- **Problema**: `max: 10` conexões — pode ser insuficiente em produção
- **Ação**: Aumentar para 20+ ou usar connection pooler externo (PgBouncer)

### 3.4 Memoização de componentes
- **Arquivos**: `components/app-sidebar.tsx`, `components/ui/data-table.tsx`
- **Problema**: Componentes com dados estáticos ou listas grandes sem `React.memo` / `useMemo`
- **Ação**: Aplicar memoização onde o custo de re-render é significativo

### 3.5 Configuração de Next.js incompleta
- **Arquivo**: `next.config.ts`
- **Problema**: Sem configuração de imagens, compressão, ou headers de cache
- **Ação**: Adicionar otimizações de imagem, headers de cache para assets estáticos

---

## 4. QUALIDADE DE CÓDIGO — MÉDIO ⏳

### 4.1 Prioridade de erros invertida nos form helpers
- **Arquivos**: `features/doctors/lib/doctor-form-errors.ts:17`, `features/patients/lib/patient-form-errors.ts:17`
- **Problema**: `return fallbackError ?? serverError` — prioriza erro do client sobre servidor
- **Ação**: Inverter para `return serverError ?? fallbackError`

### 4.2 Componente `FormField` duplicado em 4 arquivos
- **Arquivos**: `components/upsert-doctor-form.tsx`, `features/patients/components/upsert-patient-form.tsx`, `features/users/components/upsert-user-form.tsx`, `features/appointments/components/upsert-appointment-form.tsx`
- **Ação**: Extrair para `components/form-field.tsx` e reutilizar

### 4.3 Error handling inconsistente entre server actions
- **Problema**: `upsert-patient.ts` trata 5+ códigos PostgreSQL, `update-user.ts` usa catch genérico
- **Ação**: Criar utility centralizada de mapeamento de erros de banco e usar em todas as actions

### 4.4 `.map()` usado sem retorno no schema de médico
- **Arquivo**: `features/doctors/schemas/upsert-doctor-schema.ts:158`
- **Ação**: Trocar por `.forEach()`

### 4.5 Tipagem fraca em user form errors
- **Arquivo**: `features/users/lib/user-form-errors.ts:6`
- **Problema**: `fieldName?: string` ao invés de union de campos válidos
- **Ação**: Tipar como `keyof UpdateUserFormValues | keyof CreateUserFormValues`

### 4.6 Magic strings para status de appointment
- **Problema**: Labels de status definidos em múltiplos arquivos
- **Ação**: Centralizar num arquivo de constantes

---

## 5. UX & ACESSIBILIDADE — MÉDIO-BAIXO ⏳

### 5.1 Atributos ARIA ausentes nos formulários
- **Problema**: Inputs sem `aria-label`, `aria-describedby`, `aria-required`
- **Ação**: Conectar labels com `htmlFor` e adicionar `aria-describedby` para mensagens de erro

### 5.2 Data table sem ARIA roles adequados
- **Arquivo**: `components/ui/data-table.tsx`
- **Ação**: Adicionar `aria-label` nos controles de paginação e `aria-current="page"` na página atual

### 5.3 Validação de data em appointment não permite edição de passados
- **Arquivo**: `features/appointments/schemas/upsert-appointment-schema.ts:38`
- **Problema**: Valida que data é futura, impedindo edição de agendamentos passados
- **Ação**: Condicionar validação ao modo (criação vs. edição)

### 5.4 Sem Error Boundaries
- **Problema**: Nenhum error boundary configurado — erro de server component mostra 500 genérico
- **Ação**: Adicionar `error.tsx` nas rotas principais

### 5.5 Transições de status não visíveis para o usuário
- **Problema**: Usuário não sabe quais transições de status são permitidas
- **Ação**: Mostrar apenas ações válidas baseadas no status atual

---

## Ordem de Execução Recomendada

| Fase | Itens | Status |
|------|-------|--------|
| **Fase 1**: Segurança Crítica | 1.1, 1.2, 1.3, 1.4, 1.5, 1.6 | ✅ Completada |
| **Fase 2**: Banco de Dados | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 | ⏳ Pendente |
| **Fase 3**: Segurança Complementar | 1.7, 1.8, 1.9 | ⏳ Pendente |
| **Fase 4**: Performance | 3.1, 3.2, 3.3, 3.4, 3.5 | ⏳ Pendente |
| **Fase 5**: Qualidade de Código | 4.1–4.6 | ⏳ Pendente |
| **Fase 6**: UX & Acessibilidade | 5.1–5.5 | ⏳ Pendente |

## Verificação

- **Segurança**: Testar login com credenciais inválidas (não deve diferenciar email/senha), testar CSRF em create-user, verificar headers com `curl -I`
- **Banco**: Rodar `npm run db:generate` e `npm run db:migrate` após cada mudança de schema, verificar indexes com `EXPLAIN ANALYZE`
- **Performance**: Testar com `npm run build` (sem erros), medir queries com Drizzle Studio
- **Qualidade**: `npm run lint` deve passar sem erros
- **UX**: Testar formulários com screen reader, testar edição de agendamento passado
