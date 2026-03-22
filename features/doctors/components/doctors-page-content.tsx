'use client';

import { useMemo, useState } from 'react';

import { DoctorCard } from '@/components/doctor-card';
import UpsertDoctorForm from '@/components/upsert-doctor-form';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { formatDoctorPrice } from '@/features/doctors/lib/doctor-formatters';
import { mapDoctorToFormValues } from '@/features/doctors/lib/doctor-mappers';
import type {
  DoctorListItem,
  DoctorSpecialityOption,
} from '@/features/doctors/lib/doctor-view-model';

type DoctorsPageContentProps = {
  doctors: DoctorListItem[];
  specialities: DoctorSpecialityOption[];
};

export function DoctorsPageContent({
  doctors,
  specialities,
}: DoctorsPageContentProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListItem | null>(
    null,
  );

  const initialData = useMemo(
    () => mapDoctorToFormValues(selectedDoctor),
    [selectedDoctor],
  );

  function handleCreateDoctor() {
    setSelectedDoctor(null);
    setIsSheetOpen(true);
  }

  function handleEditDoctor(doctor: DoctorListItem) {
    setSelectedDoctor(doctor);
    setIsSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setIsSheetOpen(open);

    if (!open) {
      setSelectedDoctor(null);
    }
  }

  function handleFormSuccess() {
    setIsSheetOpen(false);
    setSelectedDoctor(null);
  }

  const hasDoctors = doctors.length > 0;

  return (
    <>
      <header className="border-b bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="lg:hidden" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Médicos</h1>
              <p className="text-sm text-muted-foreground">
                Acesse a listagem detalhada de seus médicos
              </p>
            </div>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
            <SheetTrigger asChild>
              <Button
                variant="default"
                className="bg-primary text-primary-foreground"
                onClick={handleCreateDoctor}
              >
                Adicionar Médico
              </Button>
            </SheetTrigger>

            <UpsertDoctorForm
              initialData={initialData}
              specialities={specialities}
              onSuccess={handleFormSuccess}
            />
          </Sheet>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        {hasDoctors ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
              name={doctor.name}
              specialty={doctor.specialty}
              schedule={doctor.schedule}
              hours={doctor.hours}
              price={formatDoctorPrice(doctor.consultationFee)}
              onViewDetails={() => handleEditDoctor(doctor)}
            />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Nenhum médico cadastrado
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Cadastre o primeiro médico e configure os dias e horários de
              atendimento.
            </p>
            <Button
              className="mt-6 bg-primary text-primary-foreground"
              onClick={handleCreateDoctor}
            >
              Adicionar médico
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
