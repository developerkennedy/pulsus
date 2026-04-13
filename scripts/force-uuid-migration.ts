import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida.');
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function main() {
  const migrationPath = join(process.cwd(), 'drizzle', '0005_migrate_to_uuid.sql');
  const migrationSql = readFileSync(migrationPath, 'utf-8');

  console.log('Executando migration UUID...');

  // Executa todo o SQL de uma vez
  await sql.unsafe(migrationSql);

  console.log('Tabelas recriadas com UUID.');

  // Garante que a migration está registrada no __drizzle_migrations
  await sql.unsafe(`
    INSERT INTO "__drizzle_migrations" (hash, created_at)
    SELECT '0005_migrate_to_uuid', EXTRACT(EPOCH FROM NOW()) * 1000
    WHERE NOT EXISTS (
      SELECT 1 FROM "__drizzle_migrations" WHERE hash LIKE '%0005%' OR hash = '0005_migrate_to_uuid'
    )
  `).catch(() => {
    // Tabela pode ter estrutura diferente — ignora erro de registro
    console.log('Aviso: não foi possível registrar no __drizzle_migrations (ignorado).');
  });

  console.log('Concluído. Agora execute: npm run db:seed:specialities');
}

void main()
  .catch((err) => {
    console.error('Erro ao executar migration:', err);
    process.exit(1);
  })
  .finally(() => sql.end());
