import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Criar conexão com o banco
const dbClient = postgres(process.env.DATABASE_URL || '', {
  ssl: process.env.NODE_ENV === 'production',
});

// Criar instância Drizzle com schema
const db = drizzle(dbClient, { schema });

export { db, dbClient };
