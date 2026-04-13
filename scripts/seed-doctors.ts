import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, inArray } from 'drizzle-orm';
import { clinics, doctors, doctorAvailabilities, specialities } from '../lib/db/schema';
import * as schema from '../lib/db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida.');
}

const dbClient = postgres(process.env.DATABASE_URL);
const db = drizzle(dbClient, { schema });

// Dados dos médicos fake (sem IDs — serão gerados pelo banco)
const doctorsSeed = [
  {
    name: 'Dr. Rafael Mendes',
    email: 'rafael.mendes@pulsus.test',
    license: 'CRM-SP 123456',
    phone: '11991110001',
    consultationFee: 25000, // R$ 250,00
    bio: 'Cardiologista com 12 anos de experiência em doenças cardiovasculares e prevenção.',
    specialityName: 'Cardiologia',
    availabilities: [
      { dayOfWeek: 'monday' as const, startTime: '08:00', endTime: '12:00' },
      { dayOfWeek: 'wednesday' as const, startTime: '08:00', endTime: '12:00' },
      { dayOfWeek: 'friday' as const, startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    name: 'Dra. Camila Ferreira',
    email: 'camila.ferreira@pulsus.test',
    license: 'CRM-RJ 654321',
    phone: '21992220002',
    consultationFee: 20000, // R$ 200,00
    bio: 'Pediatra dedicada ao cuidado integral de bebês, crianças e adolescentes.',
    specialityName: 'Pediatria',
    availabilities: [
      { dayOfWeek: 'monday' as const, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 'tuesday' as const, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 'thursday' as const, startTime: '09:00', endTime: '13:00' },
    ],
  },
  {
    name: 'Dr. Bruno Alves',
    email: 'bruno.alves@pulsus.test',
    license: 'CRM-MG 789012',
    phone: '31993330003',
    consultationFee: 30000, // R$ 300,00
    bio: 'Ortopedista especializado em lesões esportivas e cirurgia do joelho.',
    specialityName: 'Ortopedia',
    availabilities: [
      { dayOfWeek: 'tuesday' as const, startTime: '07:00', endTime: '12:00' },
      { dayOfWeek: 'thursday' as const, startTime: '07:00', endTime: '12:00' },
      { dayOfWeek: 'friday' as const, startTime: '07:00', endTime: '11:00' },
    ],
  },
  {
    name: 'Dra. Ana Paula Souza',
    email: 'anapaula.souza@pulsus.test',
    license: 'CRM-BA 345678',
    phone: '71994440004',
    consultationFee: 22000, // R$ 220,00
    bio: 'Ginecologista com foco em saúde da mulher, pré-natal e acompanhamento hormonal.',
    specialityName: 'Ginecologia',
    availabilities: [
      { dayOfWeek: 'monday' as const, startTime: '13:00', endTime: '18:00' },
      { dayOfWeek: 'wednesday' as const, startTime: '13:00', endTime: '18:00' },
      { dayOfWeek: 'friday' as const, startTime: '08:00', endTime: '12:00' },
    ],
  },
  {
    name: 'Dr. Lucas Teixeira',
    email: 'lucas.teixeira@pulsus.test',
    license: 'CRM-PR 901234',
    phone: '41995550005',
    consultationFee: 28000, // R$ 280,00
    bio: 'Neurologista com experiência em cefaleia, epilepsia e doenças neurodegenerativas.',
    specialityName: 'Neurologia',
    availabilities: [
      { dayOfWeek: 'tuesday' as const, startTime: '14:00', endTime: '18:00' },
      { dayOfWeek: 'wednesday' as const, startTime: '08:00', endTime: '12:00' },
      { dayOfWeek: 'thursday' as const, startTime: '14:00', endTime: '18:00' },
    ],
  },
];

async function main() {
  // 1. Busca a primeira clínica ativa do banco
  const [clinic] = await db
    .select({ id: clinics.id, name: clinics.name })
    .from(clinics)
    .where(eq(clinics.isActive, true))
    .limit(1);

  if (!clinic) {
    throw new Error('Nenhuma clínica encontrada. Faça sign-up primeiro para criar uma clínica.');
  }

  console.log(`Usando clínica: "${clinic.name}" (${clinic.id})`);

  // 2. Busca os IDs das especialidades necessárias
  const specialityNames = [...new Set(doctorsSeed.map((d) => d.specialityName))];
  const foundSpecialities = await db
    .select({ id: specialities.id, name: specialities.name })
    .from(specialities)
    .where(inArray(specialities.name, specialityNames));

  const specialityMap = new Map(foundSpecialities.map((s) => [s.name, s.id]));

  const missing = specialityNames.filter((n) => !specialityMap.has(n));
  if (missing.length > 0) {
    throw new Error(
      `Especialidades não encontradas: ${missing.join(', ')}.\nExecute primeiro: npm run db:seed:specialities`,
    );
  }

  // 3. Insere os médicos e suas disponibilidades
  let inserted = 0;
  let skipped = 0;

  for (const doctorData of doctorsSeed) {
    const specialityId = specialityMap.get(doctorData.specialityName)!;

    const [doctor] = await db
      .insert(doctors)
      .values({
        clinicId: clinic.id,
        name: doctorData.name,
        email: doctorData.email,
        license: doctorData.license,
        phone: doctorData.phone,
        bio: doctorData.bio,
        consultationFee: doctorData.consultationFee,
        specialityId,
        isActive: true,
      })
      .onConflictDoNothing({ target: doctors.email })
      .returning({ id: doctors.id, name: doctors.name });

    if (!doctor) {
      console.log(`  [ignorado] ${doctorData.name} — e-mail já existe.`);
      skipped++;
      continue;
    }

    // Insere disponibilidades
    await db.insert(doctorAvailabilities).values(
      doctorData.availabilities.map((a) => ({
        doctorId: doctor.id,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    );

    console.log(`  [ok] ${doctor.name}`);
    inserted++;
  }

  console.log(`\nSeed concluído: ${inserted} inserido(s), ${skipped} ignorado(s).`);
}

void main()
  .catch((err) => {
    console.error('Erro no seed de médicos:', err);
    process.exit(1);
  })
  .finally(() => dbClient.end());
