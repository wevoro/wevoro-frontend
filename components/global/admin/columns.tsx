'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  Check,
  X,
  Mail,
  Pencil,
  ArrowUpDown,
  Eye,
  EllipsisVertical,
  Calendar,
  MoveUpRight,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import Image from 'next/image';
import TableDropdown from './table-dropdown';
import { ReviewApplicationModal } from './review-application-modal';
import AdminAlertModal from './admin-alert-modal';
import { MessageModal } from './message-modal';

import moment from 'moment';
import {
  adminStatusColors,
  adminStatusTexts,
  statusColors,
} from '@/utils/status';
import EditAction from './edit-action';

import { FeedbackModal } from './feedback-modal';
import FeedbackDropdown from './feedback-dropdown';
import { cn } from '@/lib/utils';

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

          <p className='font-medium'>
            {`${firstName} ${lastName}`.trim() || 'N/A'}
          </p>
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
  },
  {
    accessorKey: 'personalInfo.phone',
    header: 'Phone Number',
    cell: ({ row }) => {
      const phone = row.original.personalInfo?.phone || '';
      return <span>{phone || 'N/A'}</span>;
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

      if (status === 'pending') {
        return (
          <div className='flex items-center gap-2'>
            <AdminAlertModal alertType='approve' data={row.original}>
              <Button
                variant='ghost'
                size='icon'
                className='text-green-500 hover:text-primary bg-green-50'
              >
                <Check className='size-5' />
              </Button>
            </AdminAlertModal>
            <AdminAlertModal alertType='reject' data={row.original}>
              <Button
                variant='ghost'
                size='icon'
                className='text-red-500 hover:text-red-600 bg-red-50'
              >
                <X className='size-5' />
              </Button>
            </AdminAlertModal>
            <ReviewApplicationModal status={status} data={row.original}>
              <Button
                variant='ghost'
                size='icon'
                className='text-gray-500 hover:text-gray-600 bg-gray-50'
              >
                <Eye className='size-5' />
              </Button>
            </ReviewApplicationModal>
            <TableDropdown data={row.original} />
          </div>
        );
      }

      return (
        <div className='flex items-center gap-2'>
          <EditAction data={row.original} source='pro' />
          <MessageModal data={row.original}>
            <Button
              variant='ghost'
              size='icon'
              className='text-gray-500 hover:text-gray-600 bg-gray-50'
            >
              <Mail className='size-5' />
            </Button>
          </MessageModal>
          <ReviewApplicationModal status={status} data={row.original}>
            <Button
              variant='ghost'
              size='icon'
              className='text-gray-500 hover:text-gray-600 bg-gray-50'
            >
              <Eye className='size-5' />
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
  },
  {
    accessorKey: 'personalInfo.phone',
    header: 'Phone Number',
    cell: ({ row }) => {
      const phone = row.original.personalInfo?.phone || '';
      return <span>{phone || 'N/A'}</span>;
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
    header: 'Actions',
    id: 'actions',
    cell: ({ row }) => {
      return (
        <div className='flex items-center gap-2'>
          <EditAction data={row.original} source='partner' />
          <MessageModal data={row.original}>
            <Button
              variant='ghost'
              size='icon'
              className='text-gray-500 hover:text-gray-600 bg-gray-50'
            >
              <Mail className='size-5' />
            </Button>
          </MessageModal>
          <ReviewApplicationModal from='partner' data={row.original}>
            <Button
              variant='ghost'
              size='icon'
              className='text-gray-500 hover:text-gray-600 bg-gray-50'
            >
              <Eye className='size-5' />
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
            <p className='font-medium text-sm text-[#1C1C1C]'>{name}</p>
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
                ? 'font-semibold text-[#1C1C1C]'
                : 'font-normal text-[#6C6C6C]'
            )}
          >
            {truncated || 'No message'}
          </p>
          <div className='flex items-center gap-3 mt-1'>
            {selections.map((selection: any, i: number) => (
              <div
                key={i}
                className={cn(
                  'text-xs p-2 rounded-[30px] w-max bg-[#F9F9FA] text-[#6C6C6C]'
                )}
              >
                {selection}
              </div>
            ))}

            <div className='flex items-center gap-2 text-[#6C6C6C]'>
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
      return (
        <div className='flex items-center justify-end gap-2'>
          <FeedbackModal data={row.original}>
            <Button
              variant='outline'
              className='text-sm px-3 py-2 h-10 font-medium'
            >
              View Message
              <ArrowUpRight className='size-5 ml-1' />
            </Button>
          </FeedbackModal>
          <FeedbackDropdown data={row.original} />
        </div>
      );
    },
  },
];
