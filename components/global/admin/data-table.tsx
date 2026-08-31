'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  hideHeader?: boolean;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  hideHeader = false,
  pageIndex = 0,
  pageSize = 6,
  onPaginationChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: onPaginationChange
      ? (updaterOrValue) => {
          if (typeof updaterOrValue === 'function') {
            const newPagination = updaterOrValue({ pageIndex, pageSize });
            onPaginationChange(newPagination.pageIndex, newPagination.pageSize);
          } else {
            onPaginationChange(
              updaterOrValue.pageIndex,
              updaterOrValue.pageSize
            );
          }
        }
      : undefined,
    manualPagination: !!onPaginationChange,
  });

  return (
    <div className={cn('px-6 py-4 bg-white rounded-lg')}>
      <Table className='bg-white rounded-lg'>
        {!hideHeader && (
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                {headerGroup.headers.map((header) => {
                  // The Actions column sticks to the right edge. Wide rows
                  // (long phone numbers/emails) used to push it out of the
                  // horizontally scrolling table, so the review button looked
                  // missing on pending rows.
                  const isActions = header.column.id === 'actions';
                  return (
                    <TableHead
                      key={header.id}
                      className={
                        isActions
                          ? 'sticky right-0 z-20 bg-white shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)]'
                          : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
        )}
        <TableBody className=''>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                // Design: rows still awaiting a decision sit on a grey band so
                // they stand out from the ones already dealt with.
                className={`h-[78px] border-b border-[#DFE2E0] hover:bg-transparent ${
                  (row.original as any)?.status === 'pending' ? 'bg-[#F9F9FA]' : 'bg-white'
                }`}
              >
                {row.getVisibleCells().map((cell) => {
                  const isActions = cell.column.id === 'actions';
                  return (
                    <TableCell
                      key={cell.id}
                      className={
                        isActions
                          ? // bg-inherit so the sticky cell picks up the row's
                            // own background (white, or grey when pending).
                            'sticky right-0 z-10 bg-inherit shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.08)]'
                          : undefined
                      }
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className='h-24 text-center'>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className='flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-2 py-8'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <div className='flex flex-wrap justify-center items-center gap-1 text-sm'>
          {Array.from({ length: table.getPageCount() }, (_, i) => (
            <Button
              key={i}
              variant={
                table.getState().pagination.pageIndex === i
                  ? 'outline'
                  : 'special'
              }
              size='sm'
              onClick={() => table.setPageIndex(i)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
