import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('Variável de ambiente DATABASE_URL não definida.');
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('Variável de ambiente BETTER_AUTH_SECRET não definida.');
}

if (
  process.env.NODE_ENV === 'production' &&
  process.env.BETTER_AUTH_SECRET === 'dr-agenda-dev-secret-change-me'
) {
  throw new Error(
    'BETTER_AUTH_SECRET está com o valor padrão de desenvolvimento. Defina um segredo seguro em produção.',
  );
}

const dbClient = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

const db = drizzle(dbClient, { schema });

export { db, dbClient };
