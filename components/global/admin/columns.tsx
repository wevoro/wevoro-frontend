'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Check, X, Mail, ArrowUpDown, Calendar, Pencil } from 'lucide-react';
import CredentialListIcon from './credential-list-icon';
import { Button } from '@/components/ui/button';

import Image from 'next/image';
import TableDropdown from './table-dropdown';
import { ReviewApplicationModal } from './review-application-modal';
import AdminAlertModal from './admin-alert-modal';
import { MessageModal } from './message-modal';

import moment from 'moment';
import { adminStatusColors, adminStatusTexts } from '@/utils/status';
import EditAction from './edit-action';
import { AdminEditUserModal } from './admin-edit-user-modal';

import { cn } from '@/lib/utils';
import FeedbackColumn from './feedback-column';

export const proColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'fullName',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const firstName = row.original.personalInfo?.firstName || '';
      const lastName = row.original.personalInfo?.lastName || '';
      const image = row.original.personalInfo?.image || '';
      // SCRUM-110 design: the caregiver's track (CNA / PCA) sits under the name.
      const role = row.original.professionalInfo?.role || '';

      return (
        <div className='flex items-center gap-3'>
          <Image
            unoptimized
            src={image || '/dummy-profile-pic.jpg'}
            alt={`${firstName} ${lastName}`}
            className='rounded-full object-cover size-[54px] shrink-0'
            width={54}
            height={54}
          />
          <div className='flex flex-col justify-center gap-1'>
            <p className='text-sm font-medium leading-[21px] text-[#1C1C1C]'>
              {`${firstName} ${lastName}`.trim() || 'N/A'}
            </p>
            {role && (
              <p className='text-xs font-normal leading-[18px] text-[#6C6C6C]'>{role}</p>
            )}
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const nameA =
        `${rowA.original.firstName || ''} ${rowA.original.lastName || ''}`
          .trim()
          .toLowerCase();
      const nameB =
        `${rowB.original.firstName || ''} ${rowB.original.lastName || ''}`
          .trim()
          .toLowerCase();
      return nameA.localeCompare(nameB);
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Email
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    // Truncated per the design ("example@email...."). Long addresses used to
    // stretch the table so far that the Status column was pushed underneath
    // the sticky Actions column.
    cell: ({ row }) => (
      <span className='block max-w-[200px] truncate' title={row.original.email || ''}>
        {row.original.email || 'N/A'}
      </span>
    ),
  },
  {
    accessorKey: 'personalInfo.phone',
    header: 'Phone Number',
    cell: ({ row }) => {
      const phone = row.original.personalInfo?.phone || '';
      return (
        <span className='block max-w-[160px] truncate' title={phone}>
          {phone || 'N/A'}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',

    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Joining Date
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const createdAt = row.original.createdAt || '';
      return <span>{moment(createdAt).format('DD-MM-YYYY')}</span>;
    },
  },
  {
    accessorKey: 'status',

    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <span
          style={{
            color: adminStatusColors[status as keyof typeof adminStatusColors],
          }}
        >
          {adminStatusTexts[status as keyof typeof adminStatusTexts]}
        </span>
      );
    },
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;

      // Design: a pending row shows only Approve / Reject / Review (48px, white
      // tiles). Once decided it switches to Edit / Message / Review / More
      // (44px, grey tiles). Keeping pending at three buttons is also what stops
      // the row overflowing the scrollable table.
      const isPending = status === 'pending';

      if (isPending) {
        const tile =
          'flex size-12 shrink-0 items-center justify-center rounded-xl bg-white hover:bg-gray-50 transition-colors';
        return (
          <div className='flex flex-nowrap items-center gap-3'>
            <AdminAlertModal alertType='approve' data={row.original}>
              <Button variant='ghost' size='icon' className={`${tile} text-[#008000]`} title='Approve'>
                <Check className='size-6' strokeWidth={2.5} />
              </Button>
            </AdminAlertModal>
            <AdminAlertModal alertType='reject' data={row.original}>
              <Button variant='ghost' size='icon' className={`${tile} text-[#E94435]`} title='Reject'>
                <X className='size-6' strokeWidth={2.5} />
              </Button>
            </AdminAlertModal>
            <ReviewApplicationModal data={row.original}>
              <Button variant='ghost' size='icon' className={`${tile} text-[#01400F]`} title='Review application'>
                <CredentialListIcon />
              </Button>
            </ReviewApplicationModal>
          </div>
        );
      }

      const tile =
        'flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#F9F9FA] hover:bg-gray-200 transition-colors text-[#01400F]';
      return (
        <div className='flex flex-nowrap items-center gap-3'>
          <AdminEditUserModal data={row.original}>
            <Button variant='ghost' size='icon' className={tile} title='Edit'>
              <Pencil className='size-5' />
            </Button>
          </AdminEditUserModal>
          <MessageModal data={row.original}>
            <Button variant='ghost' size='icon' className={tile} title='Send a message'>
              <Mail className='size-5' />
            </Button>
          </MessageModal>
          <ReviewApplicationModal data={row.original}>
            <Button variant='ghost' size='icon' className={tile} title='Review application'>
              <CredentialListIcon />
            </Button>
          </ReviewApplicationModal>
          <TableDropdown data={row.original} />
        </div>
      );
    },
  },
];
export const partnerColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'fullName',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const firstName = row.original.personalInfo?.firstName || '';
      const lastName = row.original.personalInfo?.lastName || '';
      const companyName = row.original.personalInfo?.companyName || '';
      const image = row.original.personalInfo?.image || '';
      return (
        <div className='flex items-center gap-3'>
          <Image
            unoptimized
            src={image || '/dummy-profile-pic.jpg'}
            alt={`${firstName} ${lastName}`}
            className='rounded-full object-cover size-10'
            width={40}
            height={40}
          />

          <div>
            <p className='font-medium'>
              {`${firstName} ${lastName}`.trim() || 'N/A'}
            </p>
            <p className='text-sm text-gray-500'>{companyName || 'N/A'}</p>
          </div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const nameA =
        `${rowA.original.personalInfo?.firstName || ''} ${rowA.original.personalInfo?.lastName || ''}`
          .trim()
          .toLowerCase();
      const nameB =
        `${rowB.original.personalInfo?.firstName || ''} ${rowB.original.personalInfo?.lastName || ''}`
          .trim()
          .toLowerCase();
      return nameA.localeCompare(nameB);
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Email
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    // Truncated per the design ("example@email...."). Long addresses used to
    // stretch the table so far that the Status column was pushed underneath
    // the sticky Actions column.
    cell: ({ row }) => (
      <span className='block max-w-[200px] truncate' title={row.original.email || ''}>
        {row.original.email || 'N/A'}
      </span>
    ),
  },
  {
    accessorKey: 'personalInfo.phone',
    header: 'Phone Number',
    cell: ({ row }) => {
      const phone = row.original.personalInfo?.phone || '';
      return (
        <span className='block max-w-[160px] truncate' title={phone}>
          {phone || 'N/A'}
        </span>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Joining Date
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const createdAt = row.original.createdAt || '';
      return <span>{moment(createdAt).format('DD-MM-YYYY')}</span>;
    },
  },
  {
    accessorKey: 'personalInfo.industry',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Industry
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const industry = row.original.personalInfo?.industry || '';
      return <span>{industry || 'N/A'}</span>;
    },
  },
  {
    accessorKey: 'status',

    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <span
          style={{
            color: adminStatusColors[status as keyof typeof adminStatusColors],
          }}
        >
          {adminStatusTexts[status as keyof typeof adminStatusTexts]}
        </span>
      );
    },
  },
  {
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      const status = row.original.status as string;

      if (status === 'pending' || status === 'in-review') {
        return (
          <div className='flex items-center gap-2'>
            <AdminAlertModal alertType='approve' data={row.original}>
              <Button
                variant='ghost'
                size='icon'
                className='text-green-500 hover:text-green-600 bg-gray-100 hover:bg-gray-200 rounded-xl size-10'
              >
                <Check className='size-5' strokeWidth={2.5} />
              </Button>
            </AdminAlertModal>
            <AdminAlertModal alertType='reject' data={row.original}>
              <Button
                variant='ghost'
                size='icon'
                className='text-red-500 hover:text-red-600 bg-gray-100 hover:bg-gray-200 rounded-xl size-10'
              >
                <X className='size-5' strokeWidth={2.5} />
              </Button>
            </AdminAlertModal>
            <ReviewApplicationModal from='partner' data={row.original}>
              <Button
                variant='ghost'
                size='icon'
                className='text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl size-10'
              >
                <CredentialListIcon />
              </Button>
            </ReviewApplicationModal>
          </div>
        );
      }

      return (
        <div className='flex items-center gap-2'>
          <AdminEditUserModal data={row.original}>
            <Button
              variant='ghost'
              size='icon'
              className='text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl size-10'
            >
              <Pencil className='size-4' />
            </Button>
          </AdminEditUserModal>
          <MessageModal data={row.original}>
            <Button
              variant='ghost'
              size='icon'
              className='text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl size-10'
            >
              <Mail className='size-5' />
            </Button>
          </MessageModal>
          <ReviewApplicationModal from='partner' data={row.original}>
            <Button
              variant='ghost'
              size='icon'
              className='text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl size-10'
            >
              <CredentialListIcon />
            </Button>
          </ReviewApplicationModal>
          <TableDropdown data={row.original} />
        </div>
      );
    },
  },
];

