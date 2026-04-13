import { and, count, eq, gte, lt, ne } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Calendar, DollarSign, Stethoscope, Users } from 'lucide-react';
import { getUserAccessContext } from '@/features/auth/lib/get-user-access-context';
import { hasPermission } from '@/features/auth/lib/permissions';
import { DashboardMonthPicker } from '@/features/dashboard/components/dashboard-month-picker';
import {
  PatientChart,
  type PatientChartData,
} from '@/features/dashboard/components/patient-chart-lazy';
import { db } from '@/lib/db';
import { appointments, doctors, patients } from '@/lib/db/schema';
import { SidebarTrigger } from '@/components/ui/sidebar';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  'no-show': 'Não compareceu',
};

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type DashboardPageProps = {
  searchParams: Promise<{ month?: string; year?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const accessContext = await getUserAccessContext();

  if (!hasPermission(accessContext.role, 'dashboard.read')) {
    redirect('/appointments');
  }

  const { month: monthParam, year: yearParam } = await searchParams;
  const now = new Date();
  
  const selectedMonth = Math.min(
    12,
    Math.max(1, parseInt(monthParam ?? '') || now.getMonth() + 1),
  );
  const selectedYear = parseInt(yearParam ?? '') || now.getFullYear();

  const monthStart = new Date(selectedYear, selectedMonth - 1, 1);

  const monthEnd = new Date(selectedYear, selectedMonth, 1);

  const clinicId = accessContext.clinicId;

  const [monthAppointments, priorPatientRows, [doctorCount], [patientCount]] =
    await Promise.all([
      // A: All appointments in the selected month with doctor, speciality, patient
      db.query.appointments.findMany({
        where: and(
          eq(appointments.clinicId, clinicId),
          gte(appointments.appointmentDate, monthStart),
          lt(appointments.appointmentDate, monthEnd),
        ),
        columns: {
          id: true,
          patientId: true,
          appointmentDate: true,
          status: true,
          appointmentFee: true,
        },
        with: {
          doctor: {
            columns: { id: true, name: true },
            with: {
              speciality: { columns: { id: true, name: true } },
            },
          },
          patient: { columns: { id: true, name: true } },
        },
        orderBy: (a, { desc }) => [desc(a.appointmentDate)],
    }),

      // B: Distinct patient IDs that had any non-cancelled appointment before this month
      db
        .selectDistinct({ patientId: appointments.patientId })
        .from(appointments)
        .where(
          and(
            eq(appointments.clinicId, clinicId),
            lt(appointments.appointmentDate, monthStart),
            ne(appointments.status, 'cancelled'),
          ),
        ),

      // C: Active doctor count
      db
        .select({ value: count() })
        .from(doctors)
        .where(and(eq(doctors.clinicId, clinicId), eq(doctors.isActive, true))),

      // D: Active patient count
      db
        .select({ value: count() })
        .from(patients)
        .where(
          and(eq(patients.clinicId, clinicId), eq(patients.isActive, true)),
        ),
    ]);

  // ─── Derive all widget data from JS (no extra DB round-trips) ──────────────

  const priorPatientSet = new Set(priorPatientRows.map((r) => r.patientId));

  const activeAppointments = monthAppointments.filter(
    (a) => a.status !== 'cancelled',
  );

  // KPI: Revenue (completed appointments)
  const revenueCents = monthAppointments
    .filter((a) => a.status === 'completed')
    .reduce((sum, a) => sum + (a.appointmentFee ?? 0), 0);

  // KPI: Appointments count (non-cancelled)
  const appointmentsCount = activeAppointments.length;

  // Table: 5 most recent appointments (already desc-ordered)
  const recentAppointments = monthAppointments.slice(0, 5).map((a) => ({
    patient: a.patient.name,
    date: new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(a.appointmentDate)),
    doctor: a.doctor.name,
    status: a.status,
  }));

  // Top Doctors: rank by non-cancelled appointment count
  const doctorMap = new Map<
    string,
    { name: string; speciality: string; count: number }
  >();
  for (const a of activeAppointments) {
    const existing = doctorMap.get(a.doctor.id);
    if (existing) {
      existing.count++;
    } else {
      doctorMap.set(a.doctor.id, {
        name: a.doctor.name,
        speciality: a.doctor.speciality?.name ?? '',
        count: 1,
      });
    }
  }

  const topDoctors = [...doctorMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((d) => ({ ...d, initials: getInitials(d.name) }));

  // Top Specialties: rank by non-cancelled appointment count
  const specialityMap = new Map<string, { name: string; count: number }>();
  for (const a of activeAppointments) {
    if (!a.doctor.speciality) continue;
    const { id, name } = a.doctor.speciality;
    const existing = specialityMap.get(id);
    if (existing) {
      existing.count++;
    } else {
      specialityMap.set(id, { name, count: 1 });
    }
  }
  
  const topSpecialties = [...specialityMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxSpecialtyCount = topSpecialties[0]?.count ?? 1;

  // Patient chart: novos vs retornos per day of week
  const chartByDay: Record<number, { novos: number; retornos: number }> = {};
  for (let i = 0; i < 7; i++) chartByDay[i] = { novos: 0, retornos: 0 };

  for (const a of activeAppointments) {
    const dow = new Date(a.appointmentDate).getDay();
    if (priorPatientSet.has(a.patientId)) {
      chartByDay[dow].retornos++;
    } else {
      chartByDay[dow].novos++;
    }
  }

  const patientChartData: PatientChartData[] = DAY_LABELS.map((day, i) => ({
    day,
    novos: chartByDay[i].novos,
    retornos: chartByDay[i].retornos,
  }));

  // ─── KPI Cards ─────────────────────────────────────────────────────────────

  const kpiCards = [
    {
      title: 'Faturamento',
      value: formatCurrency(revenueCents),
      icon: DollarSign,
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Agendamentos',
      value: String(appointmentsCount),
      icon: Calendar,
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Pacientes',
      value: String(patientCount.value),
      icon: Users,
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Médicos',
      value: String(doctorCount.value),
      icon: Stethoscope,
      iconBg: 'bg-teal-100 text-teal-600',
    },
  ] as const;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <header className="border-b bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <p className="text-xs text-muted-foreground">
                Menu Principal <span className="mx-1">›</span>{' '}
                <span className="font-medium text-primary">Dashboard</span>
              </p>
              <h1 className="mt-2 text-2xl font-bold text-foreground">
                Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Visão geral das métricas e resultados da clínica
              </p>
            </div>
          </div>

          <DashboardMonthPicker
            currentMonth={selectedMonth}
            currentYear={selectedYear}
          />
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-1.5 ${card.iconBg}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {card.title}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* ── Left column ── */}
          <div className="flex flex-col gap-6">
            <PatientChart data={patientChartData} />

            {/* Appointments table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b px-5 py-4">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-slate-900">Agendamentos</h2>
              </div>

              {recentAppointments.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-slate-400">
                  Nenhum agendamento neste mês.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3 text-left">Paciente</th>
                      <th className="px-5 py-3 text-left">Data</th>
                      <th className="px-5 py-3 text-left">Doutor</th>
                      <th className="px-5 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((appt, i) => (
                      <tr
                        key={i}
                        className="border-b last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="px-5 py-3 text-sm font-medium text-slate-900">
                          {appt.patient}
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600">
                          {appt.date}
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-600">
                          {appt.doctor}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {STATUS_LABEL[appt.status] ?? appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-6">
            {/* Top Doctors */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold text-slate-900">Médicos</h2>
                </div>
                <a
                  href="/doctors"
                  className="text-xs text-primary hover:underline"
                >
                  Ver todos
                </a>
              </div>

              {topDoctors.length === 0 ? (
                <p className="text-center text-sm text-slate-400">
                  Nenhum dado disponível.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {topDoctors.map((doctor) => (
                    <div key={doctor.name} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        {doctor.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {doctor.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {doctor.speciality}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-xs text-slate-500">
                        {doctor.count} agend.
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Specialties */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold text-slate-900">
                    Especialidades
                  </h2>
                </div>
              </div>

              {topSpecialties.length === 0 ? (
                <p className="text-center text-sm text-slate-400">
                  Nenhum dado disponível.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {topSpecialties.map((spec) => {
                    const barWidth = Math.round(
                      (spec.count / maxSpecialtyCount) * 100,
                    );
                    return (
                      <div key={spec.name}>
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-900">
                                {spec.name}
                              </p>
                              <span className="text-xs text-slate-500">
                                {spec.count} agend.
                              </span>
                            </div>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
