'use client';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DoctorCard } from '@/components/doctor-card';
import { Plus } from 'lucide-react';

export default function MedicosPage() {
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
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
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar médico
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                name={doctor.name}
                specialty={doctor.specialty}
                schedule={doctor.schedule}
                hours={doctor.hours}
                price={doctor.price}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

const doctors = [
  {
    id: 1,
    name: 'Dr. Camila Ferreira',
    specialty: 'Ginecologista',
    schedule: 'Segunda à Sexta',
    hours: 'Das 8 às 17',
    price: '250,00',
  },
  {
    id: 2,
    name: 'Dr. Rafael Santos',
    specialty: 'Pediatra',
    schedule: 'Segunda à Sexta',
    hours: 'Das 8 às 17',
    price: '180,00',
  },
  {
    id: 3,
    name: 'Dr. Lucas Moreira',
    specialty: 'Cardiologista',
    schedule: 'Segunda à Sexta',
    hours: 'Das 8 às 17',
    price: '350,00',
  },
  {
    id: 4,
    name: 'Dra. Mariana Almeida',
    specialty: 'Dermatologista',
    schedule: 'Segunda à Sexta',
    hours: 'Das 8 às 17',
    price: '250,00',
  },
  {
    id: 5,
    name: 'Dr. Bruno de Oliveira',
    specialty: 'Ortopedia',
    schedule: 'Segunda à Sexta',
    hours: 'Das 8 às 17',
    price: '250,00',
  },
];