export const feedbackColumns: ColumnDef<any>[] = [
  {
    accessorKey: 'user',
    header: '',
    cell: ({ row }) => {
      const user = row.original.user;
      const name = user?.name || 'N/A';
      const image = user?.image || '/dummy-profile-pic.jpg';
      const status = row.original.status || 'new';

      const statusColors = {
        new: '#33B55B',
        pending: '#F59E0B',
        solved: '#DFE2E0',
      };

      return (
        <div className='flex items-center gap-3'>
          <Image
            unoptimized
            src={image}
            alt={name}
            className='rounded-full object-cover size-10'
            width={40}
            height={40}
          />
          <div>
            <div
              className={cn('text-xs py-1 px-2 rounded-lg w-max mb-1')}
              style={{
                color:
                  statusColors[
                    status?.toLowerCase() as keyof typeof statusColors
                  ],
                border: `1px solid ${
                  statusColors[
                    status?.toLowerCase() as keyof typeof statusColors
                  ]
                }`,
              }}
            >
              {status}
            </div>
            <p className='font-medium text-sm text-tertiary'>{name}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'message',
    header: '',
    cell: ({ row }) => {
      const message = row.original.message || '';
      const selections = row.original.selections || [];
      const isViewed = row.original.isReadByAdmin || false;
      const truncated =
        message.length > 100 ? message.substring(0, 100) + '...' : message;

      return (
        <div className='max-w-md'>
          <p
            className={cn(
              'text-base',
              !isViewed
                ? 'font-semibold text-tertiary'
                : 'font-normal text-muted-foreground',
            )}
          >
            {truncated || 'No message'}
          </p>
          <div className='flex items-center gap-3 mt-1'>
            {selections.map((selection: any, i: number) => (
              <div
                key={i}
                className={cn(
                  'text-xs p-2 rounded-[30px] w-max bg-[#F9F9FA] text-muted-foreground',
                )}
              >
                {selection}
              </div>
            ))}

            <div className='flex items-center gap-2 text-muted-foreground'>
              <Calendar className='size-4' />
              <p className=''>
                {moment(row.original.createdAt).format('DD MMM,YYYY')} ({' '}
                {moment(row.original.createdAt).format('hh:mm A')} )
              </p>
            </div>
          </div>
        </div>
      );
    },
  },

  {
    header: '',
    id: 'actions',
    cell: ({ row }) => {
      return <FeedbackColumn row={row} />;
    },
  },
];
