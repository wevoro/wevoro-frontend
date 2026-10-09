'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { REJECTION_REASONS } from '@/lib/rejection-reasons';

/**
 * AI Automation — how much of the credential review the AI is allowed to do.
 *
 * Two switches, because they carry very different risk:
 *
 *   AI assist      the AI reads the document and fills the four fields in for
 *                  the admin. A person still presses Confirm. On by default.
 *   AI automation  the AI decides. Every credential is read the moment it is
 *                  uploaded and confirmed or marked not confirmed with no
 *                  person involved. Off by default.
 *
 * The backend enforces the dependency between them (automation implies assist),
 * so this page only has to reflect what comes back.
 *
 * The middleware already restricts /admin/* and the API is behind auth(ADMIN),
 * so this page adds no access logic of its own.
 */

interface AiSettings {
  assistEnabled: boolean;
  automationEnabled: boolean;
  lastChangedByName?: string;
  lastChangedAt?: string;
}

const longDate = (d?: string) =>
  d
    ? new Date(d).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

export default function AiAutomationPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'assist' | 'automation' | null>(null);

  useEffect(() => {
    fetch('/api/admin/ai-settings')
      .then((r) => r.json())
      .then((d) => {
        if (d?.status === 200 && d.data) setSettings(d.data);
        else toast.error(d?.message || 'Could not load the AI settings');
      })
      .catch(() => toast.error('Could not load the AI settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (patch: Partial<AiSettings>, which: 'assist' | 'automation') => {
    setSaving(which);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data?.status === 200 && data.data) {
        setSettings(data.data);
        toast.success('Saved');
      } else {
        toast.error(data?.message || 'Could not save the AI settings');
      }
    } catch {
      toast.error('Could not save the AI settings');
    } finally {
      setSaving(null);
    }
  };

  const humanOnly = REJECTION_REASONS.filter((r) => r.aiSuggestOnly);

  return (
    <div className='flex flex-col gap-6 p-4 sm:p-8'>
      <div className='flex flex-col gap-1.5'>
        <h1 className='flex items-center gap-2 text-2xl font-semibold text-[#1C1C1C]'>
          <Sparkles className='size-6 text-primary' />
          AI Automation
        </h1>
        <p className='max-w-3xl text-sm text-[#6C6C6C]'>
          How much of the credential review the AI does. It reads the uploaded file, fills in the
          credential ID, issue date, expiration date and issuing organization, and reports what looked
          wrong.
        </p>
      </div>

      {loading ? (
        <p className='flex items-center gap-2 text-sm text-[#6C6C6C]'>
          <Loader2 className='size-4 animate-spin' /> Loading…
        </p>
      ) : !settings ? (
        <p className='text-sm text-[#6C6C6C]'>The AI settings could not be loaded.</p>
      ) : (
        <div className='flex max-w-3xl flex-col gap-4'>
          {/* --- AI assist --- */}
          <section className='rounded-xl border border-[#DFE2E0] bg-white p-5'>
            <div className='flex items-start justify-between gap-6'>
              <div className='flex flex-col gap-1.5'>
                <h2 className='text-lg font-semibold text-[#1C1C1C]'>AI assist</h2>
                <p className='text-sm leading-6 text-[#6C6C6C]'>
                  Runs only when an admin opens <b>Confirm</b> or <b>Not confirmed</b> on a
                  credential. It fills the four fields in and lists anything that looked wrong, and
                  pre-selects a reason and a message when it thinks the document should not be
                  confirmed. <b>The admin still decides.</b>
                </p>
              </div>
              <div className='flex shrink-0 items-center gap-2 pt-1'>
                {saving === 'assist' && (
                  <Loader2 className='size-4 animate-spin text-[#6C6C6C]' />
                )}
                <Switch
                  checked={settings.assistEnabled}
                  disabled={saving !== null}
                  onCheckedChange={(v) => save({ assistEnabled: v }, 'assist')}
                  aria-label='AI assist'
                />
              </div>
            </div>
            {!settings.assistEnabled && (
              <p className='mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-[#6C6C6C]'>
                Off — the confirm window opens empty and every field is typed by hand, as it was
                before.
              </p>
            )}
          </section>

          {/* --- AI automation --- */}
          <section className='rounded-xl border border-[#DFE2E0] bg-white p-5'>
            <div className='flex items-start justify-between gap-6'>
              <div className='flex flex-col gap-1.5'>
                <h2 className='text-lg font-semibold text-[#1C1C1C]'>AI automation</h2>
                <p className='text-sm leading-6 text-[#6C6C6C]'>
                  The AI decides on its own. Every credential is read the moment a caregiver uploads
                  it and is <b>confirmed</b>, or <b>marked not confirmed</b> with a reason and a
                  message sent to the caregiver — for every caregiver, with nobody looking at it
                  first.
                </p>
              </div>
              <div className='flex shrink-0 items-center gap-2 pt-1'>
                {saving === 'automation' && (
                  <Loader2 className='size-4 animate-spin text-[#6C6C6C]' />
                )}
                <Switch
                  checked={settings.automationEnabled}
                  disabled={saving !== null}
                  onCheckedChange={(v) => save({ automationEnabled: v }, 'automation')}
                  aria-label='AI automation'
                />
              </div>
            </div>

            {settings.automationEnabled ? (
              <div className='mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900'>
                <AlertTriangle className='mt-0.5 size-4 shrink-0 text-amber-600' />
                <span>
                  On — credentials are being confirmed and rejected without a person. Turning AI
                  automation on also turns AI assist on, because it is the same reading.
                </span>
              </div>
            ) : (
              <p className='mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-[#6C6C6C]'>
                Off — the AI suggests, an admin decides. You can still run it for one caregiver at a
                time with <b>Run AI check</b> on their application.
              </p>
            )}

            <div className='mt-4 border-t border-[#EEF1F4] pt-3'>
              <p className='text-xs font-semibold uppercase tracking-wide text-[#6C6C6C]'>
                What automation never decides
              </p>
              <ul className='mt-2 flex list-disc flex-col gap-1 pl-5 text-sm text-[#6C6C6C]'>
                {humanOnly.map((r) => (
                  <li key={r.code}>
                    <b>{r.label}</b> — an accusation, so it always waits for a person.
                  </li>
                ))}
                <li>
                  A credential with no issue date, no issuing organization or no expiration printed
                  on it — confirming would mean inventing them.
                </li>
                <li>
                  A credential an admin has already confirmed or marked not confirmed. It is never
                  overruled.
                </li>
              </ul>
            </div>
          </section>

          {settings.lastChangedAt && (
            <p className='text-sm text-[#6C6C6C]'>
              Last changed by {settings.lastChangedByName || 'an admin'} on{' '}
              {longDate(settings.lastChangedAt)}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
