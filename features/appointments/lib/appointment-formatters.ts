const appointmentStatusLabels = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  'no-show': 'Não compareceu',
} as const;

const appointmentStatusBadgeClasses = {
  scheduled: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
  'no-show': 'bg-amber-50 text-amber-700',
} as const;

const appointmentStatusRowClasses = {
  scheduled: undefined,
  completed: 'bg-emerald-50/40 hover:bg-emerald-50/40',
  cancelled: 'bg-rose-50/60 hover:bg-rose-50/60',
  'no-show': 'bg-amber-50/60 hover:bg-amber-50/60',
} as const;

export type AppointmentStatusValue = keyof typeof appointmentStatusLabels;

export function formatAppointmentStatusLabel(status: AppointmentStatusValue) {
  return appointmentStatusLabels[status];
}

export function getAppointmentStatusBadgeClass(status: AppointmentStatusValue) {
  return appointmentStatusBadgeClasses[status];
}

export function getAppointmentRowClass(status: AppointmentStatusValue) {
  return appointmentStatusRowClasses[status];
}

export function formatAppointmentDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatAppointmentTime(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
