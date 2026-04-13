# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

All responses to the user MUST be in Portuguese (Brazilian Portuguese). This includes explanations, comments in code reviews, commit messages, and any other communication.

## Commands

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Production build
npm run lint         # Run ESLint

npm run db:generate  # Generate Drizzle migrations from schema changes
npm run db:migrate   # Apply pending migrations to the database
npm run db:studio    # Open Drizzle Studio GUI
npm run db:seed:specialities  # Seed medical specialties lookup data
```

No test runner is configured.

## Environment Variables

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<random-secret>
```

## Architecture

This is a **multi-tenant SaaS** medical clinic management system in Portuguese. The root tenant entity is `clinics` — every user, doctor, patient, and appointment is scoped to a clinic via `clinicId`.

### Route Groups
- `app/(auth)/` — Public auth pages (sign-in, sign-up). Layout redirects authenticated users to `/`.
- `app/(dashboard)/` — Protected pages. Layout verifies session and loads clinic context.
- `app/api/auth/[...all]/` — Better Auth HTTP handler.

### Feature Structure
Each domain lives in `features/<domain>/` and contains:
- `actions/` — Next.js Server Actions (`'use server'`) for all mutations
- `components/` — Client components (forms, tables)
- `lib/` — Pure utilities, view-models, filters, pagination helpers
- `schemas/` — Zod schemas for validation

### Data Flow
1. **Session**: `getServerSession()` (in `features/auth/lib/`) wraps `auth.api.getSession()` with React `cache()` to memoize per-request.
2. **Clinic isolation**: Every server action extracts `clinicId` from the session via `getRequiredClinicId()`. All DB queries filter by it.
3. **Server Actions**: Validate with Zod → DB mutation in a transaction → `revalidatePath()`.
4. **Forms**: React Hook Form + `@hookform/resolvers/zod` on the client; call server actions via `useTransition`.

### Database
Drizzle ORM with `postgres-js` connecting to PostgreSQL. Schema is defined entirely in `lib/db/schema.ts`. When the schema changes, run `db:generate` then `db:migrate`. Monetary values (e.g., `consultationFee`, `appointmentFee`) are stored as integers in centavos (e.g., 25000 = R$ 250,00).

### Authentication
Better Auth (`lib/auth.ts`) with email/password. Custom user fields: `clinicId`, `role` (`admin` | `receptionist` | `doctor`), `phone`, `isActive`. Sign-up creates a clinic and admin user in a single DB transaction. Deactivated users are blocked from creating new sessions via a `databaseHooks.session.create.before` hook.

### UI
Tailwind CSS v4 + Shadcn UI components (in `components/ui/`). Icons from Lucide React. Toast notifications via Sonner. Data tables use TanStack Table. Charts use Recharts.

### Key Patterns

**Server Action return type** — always return a typed state object:
```typescript
{ success: boolean; message?: string; fieldErrors?: Record<string, string[]> }
```

**Dual schemas for forms** — each domain has a *data schema* (strict types for the server action) and a *form schema* (string coercion, `enabled` toggles, empty-field normalization) in `schemas/`. Use `toXxxPayload()` helpers to convert form values before calling the action. Default values for new forms come from `getXxxFormDefaultValues()`.

**Transaction pattern** — multi-step writes (e.g., upsert doctor + delete/re-insert availabilities) use `db.transaction()`.

**Database error mapping** — Postgres error code `23505` (unique violation) and `23503` (foreign key violation) are caught and returned as user-friendly Portuguese messages.

**Conflict detection** — Appointments use partial unique indexes (`WHERE status != 'cancelled'`) to prevent double-booking the same doctor or patient at the same time slot, while allowing cancelled appointments to be rebooked.

### RBAC (Role-Based Access Control)

Three roles: `admin`, `receptionist`, `doctor` (PostgreSQL enum, stored in `session.user.role`).

**Role matrix:**
- `admin` — full access to all actions and UI controls
- `receptionist` — can manage patients and appointments; cannot manage doctors or users
- `doctor` — read-only; no write server actions permitted

**Enforcement is two-layered:**
1. **Server actions (security)**: Call `requireRole(allowedRoles)` inside the first try-catch block of every mutating action, immediately after `getRequiredClinicId()`. It uses the cached session (zero extra DB cost) and throws a Portuguese error if the role is not allowed.
2. **UI layer (UX)**: Pages pass `userRole: UserRole` as a prop to client content components. Components use `canManage` to hide action buttons and table action columns. This does not replace server-side enforcement.

**Adding role checks to a new action:**
```typescript
import { requireRole } from '@/features/auth/lib/require-role';

try {
  clinicId = await getRequiredClinicId();
  await requireRole(['admin']); // or ['admin', 'receptionist']
} catch (error) {
  return {
    success: false,
    message: error instanceof Error ? error.message : 'Não foi possível identificar a clínica do usuário logado.',
  };
}
```
