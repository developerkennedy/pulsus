import { Skeleton } from '@/components/ui/skeleton';

export default function AppointmentsLoading() {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <Skeleton className="mb-2 h-3 w-40" />
        <Skeleton className="mb-1 h-7 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>

      <div className="flex-1 bg-slate-50 p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-40 rounded-lg" />
        </div>

        {/* Tabela */}
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="grid grid-cols-6 gap-4 border-b px-4 py-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>

          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 border-b px-4 py-4 last:border-b-0">
              <div className="col-span-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-full" />
              </div>
              <Skeleton className="h-3.5 w-2/3 self-center" />
              <Skeleton className="h-3.5 w-3/4 self-center" />
              <Skeleton className="h-3.5 w-1/2 self-center" />
              <Skeleton className="h-6 w-20 rounded-full self-center" />
              <Skeleton className="h-6 w-16 rounded-full self-center" />
            </div>
          ))}
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
