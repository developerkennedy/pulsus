import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { encrypt, hmacHash } from '../lib/crypto';
import * as schema from '../lib/db/schema';
import { patients } from '../lib/db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('Variável de ambiente DATABASE_URL não definida.');
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('Variável de ambiente BETTER_AUTH_SECRET não definida.');
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function backfill() {
  const allPatients = await db.query.patients.findMany({
    columns: { id: true, cpf: true, cpfHash: true },
  });

  let encrypted = 0;
  let skipped = 0;

  for (const patient of allPatients) {
    if (patient.cpfHash) {
      skipped++;
      continue;
    }

    const plainCpf = patient.cpf.includes(':') ? patient.cpf : patient.cpf;
    if (patient.cpf.includes(':')) {
      skipped++;
      continue;
    }

    const encryptedCpf = encrypt(plainCpf);
    const cpfHash = hmacHash(plainCpf);

    await db
      .update(patients)
      .set({ cpf: encryptedCpf, cpfHash })
      .where(eq(patients.id, patient.id));

    encrypted++;
  }

  console.log(`Backfill concluído: ${encrypted} criptografado(s), ${skipped} ignorado(s).`);
  await client.end();
}

backfill().catch((err) => {
  console.error('Erro no backfill de CPF:', err);
  process.exit(1);
});
