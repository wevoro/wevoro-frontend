'use client';

import { useEffect, useState } from 'react';
import { Clock, Download, Eye, FileText } from 'lucide-react';
import DocumentPreviewModal from '@/components/global/dashboard/document-preview-modal';

/**
 * SCRUM-121 — "Documents for signature" on the admin agency record.
 *
 * Admins could open any caregiver's credentials but had no view of what an
 * agency asked those caregivers to sign. This is oversight only: view, preview,
 * download. No approve, no reject, and deliberately no per-document signature
 * status — signing is per caregiver, so one chip on a document row would claim
 * something that is not true of every caregiver holding it.
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
  role: string;
}

interface Overview {
  library: Array<{ role: string; documents: Omit<LibraryDoc, 'role'>[] }>;
  totals: { documents: number; caregivers: number; fullySigned: number };
}

const KB = 1024;

const prettySize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < KB * KB) return `${Math.round(bytes / KB)} KB`;
  return `${(bytes / (KB * KB)).toFixed(1)} MB`;
};

const extensionOf = (name: string) => (name?.split('.').pop() || '').toUpperCase();

const badgeLabel = (name: string) => {
  const ext = extensionOf(name);
  return ext === 'DOCX' ? 'DOC' : ext || 'FILE';
};

export default function AdminAgencyDocuments({
  agencyId,
  agencyName,
}: {
  agencyId: string;
  agencyName?: string;
}) {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<LibraryDoc | null>(null);

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
          setError(
            "Couldn't load this agency's documents. Refresh to try again."
          );
          return;
        }
        setData(json.data);
      } catch {
        if (!cancelled) {
          setError("Couldn't load this agency's documents. Refresh to try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agencyId]);

  const documents: LibraryDoc[] = (data?.library || []).flatMap((g) =>
    g.documents.map((d) => ({ ...d, role: g.role }))
  );

  return (
    <div className='flex flex-col gap-5 rounded-xl bg-[#F9F9FA] p-5'>
      <div className='flex flex-col gap-1'>
        <h2 className='text-[20px] font-semibold text-[#1C1C1C]'>
          Documents for signature
        </h2>
        <p className='text-[14px] text-[#6C6C6C]'>
          Uploaded by the agency for caregivers to e-sign. Preview or download each
          file.
        </p>
      </div>

      {loading && (
        <div className='flex items-center justify-center py-8 text-[14px] text-[#6C6C6C]'>
          <Clock className='mr-2 size-4 animate-spin' />
          Loading documents…
        </div>
      )}

      {!loading && error && <p className='py-2 text-[14px] text-[#A72019]'>{error}</p>}

      {!loading && !error && documents.length === 0 && (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DFE2E0] bg-white py-8 text-[#6C6C6C]'>
          <FileText className='mb-2 size-9 opacity-40' />
          <p className='text-[14px]'>
            This agency has not uploaded any documents for signature
          </p>
        </div>
      )}

      {!loading && !error && documents.length > 0 && (
        <div className='flex flex-col gap-3'>
          {documents.map((d) => (
            <div
              key={d._id}
              className='flex items-center gap-4 rounded-[10px] border border-[#DFE2E0] bg-white px-4 py-3.5'
            >
              <span
                className='flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#E94435] text-[11px] font-bold text-white'
                aria-hidden='true'
              >
                {badgeLabel(d.fileName)}
              </span>

              <div className='min-w-0 flex-1'>
                <p className='truncate text-[16px] font-semibold text-[#1C1C1C]'>
                  {d.title || d.fileName}
                </p>
                <p className='truncate text-[13.5px] text-[#6C6C6C]'>
                  {[
                    extensionOf(d.fileName) === 'DOCX' ? 'DOCX' : extensionOf(d.fileName),
                    prettySize(d.fileSize),
                    d.role,
                    // An agency can pull a document after caregivers have signed
                    // it. The row stays, marked, so the record cannot be erased.
                    d.status === 'removed' ? 'removed by the agency' : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              <div className='flex shrink-0 items-center gap-2'>
                <button
                  type='button'
                  onClick={() => setPreview(d)}
                  aria-label={`Preview ${d.fileName}`}
                  title='Preview'
                  className='flex size-10 items-center justify-center rounded-lg border border-[#DFE2E0] text-[#1C1C1C] transition-colors hover:bg-[#F9F9FA]'
                >
                  <Eye className='size-5' />
                </button>
                <a
                  href={d.fileUrl}
                  download={d.fileName}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={`Download ${d.fileName}`}
                  title='Download'
                  className='flex size-10 items-center justify-center rounded-lg border border-[#DFE2E0] text-[#1C1C1C] transition-colors hover:bg-[#F9F9FA]'
                >
                  <Download className='size-5' />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <DocumentPreviewModal
          open
          onOpenChange={(v) => !v && setPreview(null)}
          fileName={preview.fileName}
          fileUrl={preview.fileUrl}
          fileSize={preview.fileSize}
          uploadedBy={agencyName}
          uploadedAt={preview.uploadedAt}
          readOnly
        />
      )}
    </div>
  );
}
