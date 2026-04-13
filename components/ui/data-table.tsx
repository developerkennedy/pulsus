'use client';

import Link from 'next/link';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type DataTablePagination = {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  pagination: DataTablePagination;
  itemLabel: string;
  buildPageHref: (page: number) => string;
  rowClassName?: (row: TData) => string | undefined;
};

export function DataTable<TData>({
  columns,
  data,
  pagination,
  itemLabel,
  buildPageHref,
  rowClassName,
}: DataTableProps<TData>) {
  // TanStack Table is the intended foundation for shadcn Data Table.
  // The hook result stays local to this component and is not memoized elsewhere.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  const hasPreviousPage = pagination.currentPage > 1;
  const hasNextPage = pagination.currentPage < pagination.totalPages;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-none bg-slate-50 hover:bg-slate-50"
            >
              {headerGroup.headers.map((header, index) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    'px-5',
                    index === 0 && 'rounded-l-xl',
                    index === headerGroup.headers.length - 1 &&
                      'rounded-r-xl text-right',
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn('group', rowClassName?.(row.original))}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Mostrando{' '}
          <span className="font-medium text-slate-900">
            {Math.min(
              (pagination.currentPage - 1) * pagination.pageSize + 1,
              pagination.totalCount,
            )}
          </span>{' '}
          a{' '}
          <span className="font-medium text-slate-900">
            {Math.min(
              pagination.currentPage * pagination.pageSize,
              pagination.totalCount,
            )}
          </span>{' '}
          de{' '}
          <span className="font-medium text-slate-900">
            {pagination.totalCount}
          </span>{' '}
          {itemLabel}
        </p>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            asChild
            variant="outline"
            className="bg-white"
            disabled={!hasPreviousPage}
          >
            <Link
              href={buildPageHref(pagination.currentPage - 1)}
              aria-disabled={!hasPreviousPage}
              tabIndex={hasPreviousPage ? undefined : -1}
            >
              Anterior
            </Link>
          </Button>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
            Página{' '}
            <span className="font-medium text-slate-900">
              {pagination.currentPage}
            </span>{' '}
            de{' '}
            <span className="font-medium text-slate-900">
              {pagination.totalPages}
            </span>
          </div>

          <Button
            asChild
            variant="outline"
            className="bg-white"
            disabled={!hasNextPage}
          >
            <Link
              href={buildPageHref(pagination.currentPage + 1)}
              aria-disabled={!hasNextPage}
              tabIndex={hasNextPage ? undefined : -1}
            >
              Próxima
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
