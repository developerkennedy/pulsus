import { betterAuth, APIError } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { admin, createAccessControl } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { users } from '@/lib/db/schema';

const authBaseUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://localhost:3000';

if (
  process.env.NODE_ENV === 'production' &&
  !process.env.BETTER_AUTH_URL
) {
  throw new Error(
    'Variável de ambiente BETTER_AUTH_URL é obrigatória em produção.',
  );
}

if (
  process.env.NODE_ENV === 'production' &&
  !authBaseUrl.startsWith('https://')
) {
  throw new Error(
    'BETTER_AUTH_URL deve usar HTTPS em produção.',
  );
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error(
    'Variável de ambiente BETTER_AUTH_SECRET não definida. Defina um segredo seguro antes de iniciar o servidor.',
  );
}

const authSecret = process.env.BETTER_AUTH_SECRET;

const adminStatements = {
  user: [
    'create',
    'list',
    'set-role',
    'ban',
    'impersonate',
    'delete',
    'set-password',
    'get',
    'update',
  ] as const,
  session: ['list', 'revoke', 'delete'] as const,
};

const adminAccessControl = createAccessControl(adminStatements);
const adminRole = adminAccessControl.newRole(adminStatements);
const restrictedRole = adminAccessControl.newRole({
  user: [],
  session: [],
});

export const auth = betterAuth({
  appName: 'dr.agenda',
  baseURL: authBaseUrl,
  secret: authSecret,
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      clinicId: {
        type: 'string',
        required: false,
        input: false,
      },
      role: {
        type: 'string',
        required: true,
        input: false,
        defaultValue: 'receptionist',
      },
      phone: {
        type: 'string',
        required: false,
      },
      isActive: {
        type: 'boolean',
        required: true,
        input: false,
        defaultValue: true,
      },
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
    cookiePrefix: 'dr-agenda',
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  plugins: [
    nextCookies(),
    admin({
      defaultRole: 'receptionist',
      adminRoles: ['admin'],
      roles: {
        admin: adminRole,
        receptionist: restrictedRole,
        doctor: restrictedRole,
      },
    }),
  ],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.query.users.findFirst({
            where: eq(users.id, session.userId),
            columns: { isActive: true },
          });

          if (!user?.isActive) {
            throw new APIError('FORBIDDEN', {
              message: 'Sua conta foi desativada. Entre em contato com o administrador da clínica.',
            });
          }

          return { data: session };
        },
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
