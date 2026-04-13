'use client';

import dynamic from 'next/dynamic';

export type { PatientChartData } from './patient-chart';

const PatientChartLazy = dynamic(
  () => import('./patient-chart').then((m) => m.PatientChart),
  { ssr: false },
);

export { PatientChartLazy as PatientChart };
