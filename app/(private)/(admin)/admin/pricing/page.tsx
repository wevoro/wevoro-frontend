'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Pencil, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import EditPriceModal from '@/components/global/admin/pricing/edit-price-modal';

/**
 * SCRUM-113 — Pricing & Transactions (founder/admin only).
 *
 * One global per-packet price, the append-only log of every change to it, and
 * the ledger of packet purchases. The middleware already restricts /admin/* to
 * admin and super_admin, and the API is behind auth(ADMIN), so this page adds no
 * access logic of its own.
 */

const money = (cents?: number | null, currency = 'usd') => {
  if (cents === null || cents === undefined) return '—';
  const value = (cents / 100).toFixed(2);
  return currency === 'usd' ? `$${value}` : `${value} ${currency.toUpperCase()}`;
};

const shortDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })
    : '—';

/** Paid / Pending / Failed, as a dot + label chip. */
const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    paid: 'bg-[#E9F7EE] text-[#046A22]',
    pending: 'bg-[#FDF4E3] text-[#8A5D06]',
    failed: 'bg-[#FCEBEA] text-[#A72019]',
  };
  const dots: Record<string, string> = {
    paid: 'bg-[#046A22]',
    pending: 'bg-[#C8901A]',
    failed: 'bg-[#A72019]',
  };
  const key = (status || '').toLowerCase();
  const label = key ? key[0].toUpperCase() + key.slice(1) : '—';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium ${
        styles[key] || 'bg-[#F2F4F3] text-[#6C6C6C]'
      }`}
    >
      <span className={`size-1.5 rounded-full ${dots[key] || 'bg-[#6C6C6C]'}`} />
      {label}
    </span>
  );
};

interface Overview {
  config: {
    currentPriceCents: number;
    currency: string;
    lastChangedAt: string | null;
    lastChangedByName: string;
  };
  history: Array<{
    _id: string;
    oldPriceCents: number | null;
    newPriceCents: number;
    changedByName: string;
    createdAt: string;
    reason?: string;
  }>;
  transactions: Array<{
    _id: string;
    agencyName: string;
    caregiverName: string;
    priceChargedCents: number;
    currency: string;
    status: string;
    transactionDate: string;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

const PricingPage = () => {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/pricing?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || json?.status !== 200) {
        setError(json?.message || 'Could not load pricing');
        return;
      }
      setData(json.data);
    } catch {
      setError('Could not load pricing');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  // Debounced so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const transactions = useMemo(() => {
    const rows = data?.transactions ?? [];
    if (sort === 'oldest') {
      return [...rows].sort(
        (a, b) => +new Date(a.transactionDate) - +new Date(b.transactionDate)
      );
    }
    if (sort === 'amount') {
      return [...rows].sort((a, b) => b.priceChargedCents - a.priceChargedCents);
    }
    return rows;
  }, [data?.transactions, sort]);

  if (loading && !data) {
    return <div className='text-[14px] text-[#6C6C6C]'>Loading pricing…</div>;
  }
  if (error && !data) {
    return <div className='text-[14px] text-[#A72019]'>{error}</div>;
  }
  if (!data) return null;

  const { config } = data;

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-[26px] font-semibold leading-tight text-[#1C1C1C]'>
          Pricing &amp; Transactions
        </h1>
        <p className='mt-1 text-[14px] text-[#6C6C6C]'>
          Set the global per-packet price and review every price change and transaction.
          Founder access only.
        </p>
      </div>

      {/* Current price */}
      <div className='flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-6'>
        <div>
          <p className='text-[11px] font-medium uppercase tracking-[0.08em] text-[#6C6C6C]'>
            Current packet price
          </p>
          <div className='mt-2 flex items-baseline gap-2'>
            <span className='text-[38px] font-semibold leading-none text-[#1C1C1C]'>
              {money(config.currentPriceCents, config.currency)}
            </span>
            <span className='text-[14px] text-[#6C6C6C]'>per packet</span>
          </div>
          <p className='mt-3 text-[13px] text-[#6C6C6C]'>
            Applies platform-wide · Last changed {shortDate(config.lastChangedAt)} by{' '}
            {config.lastChangedByName}
          </p>
        </div>
        <Button
          onClick={() => setEditOpen(true)}
          className='h-11 gap-2 rounded-lg bg-[#008000] px-5 text-[14px] font-semibold text-white hover:bg-[#016b01]'
        >
          <Pencil className='size-4' />
          Edit price
        </Button>
      </div>

      {/* Price change log */}
      <section>
        <h2 className='mb-3 text-[17px] font-semibold text-[#1C1C1C]'>Price change log</h2>
        <div className='overflow-x-auto rounded-xl bg-white'>
          <table className='w-full min-w-[720px] border-collapse'>
            <thead>
              <tr className='border-b border-[#DFE2E0]'>
                {['Old price', 'New price', 'Changed by', 'Date', 'Reason'].map((h) => (
                  <th
                    key={h}
                    className='whitespace-nowrap px-6 py-3.5 text-left text-[13px] font-medium text-[#6C6C6C]'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.history.length === 0 ? (
                <tr>
                  <td colSpan={5} className='px-6 py-6 text-[14px] text-[#6C6C6C]'>
                    No price changes yet.
                  </td>
                </tr>
              ) : (
                data.history.map((h) => (
                  <tr key={h._id} className='border-b border-[#DFE2E0] last:border-0'>
                    <td className='px-6 py-4 text-[14px] text-[#6C6C6C]'>
                      {h.oldPriceCents === null ? '—' : money(h.oldPriceCents)}
                    </td>
                    <td className='px-6 py-4 text-[14px] font-semibold text-[#1C1C1C]'>
                      {money(h.newPriceCents)}
                    </td>
                    <td className='px-6 py-4 text-[14px] text-[#1C1C1C]'>{h.changedByName}</td>
                    <td className='whitespace-nowrap px-6 py-4 text-[14px] text-[#1C1C1C]'>
                      {shortDate(h.createdAt)}
                    </td>
                    {/* New reasons are capped at 300 characters, but rows
                        written before that cap are still long and the log is
                        append-only, so they cannot be cleaned up. Clamp to two
                        lines with an ellipsis; the full text is on hover. */}
                    <td className='max-w-[340px] px-6 py-4 text-[14px] text-[#6C6C6C]'>
                      <span className='line-clamp-2 break-words' title={h.reason || undefined}>
                        {h.reason || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transactions */}
      <section>
        <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
          <h2 className='text-[17px] font-semibold text-[#1C1C1C]'>Transactions</h2>
          <div className='flex flex-wrap items-center gap-2.5'>
            <div className='flex items-center gap-2 rounded-lg border border-[#DFE2E0] bg-white px-3 py-2'>
              <Search className='size-4 text-[#6C6C6C]' />
              <input
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                placeholder='Search agency or caregiver...'
                className='w-[210px] bg-transparent text-[13.5px] text-[#1C1C1C] outline-none placeholder:text-[#9CA3A0]'
              />
            </div>
            <div className='relative'>
              <select
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
                className='appearance-none rounded-lg border border-[#DFE2E0] bg-white py-2 pl-3 pr-8 text-[13.5px] text-[#1C1C1C] outline-none'
              >
                <option value=''>Status</option>
                <option value='paid'>Paid</option>
                <option value='pending'>Pending</option>
                <option value='failed'>Failed</option>
              </select>
              <ChevronDown className='pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#6C6C6C]' />
            </div>
            <div className='relative'>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className='appearance-none rounded-lg border border-[#DFE2E0] bg-white py-2 pl-3 pr-8 text-[13.5px] text-[#1C1C1C] outline-none'
              >
                <option value='newest'>Sort by</option>
                <option value='oldest'>Oldest first</option>
                <option value='amount'>Amount</option>
              </select>
              <ChevronDown className='pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#6C6C6C]' />
            </div>
          </div>
        </div>

        <div className='overflow-x-auto rounded-xl bg-white'>
          <table className='w-full min-w-[760px] border-collapse'>
            <thead>
              <tr className='border-b border-[#DFE2E0]'>
                {['Agency', 'Caregiver', 'Amount', 'Status', 'Date'].map((h) => (
                  <th
                    key={h}
                    className='whitespace-nowrap px-6 py-3.5 text-left text-[13px] font-medium text-[#6C6C6C]'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className='px-6 py-6 text-[14px] text-[#6C6C6C]'>
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id} className='border-b border-[#DFE2E0] last:border-0'>
                    <td className='px-6 py-4 text-[14px] font-semibold text-[#1C1C1C]'>
                      {t.agencyName}
                    </td>
                    <td className='px-6 py-4 text-[14px] text-[#1C1C1C]'>{t.caregiverName}</td>
                    <td className='px-6 py-4 text-[14px] text-[#1C1C1C]'>
                      {money(t.priceChargedCents, t.currency)}
                    </td>
                    <td className='px-6 py-4'>
                      <StatusChip status={t.status} />
                    </td>
                    <td className='px-6 py-4 text-[14px] text-[#1C1C1C]'>
                      {shortDate(t.transactionDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {data.totalPages > 1 && (
            <div className='flex items-center justify-between border-t border-[#DFE2E0] px-6 py-4'>
              <button
                type='button'
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className='rounded-lg border border-[#DFE2E0] px-4 py-2 text-[13.5px] text-[#1C1C1C] disabled:opacity-50'
              >
                Previous
              </button>
              <div className='flex items-center gap-1.5'>
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type='button'
                    onClick={() => setPage(n)}
                    className={
                      n === page
                        ? 'size-8 rounded-md bg-[#008000] text-[13.5px] font-semibold text-white'
                        : 'size-8 rounded-md text-[13.5px] text-[#6C6C6C] hover:bg-[#F2F4F3]'
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                type='button'
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className='rounded-lg border border-[#DFE2E0] px-4 py-2 text-[13.5px] text-[#1C1C1C] disabled:opacity-50'
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      <EditPriceModal
        open={editOpen}
        onOpenChange={setEditOpen}
        currentPriceCents={config.currentPriceCents}
        onSaved={() => {
          toast.success('Price change logged');
          load();
        }}
      />
    </div>
  );
};

export default PricingPage;
