'use client';

// SCRUM-109: admin "Credential confirmation" section.
// Rebuilt to Faisal's design: one card per credential, showing the fields we
// extracted from the document, a status pill, a match chip where a source was
// checked, and the admin actions. PCA is one card containing two documents.

import React, { useEffect, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { getUserDocuments } from '@/app/actions';
import AdminVerifyModal from './admin-verify-modal';
import MarkNotConfirmedModal from './mark-not-confirmed-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  _id: string;
  title: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  category: string;
  documentType: string;
  reviewStatus?: 'pending' | 'approved' | 'rejected';
  credentialIdNumber?: string;
  credentialIssueDate?: string;
  credentialExpirationDate?: string;
  issuingOrganization?: string;
  rejectionReason?: string;
  replacementRequested?: boolean;
  hasNoExpiration?: boolean;
  wevoroCredentialId?: string;
  part?: 'written_exam' | 'practical_signoff';
}

/* ---------------------------------------------------------------- helpers */

const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : '—';

type Tone = 'confirmed' | 'pending' | 'notConfirmed' | 'neutral' | 'due';

const PILL: Record<Tone, string> = {
  confirmed: 'bg-[#BBF8DC] text-[#008000]',
  pending: 'bg-[#FEF6E7] text-[#A9700B]',
  due: 'bg-[#FEF6E7] text-[#A9700B]',
  notConfirmed: 'bg-[#FDE8E8] text-[#D14343]',
  neutral: 'bg-[#F2F4F3] text-[#008000]',
};

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1.5 text-xs font-medium leading-[18px] ${PILL[tone]}`}
    >
      {children}
    </span>
  );
}

/** Chip under the fields, e.g. "API match complete". */
function Chip({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex w-fit self-start items-center rounded-full px-2.5 py-1.5 text-xs font-medium leading-[18px] ${
        ok ? 'bg-[#BBF8DC] text-[#008000]' : 'bg-[#F9F9FA] text-[#6C6C6C]'
      }`}
    >
      {children}
    </span>
  );
}

