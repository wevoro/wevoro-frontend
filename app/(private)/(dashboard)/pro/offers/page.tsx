'use client';

import React, { useMemo, useState } from 'react';
import moment from 'moment';
import { useOffers } from '@/app/apiHooks/useOffers';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ReceivedCard from '@/components/global/dashboard/offers-v2/received-card';
import SubmittedCard from '@/components/global/dashboard/offers-v2/submitted-card';
import { getInitialStatus } from '@/components/global/dashboard/offers-v2/helpers';

type SubTab = 'received' | 'submitted';
type StatusFilter = 'all' | 'pending' | 'upcoming' | 'active' | 'completed';
type DateFilter = 'all' | 'this_week' | 'this_month';

function inDateWindow(d: any, range: DateFilter): boolean {
  if (range === 'all') return true;
  const m = moment(d);
  if (range === 'this_week')
    return m.isBetween(moment().startOf('week'), moment().endOf('week'), undefined, '[]');
  if (range === 'this_month')
    return m.isBetween(moment().startOf('month'), moment().endOf('month'), undefined, '[]');
  return true;
}

function matchesSearch(offer: any, q: string): boolean {
  if (!q) return true;
  const lc = q.toLowerCase();
  const haystack = [
    offer?.partner?.personalInfo?.firstName,
    offer?.partner?.personalInfo?.lastName,
    offer?.partner?.personalInfo?.companyName,
    offer?.partner?.personalInfo?.address?.city,
    offer?.position,
    offer?.location,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(lc);
}

const OffersPage: React.FC = () => {
  const { data: offers = [], isLoading } = useOffers();
  const [subTab, setSubTab] = useState<SubTab>('received');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  // Bucket offers into received vs submitted
  const { received, submitted } = useMemo(() => {
    const received: any[] = [];
    const submitted: { offer: any; status: 'pending' | 'upcoming' | 'active' | 'completed' }[] = [];

    (offers ?? []).forEach((offer: any) => {
      const ui = getInitialStatus(offer);
      if (ui === 'received') {
        received.push(offer);
      } else {
        submitted.push({ offer, status: ui });
      }
    });

    return { received, submitted };
  }, [offers]);

  const filteredReceived = useMemo(
    () =>
      received.filter(
        (o) => matchesSearch(o, search) && inDateWindow(o.createdAt, dateFilter),
      ),
    [received, search, dateFilter],
  );

  const filteredSubmitted = useMemo(
    () =>
      submitted.filter(
        ({ offer, status }) =>
          matchesSearch(offer, search) &&
          inDateWindow(offer.createdAt, dateFilter) &&
          (statusFilter === 'all' || statusFilter === status),
      ),
    [submitted, search, statusFilter, dateFilter],
  );

  return (
    <div className='bg-white md:rounded-2xl p-4 md:p-8'>
      <h2 className='text-xl md:text-2xl font-bold text-gray-900 mb-6'>Offers</h2>

      {/* Sub-tabs */}
      <div className='flex items-center gap-8 border-b border-gray-100 mb-6'>
        <button
          onClick={() => setSubTab('received')}
          className={`pb-3 flex items-center gap-2 text-base font-semibold transition-colors ${
            subTab === 'received'
              ? 'text-gray-900 border-b-2 border-primary -mb-px'
              : 'text-gray-500'
          }`}
        >
          Received
          <span
            className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-semibold ${
              subTab === 'received'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {received.length}
          </span>
        </button>
        <button
          onClick={() => setSubTab('submitted')}
          className={`pb-3 flex items-center gap-2 text-base font-semibold transition-colors ${
            subTab === 'submitted'
              ? 'text-gray-900 border-b-2 border-primary -mb-px'
              : 'text-gray-500'
          }`}
        >
          Submitted
          <span
            className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-semibold ${
              subTab === 'submitted'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {submitted.length}
          </span>
        </button>
      </div>

      {/* Search + filters */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6'>
        <div className='relative md:max-w-[360px] w-full'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400' />
          <Input
            placeholder='Search by name, city, title'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10 h-11 rounded-xl'
          />
        </div>
        <div className='flex items-center gap-3'>
          {subTab === 'submitted' && (
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className='w-[140px] h-11 rounded-xl'>
                <SelectValue placeholder='All Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='upcoming'>Upcoming</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select
            value={dateFilter}
            onValueChange={(v) => setDateFilter(v as DateFilter)}
          >
            <SelectTrigger className='w-[140px] h-11 rounded-xl'>
              <SelectValue placeholder='This Week' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Time</SelectItem>
              <SelectItem value='this_week'>This Week</SelectItem>
              <SelectItem value='this_month'>This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <Loader2 className='size-6 animate-spin text-primary' />
        </div>
      ) : subTab === 'received' ? (
        filteredReceived.length === 0 ? (
          <p className='text-sm text-muted-foreground py-8 text-center'>
            No offers received yet.
          </p>
        ) : (
          <div className='flex flex-col gap-5'>
            {filteredReceived.map((o) => (
              <ReceivedCard key={o._id} offer={o} />
            ))}
          </div>
        )
      ) : filteredSubmitted.length === 0 ? (
        <p className='text-sm text-muted-foreground py-8 text-center'>
          No submitted applications yet.
        </p>
      ) : (
        <div className='flex flex-col gap-5'>
          {filteredSubmitted.map(({ offer, status }) => (
            <SubmittedCard key={offer._id} offer={offer} status={status} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OffersPage;
