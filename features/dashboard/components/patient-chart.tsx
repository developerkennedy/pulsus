'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { Users } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

export type PatientChartData = {
  day: string;
  novos: number;
  retornos: number;
};

const patientChartConfig = {
  novos: { label: 'Novos', color: '#2563eb' },
  retornos: { label: 'Retornos', color: '#14b8a6' },
} satisfies ChartConfig;

type PatientChartProps = {
  data: PatientChartData[];
};

export function PatientChart({ data }: PatientChartProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold text-slate-900">Pacientes</h2>
      </div>

      <ChartContainer config={patientChartConfig} className="h-52 w-full">
        <BarChart data={data} barSize={32}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="novos" stackId="a" fill="var(--color-novos)" radius={[0, 0, 4, 4]} />
          <Bar dataKey="retornos" stackId="a" fill="var(--color-retornos)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
