'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { PenLine, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SignDocumentsModal from './sign-documents-modal';

/**
 * SCRUM-118: the caregiver's entry point into signing.
 *
 * The approved design puts "Documents to be signed" on the classic offer box,
 * but in credentialing mode the Offers tab renders agency engagements instead
 * and there is no offer card to accept — so a caregiver with a pending packet
 * had no way to reach the signing screen at all. This panel sits above the
 * tabs and surfaces any packet, which keeps the flow reachable in both modes.
 * It renders nothing when there is nothing to sign.
 */
const DocumentsToSignPanel: React.FC = () => {
  const [packets, setPackets] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/esign/my-packets');
      const body = await res.json();
      if (res.ok && Array.isArray(body?.data)) setPackets(body.data);
    } catch {
      // Silent: this panel is additive, a failure must not break the Offers tab.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = packets.filter((p) => p.status === 'pending' && p.pendingCount > 0);
  const done = packets.filter((p) => p.status === 'completed');
  if (pending.length === 0 && done.length === 0) return null;

  return (
    <div className='mb-6'>
      {pending.map((p) => {
        const total = p.items.filter((i: any) => i.status !== 'outdated').length;
        return (
          <div
            key={p._id}
            className='mb-3 rounded-2xl border border-[#DFE2E0] bg-white p-5'
          >
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div className='flex items-start gap-3'>
                <span className='mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#ECFAF0]'>
                  <PenLine className='h-4 w-4 text-[#008000]' />
                </span>
                <div>
                  <h3 className='text-[15px] font-semibold text-[#1C1C1C]'>
                    Documents to be signed
                  </h3>
                  <p className='mt-0.5 text-[13px] text-[#6C6C6C]'>
                    {p.agencyName} sent you {total}{' '}
                    {total === 1 ? 'document' : 'documents'} to sign.{' '}
                    {p.signedCount > 0 && (
                      <span className='text-[#008000]'>
                        {p.signedCount} of {total} signed — pick up where you left off.
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setActive(p)}
                className='bg-[#008000] text-white hover:bg-[#016b01]'
              >
                {p.signedCount > 0 ? 'Continue signing' : 'Review & sign'}
              </Button>
            </div>

            <div className='mt-4 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2'>
              {p.items
                .filter((i: any) => i.status !== 'outdated')
                .map((i: any) => (
                  <div key={i._id} className='flex items-center gap-2'>
                    <PenLine className='h-3.5 w-3.5 shrink-0 text-[#008000]' />
                    <span className='flex-1 truncate text-[14px] text-[#1C1C1C]'>
                      {i.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        i.status === 'signed'
                          ? 'bg-[#F4F5F6] text-[#5E6864]'
                          : 'bg-[#ECFAF0] text-[#008000]'
                      }`}
                    >
                      {i.status === 'signed' ? 'Signed' : 'To sign'}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        );
      })}

      {done.map((p) => (
        <div
          key={p._id}
          className='mb-3 flex items-center gap-3 rounded-2xl border border-[#CFE6DB] bg-[#F4FDF8] p-4'
        >
          <CheckCircle2 className='h-5 w-5 shrink-0 text-[#008000]' />
          <p className='text-[14px] text-[#1C1C1C]'>
            All documents signed for <strong>{p.agencyName}</strong>. They have been
            notified — nothing else is needed from you.
          </p>
        </div>
      ))}

      {active && (
        <SignDocumentsModal
          open={!!active}
          onOpenChange={(open: boolean) => !open && setActive(null)}
          packet={active}
          onComplete={() => {
            setActive(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default DocumentsToSignPanel;
