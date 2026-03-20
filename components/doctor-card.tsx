import { Button } from '@/components/ui/button';
import { Calendar, Clock, DollarSign } from 'lucide-react';

interface DoctorCardProps {
  name: string;
  specialty: string;
  schedule: string;
  hours: string;
  price: string;
}

export function DoctorCard({
  name,
  specialty,
  schedule,
  hours,
  price,
}: DoctorCardProps) {
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-xl p-4">
      {/* Header com foto e info do médico */}
      <div className="flex gap-4 mb-8">
        {/* Placeholder para imagem circular */}
        <div className="w-16 h-16 bg-gray-300 rounded-full flex-shrink-0" />

        {/* Info médico */}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-text-dark mb-1">{name}</h3>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span className="text-blue-500"></span> {specialty}
          </p>
        </div>
      </div>

      {/* Detalhes */}
      <div className="space-y-4 mb-8">
        {/* Agenda */}
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-text-dark" />
          <span className="text-xs text-text-dark">{schedule}</span>
        </div>

        {/* Horário */}
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-text-dark" />
          <span className="text-xs text-text-dark">{hours}</span>
        </div>

        {/* Preço */}
        <div className="flex items-center gap-3">
          <DollarSign className="w-4 h-4 text-text-dark" />
          <span className="text-xs text-text-dark">R${price}</span>
        </div>
      </div>

      {/* Botão */}
      <Button className="w-full bg-button-primary hover:bg-button-primary/90 text-white font-semibold py-6 rounded-lg text-sm">
        Ver detalhes
      </Button>
    </div>
  );
}
