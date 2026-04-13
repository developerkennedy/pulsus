import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient();

export type AuthClientSession = typeof authClient.$Infer.Session;
