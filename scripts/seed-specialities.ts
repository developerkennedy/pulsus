import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { specialities } from '../lib/db/schema';
import * as schema from '../lib/db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('Variável de ambiente DATABASE_URL não definida.');
}

const dbClient = postgres(process.env.DATABASE_URL);
const db = drizzle(dbClient, { schema });

const specialitiesSeed = [
  {
    name: 'Cardiologia',
    description: 'Diagnóstico, prevenção e acompanhamento de doenças do coração.',
    icon: 'heart',
  },
  {
    name: 'Ginecologia',
    description: 'Atendimento integral à saúde da mulher em todas as fases da vida.',
    icon: 'venus',
  },
  {
    name: 'Pediatria',
    description: 'Cuidado clínico de bebês, crianças e adolescentes.',
    icon: 'baby',
  },
  {
    name: 'Dermatologia',
    description: 'Avaliação, prevenção e tratamento de doenças da pele.',
    icon: 'sparkles',
  },
  {
    name: 'Ortopedia',
    description: 'Tratamento de lesões e condições do sistema musculoesquelético.',
    icon: 'bone',
  },
  {
    name: 'Neurologia',
    description: 'Acompanhamento de distúrbios do cérebro, nervos e sistema nervoso.',
    icon: 'brain',
  },
  {
    name: 'Oftalmologia',
    description: 'Prevenção, diagnóstico e tratamento de doenças oculares.',
    icon: 'eye',
  },
  {
    name: 'Otorrinolaringologia',
    description: 'Atendimento para ouvido, nariz, garganta e vias aéreas superiores.',
    icon: 'ear',
  },
  {
    name: 'Endocrinologia',
    description: 'Tratamento de alterações hormonais e metabólicas.',
    icon: 'activity',
  },
  {
    name: 'Psiquiatria',
    description: 'Avaliação e acompanhamento da saúde mental e emocional.',
    icon: 'messages-square',
  },
  {
    name: 'Clínica Geral',
    description: 'Atendimento inicial, avaliação clínica ampla e encaminhamento quando necessário.',
    icon: 'stethoscope',
  },
  {
    name: 'Urologia',
    description: 'Diagnóstico e tratamento de condições do trato urinário e sistema reprodutor masculino.',
    icon: 'shield-plus',
  },
  {
    name: 'Gastroenterologia',
    description: 'Cuidado especializado do sistema digestivo, fígado, pâncreas e intestinos.',
    icon: 'pill',
  },
  {
    name: 'Reumatologia',
    description: 'Tratamento de doenças articulares, autoimunes e inflamatórias.',
    icon: 'hand',
  },
  {
    name: 'Nefrologia',
    description: 'Avaliação e acompanhamento de doenças renais e distúrbios da função dos rins.',
    icon: 'droplets',
  },
  {
    name: 'Pneumologia',
    description: 'Diagnóstico e tratamento de doenças respiratórias e pulmonares.',
    icon: 'wind',
  },
  {
    name: 'Hematologia',
    description: 'Atendimento voltado a doenças do sangue, medula óssea e sistema linfático.',
    icon: 'test-tube',
  },
  {
    name: 'Infectologia',
    description: 'Prevenção, diagnóstico e acompanhamento de doenças infecciosas.',
    icon: 'shield-alert',
  },
  {
    name: 'Oncologia',
    description: 'Acompanhamento e tratamento clínico de pacientes com câncer.',
    icon: 'ribbon',
  },
  {
    name: 'Geriatria',
    description: 'Cuidado especializado para promoção da saúde e qualidade de vida da pessoa idosa.',
    icon: 'user-round',
  },
  {
    name: 'Nutrologia',
    description: 'Avaliação clínica nutricional e manejo de deficiências e distúrbios metabólicos.',
    icon: 'apple',
  },
  {
    name: 'Mastologia',
    description: 'Prevenção, diagnóstico e tratamento de doenças da mama.',
    icon: 'heart-pulse',
  },
  {
    name: 'Angiologia',
    description: 'Tratamento clínico de doenças dos vasos sanguíneos e linfáticos.',
    icon: 'git-branch',
  },
  {
    name: 'Cirurgia Geral',
    description: 'Avaliação e seguimento de condições com indicação cirúrgica geral.',
    icon: 'scissors',
  },
  {
    name: 'Medicina do Trabalho',
    description: 'Acompanhamento da saúde ocupacional, exames e prevenção de riscos no trabalho.',
    icon: 'briefcase-medical',
  },
  {
    name: 'Alergia e Imunologia',
    description: 'Diagnóstico e acompanhamento de alergias, imunodeficiências e respostas imunes alteradas.',
    icon: 'shield',
  },
  {
    name: 'Medicina Esportiva',
    description: 'Avaliação clínica de atletas e acompanhamento da saúde relacionada ao exercício físico.',
    icon: 'dumbbell',
  },
  {
    name: 'Coloproctologia',
    description: 'Tratamento de doenças do intestino grosso, reto e ânus.',
    icon: 'scan-search',
  },
  {
    name: 'Anestesiologia',
    description: 'Avaliação perioperatória e cuidado relacionado à anestesia e controle da dor.',
    icon: 'syringe',
  },
  {
    name: 'Radiologia',
    description: 'Interpretação de exames de imagem e apoio diagnóstico especializado.',
    icon: 'scan-line',
  },
];

async function main() {
  try {
    await db
      .insert(specialities)
      .values(specialitiesSeed)
      .onConflictDoNothing({
        target: specialities.name,
      });

    console.log(
      `Seed concluído com sucesso. ${specialitiesSeed.length} especialidades processadas.`,
    );
  } finally {
    await dbClient.end();
  }
}

void main().catch((error) => {
  console.error('Falha ao executar o seed de especialidades.');
  console.error(error);
  process.exit(1);
});
