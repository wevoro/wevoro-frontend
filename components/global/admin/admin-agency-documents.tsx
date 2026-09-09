'use client';

import { useEffect, useState } from 'react';
import { Clock, Eye, FileSignature, FileText } from 'lucide-react';
import DocumentViewer from '@/components/global/dashboard/document-viewer';

/**
 * Admin oversight of one agency's e-signature activity.
 *
 * Admins can already open a caregiver's uploaded credentials, but had no way to
 * see what an agency asked those caregivers to sign, or to read back a signed
 * copy. That left the signed artefact — the file an audit actually asks for —
 * visible only to the two parties.
 *
 * Read-only by design. Admin reviews the record; it does not step into the
 * agency/caregiver relationship.
 */

interface LibraryDoc {
  _id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  version: number;
  status: 'active' | 'removed';
  uploadedAt: string;
}

interface PacketItem {
  title: string;
  fileName?: string;
  status: 'pending' | 'signed' | 'outdated';
  version: number;
  signedAt: string | null;
  signedFileUrl: string | null;
}

interface Packet {
  _id: string;
  caregiverName: string;
  role: string;
  status: 'pending' | 'completed';
  startedAt: string;
  completedAt: string | null;
  items: PacketItem[];
}

interface Overview {
  library: Array<{ role: string; documents: LibraryDoc[] }>;
  packets: Packet[];
  totals: { documents: number; caregivers: number; fullySigned: number };
}

const when = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const size = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ItemStatus: React.FC<{ status: PacketItem['status'] }> = ({ status }) => {
  const map: Record<string, string> = {
    signed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    outdated: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  const label =
    status === 'signed' ? 'Signed' : status === 'pending' ? 'To sign' : 'Outdated';
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[status]}`}
    >
      {label}
    </span>
  );
};

export default function AdminAgencyDocuments({ agencyId }: { agencyId: string }) {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!agencyId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/admin/agency-documents/${agencyId}`);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || json?.status !== 200) {
          // Deliberately our own words. The backend's message here is HTTP
          // boilerplate — an admin reading "Not Found" learns nothing about
          // what to do.
          setError(
            "Couldn't load this agency's signing documents. Refresh to try again."
          );
          return;
        }
        setData(json.data);
      } catch {
        if (!cancelled) setError('Could not load the agency documents');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agencyId]);

  const uploaded = (data?.library || []).flatMap((g) =>
    g.documents.map((d) => ({ ...d, role: g.role }))
  );

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <FileSignature className='size-5 text-muted-foreground' />
        <h2 className='text-lg font-semibold'>Signing documents</h2>
        {data && (
          <span className='text-xs text-muted-foreground'>
            {data.totals.documents} uploaded · {data.totals.caregivers} caregivers sent ·{' '}
            {data.totals.fullySigned} fully signed
          </span>
        )}
      </div>

      {loading && (
        <div className='flex items-center justify-center py-8 text-sm text-muted-foreground'>
          <Clock className='mr-2 size-4 animate-spin' />
          Loading signing documents…
        </div>
      )}

      {!loading && error && <div className='py-4 text-sm text-red-500'>{error}</div>}

      {!loading && !error && data && uploaded.length === 0 && (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-muted-foreground'>
          <FileText className='mb-2 size-10 opacity-40' />
          <p className='text-sm'>This agency has not uploaded any signing documents</p>
        </div>
      )}

      {!loading && !error && uploaded.length > 0 && (
        <>
          {/* What the agency uploaded */}
          <div className='overflow-hidden rounded-xl border'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b bg-gray-50'>
                  <th className='px-4 py-3 text-left font-medium text-muted-foreground'>Document</th>
                  <th className='px-4 py-3 text-left font-medium text-muted-foreground'>For</th>
                  <th className='px-4 py-3 text-left font-medium text-muted-foreground'>Uploaded</th>
                  <th className='px-4 py-3 text-right font-medium text-muted-foreground'>Review</th>
                </tr>
              </thead>
              <tbody>
                {uploaded.map((d) => (
                  <tr key={d._id} className='border-b transition-colors last:border-b-0 hover:bg-gray-50/50'>
                    <td className='px-4 py-3'>
                      <div className='flex flex-col'>
                        <span className='font-medium text-tertiary'>{d.fileName}</span>
                        <span className='text-xs text-muted-foreground'>
                          v{d.version}
                          {size(d.fileSize) ? ` · ${size(d.fileSize)}` : ''}
                          {/* A removed document stays listed: an agency must not be
                              able to erase what caregivers already signed. */}
                          {d.status === 'removed' ? ' · removed by the agency' : ''}
                        </span>
                      </div>
                    </td>
                    <td className='px-4 py-3 text-tertiary'>{d.role}</td>
                    <td className='px-4 py-3 text-muted-foreground'>{when(d.uploadedAt)}</td>
                    <td className='px-4 py-3 text-right'>
                      <DocumentViewer
                        documents={{ _id: d._id, url: d.fileUrl, title: d.fileName }}
                        title={d.fileName}
                      >
                        <button
                          type='button'
                          aria-label={`Preview ${d.fileName}`}
                          title='Preview'
                          className='inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-100 hover:text-tertiary'
                        >
                          <Eye className='size-4' />
                        </button>
                      </DocumentViewer>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* What came back signed */}
          {(data?.packets?.length ?? 0) > 0 && (
            <div className='flex flex-col gap-3'>
              <h3 className='text-sm font-semibold text-tertiary'>Signed by caregivers</h3>
              {(data?.packets ?? []).map((p) => (
                <div key={p._id} className='rounded-xl border'>
                  <div className='flex flex-wrap items-center gap-2 border-b bg-gray-50 px-4 py-2.5'>
                    <span className='font-medium text-tertiary'>{p.caregiverName}</span>
                    <span className='text-xs text-muted-foreground'>{p.role}</span>
                    <span
                      className={`ml-auto rounded-full border px-2 py-0.5 text-xs font-medium ${
                        p.status === 'completed'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {p.status === 'completed' ? 'Fully signed' : 'In progress'}
                    </span>
                  </div>
                  <ul className='divide-y'>
                    {p.items.map((it, i) => (
                      <li key={i} className='flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm'>
                        <span className='min-w-0 flex-1 truncate text-tertiary'>{it.title}</span>
                        <span className='text-xs text-muted-foreground'>{when(it.signedAt)}</span>
                        <ItemStatus status={it.status} />
                        {it.signedFileUrl ? (
                          <DocumentViewer
                            documents={{ _id: `${p._id}-${i}`, url: it.signedFileUrl, title: it.title }}
                            title={`${it.title} — signed by ${p.caregiverName}`}
                          >
                            <button
                              type='button'
                              aria-label={`Preview the signed ${it.title}`}
                              title='Preview signed copy'
                              className='inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-100 hover:text-tertiary'
                            >
                              <Eye className='size-4' />
                            </button>
                          </DocumentViewer>
                        ) : (
                          <span className='inline-block size-8 shrink-0' />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