function OutlineButton({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const cls =
    'inline-flex h-[38px] items-center justify-center rounded-[10px] border border-[#B0BCB8] bg-white px-3.5 text-[13px] font-medium leading-5 text-[#1C1C1C] transition-colors hover:bg-gray-50';
  if (href) {
    return (
      <a href={href} target='_blank' rel='noopener noreferrer' className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type='button' onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/** The ••• menu on a confirmed credential. */
function MoreMenu({ onEdit, onUndo }: { onEdit: () => void; onUndo: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className='inline-flex h-[38px] w-[47px] items-center justify-center rounded-[10px] border border-[#B0BCB8] bg-white text-[#1C1C1C] transition-colors hover:bg-gray-50'
        >
          <MoreHorizontal className='size-4' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-56'>
        <DropdownMenuItem onClick={onEdit} className='cursor-pointer'>
          Edit extracted information
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onUndo}
          className='cursor-pointer text-red-600 focus:text-red-600'
        >
          Undo confirmation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className='flex flex-col gap-1'>
      <span className='text-xs font-medium leading-[18px] text-[#5E6864]'>{label}</span>
      <span className='text-sm font-normal leading-[21px] text-[#1C1C1C]'>{value || '—'}</span>
    </div>
  );
}

/* ------------------------------------------------- per-credential config */

type FieldDef = { label: string; get: (d: Document) => string | undefined };

interface CredentialMeta {
  title: string;
  fields: FieldDef[];
  /** Copy under the title, by state. */
  subtitle: (state: 'confirmed' | 'pending' | 'notConfirmed') => string;
  /** Chip shown under the fields once we have extracted data. */
  chip?: (state: 'confirmed' | 'pending' | 'notConfirmed') => { text: string; ok: boolean } | null;
  /** Label of the primary action. */
  viewLabel: string;
}

const expiryText = (d: Document) =>
  d.hasNoExpiration ? 'No expiration' : fmt(d.credentialExpirationDate);

const STANDARD_FIELDS: FieldDef[] = [
  { label: 'CERTIFICATE ID', get: (d) => d.credentialIdNumber },
  { label: 'ISSUED', get: (d) => fmt(d.credentialIssueDate) },
  { label: 'EXPIRATION', get: expiryText },
  { label: 'ISSUING ORGANIZATION', get: (d) => d.issuingOrganization },
];

const META: Record<string, CredentialMeta> = {
  certifications: {
    title: 'CNA Certification',
    fields: STANDARD_FIELDS,
    subtitle: (s) =>
      s === 'confirmed'
        ? 'Certification confirmed against the registry record.'
        : s === 'notConfirmed'
          ? 'Uploaded certificate does not meet the required credential.'
          : 'Fields extracted successfully. Confirmation is still in progress.',
    viewLabel: 'View document',
  },
  cpr_test: {
    title: 'CPR & First Aid',
    fields: STANDARD_FIELDS,
    subtitle: (s) =>
      s === 'confirmed'
        ? 'CPR and First Aid requirements confirmed.'
        : s === 'notConfirmed'
          ? 'Uploaded certificate does not meet the required credential.'
          : 'Fields extracted successfully. Confirmation is still in progress.',
    viewLabel: 'View document',
  },
  tb_tests: {
    title: 'TB Test',
    fields: [
      { label: 'INITIAL RESULT', get: () => 'Negative' },
      { label: 'SERVICE DATE', get: (d) => fmt(d.credentialIssueDate) },
      { label: 'INITIAL EXPIRATION', get: expiryText },
      { label: 'CLINIC / LAB', get: (d) => d.issuingOrganization },
    ],
    subtitle: (s) =>
      s === 'confirmed'
        ? 'Initial test and annual screening are current.'
        : 'Initial test is the anchor record. Annual screenings are linked below it.',
    viewLabel: 'Review record',
  },
  driver_license: {
    title: "Driver's License",
    fields: [
      { label: 'LICENSE NUMBER', get: (d) => d.credentialIdNumber },
      { label: 'STATE', get: (d) => d.issuingOrganization },
      { label: 'ISSUED', get: (d) => fmt(d.credentialIssueDate) },
      { label: 'EXPIRATION', get: expiryText },
    ],
    subtitle: () => 'Matched automatically against the state licensing source.',
    chip: (s) => (s === 'confirmed' ? { text: 'API match complete', ok: false } : null),
    viewLabel: 'View source',
  },
  auto_insurance: {
    title: 'Car Insurance',
    fields: [
      { label: 'POLICY NUMBER', get: (d) => d.credentialIdNumber },
      { label: 'CARRIER', get: (d) => d.issuingOrganization },
      { label: 'EFFECTIVE', get: (d) => fmt(d.credentialIssueDate) },
      { label: 'EXPIRATION', get: expiryText },
    ],
    subtitle: (s) =>
      s === 'confirmed'
        ? 'Policy confirmed against the carrier record.'
        : 'Fields extracted successfully. Confirmation is still in progress.',
    chip: (s) =>
      s === 'confirmed'
        ? { text: 'Carrier match complete', ok: true }
        : { text: 'Extraction complete', ok: false },
    viewLabel: 'View document',
  },
};

const stateOf = (d?: Document): 'confirmed' | 'pending' | 'notConfirmed' =>
  d?.reviewStatus === 'approved'
    ? 'confirmed'
    : d?.reviewStatus === 'rejected'
      ? 'notConfirmed'
      : 'pending';

const STATE_PILL: Record<'confirmed' | 'pending' | 'notConfirmed', { tone: Tone; text: string }> = {
  confirmed: { tone: 'confirmed', text: 'Confirmed' },
  pending: { tone: 'pending', text: 'Pending review' },
  notConfirmed: { tone: 'notConfirmed', text: 'Not confirmed' },
};

/* ------------------------------------------------------------ the card */

interface CardProps {
  meta: CredentialMeta;
  doc?: Document;
  onConfirm: (doc: Document, label: string) => void;
  onNotConfirmed: (doc: Document, label: string, key: string) => void;
  credentialKey: string;
}

function CredentialCard({ meta, doc, onConfirm, onNotConfirmed, credentialKey }: CardProps) {
  if (!doc) {
    return (
      <div className='rounded-xl border border-[#DFE2E0] bg-white p-5'>
        <div className='flex items-center gap-3'>
          <h4 className='flex-1 text-base font-semibold leading-6 text-[#1C1C1C]'>{meta.title}</h4>
          <Pill tone='pending'>Not uploaded</Pill>
        </div>
        <p className='mt-1 text-[13px] leading-5 text-[#6C6C6C]'>
          The caregiver has not uploaded this document yet.
        </p>
      </div>
    );
  }

  const state = stateOf(doc);
  const pill = STATE_PILL[state];
  const chip = meta.chip?.(state);
  const hasFields = !!doc.credentialIssueDate;

  return (
    <div className='flex flex-col gap-4 rounded-xl border border-[#DFE2E0] bg-white p-5'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-3'>
          <h4 className='flex-1 text-base font-semibold leading-6 text-[#1C1C1C]'>{meta.title}</h4>
          {state === 'notConfirmed' && doc.replacementRequested && (
            <Pill tone='due'>Replacement requested</Pill>
          )}
          <Pill tone={pill.tone}>{pill.text}</Pill>
        </div>
        <p className='text-[13px] leading-5 text-[#6C6C6C]'>{meta.subtitle(state)}</p>
      </div>

      {/* Why it was not confirmed */}
      {state === 'notConfirmed' && doc.rejectionReason && (
        <div className='rounded-lg bg-[#FDECEC] px-4 py-3'>
          <p className='text-[13px] font-semibold leading-5 text-[#D14343]'>In-correct Information</p>
          <p className='mt-0.5 text-xs leading-[18px] text-[#D14343]'>{doc.rejectionReason}</p>
        </div>
      )}

      {hasFields && (
        <div className='flex flex-wrap gap-x-10 gap-y-3'>
          {meta.fields.map((f) => (
            <Field key={f.label} label={f.label} value={f.get(doc)} />
          ))}
        </div>
      )}

      {chip && <Chip ok={chip.ok}>{chip.text}</Chip>}

      <div className='flex flex-wrap items-center gap-2.5'>
        <OutlineButton href={doc.url}>{meta.viewLabel}</OutlineButton>
        {state === 'confirmed' ? (
          <MoreMenu
            onEdit={() => onConfirm(doc, meta.title)}
            onUndo={() => onNotConfirmed(doc, meta.title, credentialKey)}
          />
        ) : state === 'notConfirmed' ? (
          <OutlineButton onClick={() => onConfirm(doc, meta.title)}>Confirm</OutlineButton>
        ) : (
          <>
            <button
              type='button'
              onClick={() => onConfirm(doc, meta.title)}
              className='inline-flex h-[38px] items-center justify-center rounded-[10px] bg-[#008000] px-4 text-[13px] font-medium leading-5 text-white transition-colors hover:bg-[#026a02]'
            >
              Confirm
            </button>
            <button
              type='button'
              onClick={() => onNotConfirmed(doc, meta.title, credentialKey)}
              className='inline-flex h-[38px] items-center justify-center rounded-[10px] border border-[#E7A6A6] bg-white px-4 text-[13px] font-medium leading-5 text-[#D14343] transition-colors hover:bg-red-50'
            >
              Not confirmed
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------- PCA: one card, two documents */

function PcaCard({
  docs,
  onConfirm,
  onNotConfirmed,
}: {
  docs: Document[];
  onConfirm: (doc: Document, label: string) => void;
  onNotConfirmed: (doc: Document, label: string, key: string) => void;
}) {
  const parts: { key: string; label: string; doc?: Document }[] = [
    {
      key: 'written_exam',
      label: 'Written exam',
      doc: docs.find((d) => d.part === 'written_exam') || docs[0],
    },
    {
      key: 'practical_signoff',
      label: 'RN/LPN practical sign-off',
      doc: docs.find((d) => d.part === 'practical_signoff'),
    },
  ];
  const present = parts.filter((p) => p.doc);
  const confirmed = present.filter((p) => stateOf(p.doc) === 'confirmed').length;
  const allConfirmed = present.length > 0 && confirmed === present.length;

  return (
    <div className='flex flex-col gap-3 rounded-xl border border-[#DFE2E0] bg-white p-5'>
      <div className='flex flex-col gap-1'>
        <div className='flex items-center gap-3'>
          <h4 className='flex-1 text-base font-semibold leading-6 text-[#1C1C1C]'>
            PCA Certification
          </h4>
          <Pill tone={allConfirmed ? 'confirmed' : 'pending'}>
            {allConfirmed ? 'Confirmed' : 'Pending review'}
          </Pill>
        </div>
        <p className='text-[13px] leading-5 text-[#6C6C6C]'>
          Two required documents · {confirmed} of {present.length || 2} confirmed
        </p>
      </div>

      <div className='h-px w-full bg-[#DFE2E0]' />

      {parts.map((part) => {
        const d = part.doc;
        if (!d) {
          return (
            <div key={part.key} className='flex flex-col gap-3 py-1'>
              <div className='flex items-center gap-3'>
                <span className='flex-1 text-sm font-medium leading-[21px] text-[#1C1C1C]'>
                  {part.label}
                </span>
                <Pill tone='pending'>Not uploaded</Pill>
              </div>
            </div>
          );
        }
        const s = stateOf(d);
        return (
          <div key={part.key} className='flex flex-col gap-3 py-1'>
            <div>
              <div className='flex items-center gap-3'>
                <span className='flex-1 text-sm font-medium leading-[21px] text-[#1C1C1C]'>
                  {part.label}
                </span>
                <Pill tone={STATE_PILL[s].tone}>{STATE_PILL[s].text}</Pill>
              </div>
              <p className='text-xs leading-[18px] text-[#6C6C6C]'>
                Document ID: {d.credentialIdNumber || '—'} ·{' '}
                {s === 'confirmed' ? 'Issued' : 'Uploaded'}{' '}
                {fmt(s === 'confirmed' ? d.credentialIssueDate : d.createdAt)} ·{' '}
                {d.hasNoExpiration ? 'No official expiration date' : fmt(d.credentialExpirationDate)}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-2.5'>
              <OutlineButton href={d.url}>View document</OutlineButton>
              {s === 'confirmed' ? (
                <MoreMenu
                  onEdit={() => onConfirm(d, part.label)}
                  onUndo={() => onNotConfirmed(d, part.label, 'certifications')}
                />
              ) : (
                <>
                  <button
                    type='button'
                    onClick={() => onConfirm(d, part.label)}
                    className='inline-flex h-[38px] items-center justify-center rounded-[10px] bg-[#008000] px-4 text-[13px] font-medium leading-5 text-white transition-colors hover:bg-[#026a02]'
                  >
                    Confirm
                  </button>
                  <button
                    type='button'
                    onClick={() => onNotConfirmed(d, part.label, 'certifications')}
                    className='inline-flex h-[38px] items-center justify-center rounded-[10px] border border-[#E7A6A6] bg-white px-4 text-[13px] font-medium leading-5 text-[#D14343] transition-colors hover:bg-red-50'
                  >
                    Not confirmed
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------- the section */

interface AdminCredentialsProps {
  userId: string;
  /** SCRUM-60: caregiver role drives CNA vs PCA. */
  role?: string | null;
}

const ORDER = ['certifications', 'cpr_test', 'tb_tests', 'driver_license', 'auto_insurance'];

const AdminCredentials: React.FC<AdminCredentialsProps> = ({ userId, role }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [verifyModal, setVerifyModal] = useState<{
    open: boolean;
    docId: string;
    label: string;
    existingData?: Record<string, any>;
  }>({ open: false, docId: '', label: '' });
  const [notConfirmedModal, setNotConfirmedModal] = useState<{
    open: boolean;
    docId: string;
    label: string;
    credentialKey?: string;
    credentialIdNumber?: string;
    uploadedAt?: string;
  }>({ open: false, docId: '', label: '' });

  useEffect(() => {
    if (!userId) return;
    getUserDocuments(userId).then((docs) => {
      if (docs) setDocuments(docs);
    });
  }, [userId]);

  const byType: Record<string, Document[]> = {};
  documents.forEach((d) => {
    (byType[d.documentType] ||= []).push(d);
  });

  const isPca = role === 'PCA';
  const required = ORDER.map((key) => ({ key, docs: byType[key] || [] }));
  const confirmedCount = required.filter((r) =>
    r.docs.some((d) => d.reviewStatus === 'approved')
  ).length;
  const allConfirmed = confirmedCount === required.length;

  const openConfirm = (doc: Document, label: string) =>
    setVerifyModal({
      open: true,
      docId: doc._id,
      label,
      existingData: {
        credentialIdNumber: doc.credentialIdNumber,
        credentialIssueDate: doc.credentialIssueDate,
        credentialExpirationDate: doc.credentialExpirationDate,
        issuingOrganization: doc.issuingOrganization,
        hasNoExpiration: doc.hasNoExpiration,
      },
    });

  const openNotConfirmed = (doc: Document, label: string, key: string) =>
    setNotConfirmedModal({
      open: true,
      docId: doc._id,
      label,
      credentialKey: key,
      credentialIdNumber: doc.credentialIdNumber,
      uploadedAt: doc.createdAt,
    });

  const patchDoc = (id: string, patch: Partial<Document>) =>
    setDocuments((prev) => prev.map((d) => (d._id === id ? { ...d, ...patch } : d)));

  return (
    <div className='flex flex-col gap-5 rounded-xl border border-[#DFE2E0] bg-white p-5'>
      <div className='flex items-center justify-between gap-6'>
        <div className='flex flex-col gap-1.5'>
          <h3 className='text-xl font-semibold leading-[30px] text-[#1C1C1C]'>
            Credential confirmation
          </h3>
          <p className='text-sm leading-[21px] text-[#6C6C6C]'>
            {confirmedCount} of {required.length} credentials confirmed
          </p>
        </div>
        <Pill tone={allConfirmed ? 'confirmed' : 'pending'}>
          {allConfirmed ? 'Confirmed' : 'Review required'}
        </Pill>
      </div>

      <div className='flex flex-col gap-4'>
        {required.map(({ key, docs }) => {
          if (key === 'certifications' && isPca) {
            return (
              <PcaCard
                key={key}
                docs={docs}
                onConfirm={openConfirm}
                onNotConfirmed={openNotConfirmed}
              />
            );
          }
          const meta = { ...META[key] };
          if (key === 'certifications' && !isPca) meta.title = 'CNA Certification';
          return (
            <CredentialCard
              key={key}
              credentialKey={key}
              meta={meta}
              doc={docs[0]}
              onConfirm={openConfirm}
              onNotConfirmed={openNotConfirmed}
            />
          );
        })}
      </div>

      <AdminVerifyModal
        open={verifyModal.open}
        onOpenChange={(open) => setVerifyModal((p) => ({ ...p, open }))}
        documentId={verifyModal.docId}
        credentialLabel={verifyModal.label}
        existingData={verifyModal.existingData}
        onSuccess={(data) =>
          patchDoc(verifyModal.docId, {
            reviewStatus: 'approved',
            reviewedAt: new Date().toISOString(),
            credentialIdNumber: data?.credentialIdNumber,
            credentialIssueDate: data?.credentialIssueDate,
            credentialExpirationDate: data?.credentialExpirationDate,
            issuingOrganization: data?.issuingOrganization,
            hasNoExpiration: data?.hasNoExpiration,
            wevoroCredentialId: data?.wevoroCredentialId,
          })
        }
      />

      <MarkNotConfirmedModal
        open={notConfirmedModal.open}
        onOpenChange={(open) => setNotConfirmedModal((p) => ({ ...p, open }))}
        documentId={notConfirmedModal.docId}
        credentialKey={notConfirmedModal.credentialKey}
        credentialLabel={notConfirmedModal.label}
        credentialIdNumber={notConfirmedModal.credentialIdNumber}
        uploadedAt={notConfirmedModal.uploadedAt}
        onSuccess={(data) =>
          patchDoc(notConfirmedModal.docId, {
            reviewStatus: 'rejected',
            rejectionReason: data?.rejectionReason,
            replacementRequested: data?.replacementRequested,
          })
        }
      />
    </div>
  );
};

export default AdminCredentials;
