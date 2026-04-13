'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

type DashboardMonthPickerProps = {
  currentMonth: number; // 1-12
  currentYear: number;
};

export function DashboardMonthPicker({ currentMonth, currentYear }: DashboardMonthPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function selectMonth(monthIndex: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', String(monthIndex + 1));
    params.set('year', String(currentYear));
    router.replace(`?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="gap-2 text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <Calendar className="h-4 w-4" />
        {MONTHS[currentMonth - 1]}
        <ChevronDown className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border bg-white p-1 shadow-lg">
          {MONTHS.map((month, i) => (
            <button
              key={month}
              className="w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-slate-50"
              onClick={() => selectMonth(i)}
            >
              {month}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
