'use client';

// SCRUM-109: admin "Credential confirmation" section.
// Rebuilt to Faisal's design: one card per credential, showing the fields we
// extracted from the document, a status pill, a match chip where a source was
// checked, and the admin actions. PCA is one card containing two documents.

import React, { useEffect, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { getUserDocuments } from '@/app/actions';
import { formatCredentialDate } from '@/lib/credential-date';
import { ALERT_MARK, BADGE_TONE, getCredentialExpiry } from '@/lib/credential-expiry';
import {
  CREDENTIAL_DISPLAY_ORDER,
  isPrimaryCredentialRow,
  type CertificatePart,
} from '@/lib/credential-config';
import AdminVerifyModal from './admin-verify-modal';
import MarkNotConfirmedModal, { AiSuggestion } from './mark-not-confirmed-modal';
import type { RejectionReasonCode } from '@/lib/rejection-reasons';
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
  part?: CertificatePart;
  /** What the AI read off the file, when it has been read. Suggestion only. */
  aiExtraction?: {
    suggestion?: 'approve' | 'reject';
    suggestedReasonCode?: string | null;
    caregiverMessage?: string;
    confidence?: number | null;
  };
}

/* ---------------------------------------------------------------- helpers */

// SCRUM-176: the rest of the product keys credentials by type in a forEach and
// so keeps the LAST matching row — app/actions.ts#getCredentialStatus, the
// backend's document.service, share-unlock.service.ts and
// calculateProCompletion. share-unlock.service.ts records why: taking the first
// row "would disagree with the card whenever a caregiver has an older duplicate
// of a credential". This screen took the first, so with a duplicate row the
// admin reviewed one file while the agency, the caregiver's card, the share
// gate and the completion percentage all read another — that is how an approved
// credential and the file an agency opens drifted apart. The predicate stays
// isPrimaryCredentialRow, so SCRUM-165 still keeps the PCA sign-off out.
const lastPrimaryRow = (docs: Document[]): Document | undefined => {
  for (let i = docs.length - 1; i >= 0; i -= 1) {
    if (isPrimaryCredentialRow(docs[i])) return docs[i];
  }
  return undefined;
};

// SCRUM-138: `fmt` is for credential calendar dates (issue, expiration), which
// are stored as UTC midnight and must render in UTC — local time showed every
// US admin the day before, while the edit modal showed the stored day, so the
// two disagreed by one. `fmtMoment` is for real timestamps such as createdAt,
// which are correctly shown in the viewer's own timezone.
const fmt = (d?: string) => formatCredentialDate(d, 'short', '—');

const fmtMoment = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    : '—';

type Tone = 'confirmed' | 'pending' | 'notConfirmed' | 'missing' | 'neutral' | 'due' | 'expired';

/*
 * SCRUM-136: Faisal's accessibility fix landed on the caregiver/agency card only;
 * this screen kept the old pairs, which fail WCAG AA at 12px — Confirmed
 * #008000 on #BBF8DC (4.30:1, the exact pair Faisal named), Not confirmed
 * #D14343 on #FDE8E8 (3.89:1), Pending review #A9700B on #FEF6E7 (3.90:1). It
 * now uses the card's pairs: 10.09:1, 6.50:1 and 6.39:1.
 *
 * "Not uploaded" used to borrow the Pending review amber, so the two were
 * pixel-identical apart from the word. It takes the card's not-uploaded look
 * instead (red pair, dashed outline, dashed circle), and "Not confirmed" — the
 * admin's word for rejected — carries the same crossed circle as the card's
 * "Rejected", so one state has one mark on every screen.
 */
const PILL: Record<Tone, string> = {
  confirmed: BADGE_TONE.green,
  pending: BADGE_TONE.amber,
  due: BADGE_TONE.amber,
  notConfirmed: BADGE_TONE.red,
  missing: BADGE_TONE.red,
  expired: BADGE_TONE.red,
  neutral: 'bg-[#F2F4F3] text-[#008000]',
};

const PILL_MARK: Partial<Record<Tone, (typeof ALERT_MARK)[keyof typeof ALERT_MARK]>> = {
  notConfirmed: ALERT_MARK.rejected,
  missing: ALERT_MARK.missing,
  expired: ALERT_MARK.expired,
};

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const mark = PILL_MARK[tone];
  const Icon = mark?.Icon;
  // The dashed outline adds a pixel each side; take it off the padding so the
  // pill stays the height of its neighbours.
  const shape = mark?.outline
    ? 'border border-dashed border-current px-[9px] py-[5px]'
    : 'px-2.5 py-1.5';
  return (
    <span
      data-testid='admin-credential-pill'
      data-tone={tone}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full text-xs font-medium leading-[18px] ${shape} ${PILL[tone]}`}
    >
      {Icon && <Icon aria-hidden className='size-3 shrink-0' strokeWidth={2.25} />}
      {children}
    </span>
  );
}

/** Chip under the fields, e.g. "API match complete". */
function Chip({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex w-fit self-start items-center rounded-full px-2.5 py-1.5 text-xs font-medium leading-[18px] ${
        // SCRUM-136: the match chip used Faisal's failing Confirmed pair too.
        ok ? BADGE_TONE.green : 'bg-[#F9F9FA] text-[#6C6C6C]'
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

type CredentialState = 'confirmed' | 'pending' | 'notConfirmed' | 'expired';

interface CredentialMeta {
  title: string;
  fields: FieldDef[];
  /** Copy under the title, by state. */
  subtitle: (state: CredentialState) => string;
  /** Chip shown under the fields once we have extracted data. */
  chip?: (state: CredentialState) => { text: string; ok: boolean } | null;
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
    // SCRUM-135: an "INITIAL RESULT: Negative" row used to lead this list. It was
    // hard-coded — no TB result is stored anywhere — so the admin confirming a
    // credential was shown a negative result nobody had entered. Removed until a
    // real result field exists.
    // SCRUM-182: the two dates used to be relabelled "SERVICE DATE" and
    // "INITIAL EXPIRATION" here. Neither field exists — a document row carries
    // one credentialIssueDate and one credentialExpirationDate, which is what
    // the Confirm Credential modal writes — and on an annually renewed test
    // "INITIAL EXPIRATION" reads as the expiry of the FIRST test, an older and
    // different thing from the expiry the admin just confirmed. Same names as
    // STANDARD_FIELDS and as the caregiver's card: one value, one name.
    // CLINIC / LAB stays; it is not a date, it just names the issuer of a lab
    // result more precisely.
    fields: [
      { label: 'ISSUED', get: (d) => fmt(d.credentialIssueDate) },
      { label: 'EXPIRATION', get: expiryText },
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
      // SCRUM-149: same name as the edit form and the caregiver's card.
      { label: 'ISSUING ORGANIZATION', get: (d) => d.issuingOrganization },
      { label: 'ISSUED', get: (d) => fmt(d.credentialIssueDate) },
      { label: 'EXPIRATION', get: expiryText },
    ],
    subtitle: () => 'Matched automatically against the state licensing source.',
    chip: (s) => (s === 'confirmed' ? { text: 'API match complete', ok: false } : null),
    viewLabel: 'View source',
  },
  auto_insurance: {
    title: 'Auto Insurance',
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

// SCRUM-159: an approved credential whose date has passed reads "Expired" on
// the caregiver's card, the agency's card and in the share gate; this screen
// read only reviewStatus and kept calling it "Confirmed".
const stateOf = (d?: Document): CredentialState => {
  if (d?.reviewStatus === 'rejected') return 'notConfirmed';
  if (d?.reviewStatus !== 'approved') return 'pending';
  if (!d.hasNoExpiration && getCredentialExpiry(d.credentialExpirationDate, Date.now()).expired) {
    return 'expired';
  }
  return 'confirmed';
};

const STATE_PILL: Record<CredentialState, { tone: Tone; text: string }> = {
  confirmed: { tone: 'confirmed', text: 'Confirmed' },
  pending: { tone: 'pending', text: 'Pending review' },
  notConfirmed: { tone: 'notConfirmed', text: 'Not confirmed' },
  expired: { tone: 'expired', text: 'Expired' },
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
          <Pill tone='missing'>Not uploaded</Pill>
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
        // SCRUM-136 baseline: #D14343 on this tint was 4.00:1; the card's
        // rejection box uses #A32219 (6.57:1).
        <div className='rounded-lg bg-[#FDECEC] px-4 py-3'>
          <p className='text-[13px] font-semibold leading-5 text-[#A32219]'>In-correct Information</p>
          <p className='mt-0.5 text-xs leading-[18px] text-[#A32219]'>{doc.rejectionReason}</p>
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
      // SCRUM-165: a legacy certificate has no `part`, so fall back to the
      // primary row — never docs[0]. When the sign-off was uploaded first it
      // was docs[0] and filled BOTH slots, so Confirm on the exam approved the
      // sign-off.
      doc: docs.find((d) => d.part === 'written_exam') || lastPrimaryRow(docs),
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
                <Pill tone='missing'>Not uploaded</Pill>
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
                {s === 'confirmed' ? fmt(d.credentialIssueDate) : fmtMoment(d.createdAt)} ·{' '}
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
  /**
   * Bumped by the parent after "Run AI check" has decided a batch of
   * credentials, so this list reloads instead of showing what it read before
   * the run.
   */
  reloadKey?: number;
}

// SCRUM-155: the shared display order, not a private copy of it.
const ORDER: readonly string[] = CREDENTIAL_DISPLAY_ORDER;

const AdminCredentials: React.FC<AdminCredentialsProps> = ({ userId, role, reloadKey }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  // SCRUM-151 follow-on: until the documents arrive, every card used to read
  // "Not uploaded" — the admin's first impression of a fully uploaded
  // caregiver was that they had submitted nothing.
  const [loaded, setLoaded] = useState(false);
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
    aiSuggestion?: AiSuggestion;
  }>({ open: false, docId: '', label: '' });

  useEffect(() => {
    if (!userId) return;
    getUserDocuments(userId)
      .then((docs) => {
        if (docs) setDocuments(docs);
      })
      .finally(() => setLoaded(true));
  }, [userId, reloadKey]);

  const byType: Record<string, Document[]> = {};
  documents.forEach((d) => {
    (byType[d.documentType] ||= []).push(d);
  });

  const isPca = role === 'PCA';
  const required = ORDER.map((key) => ({ key, docs: byType[key] || [] }));
  // SCRUM-165: only the primary row confirms a credential. An approved PCA
  // sign-off on its own counted the certificate as confirmed and could turn
  // the header pill to Confirmed with the written exam still unreviewed.
  //
  // SCRUM-176: it has to be the SAME row the card below renders, judged the
  // same way. `some()` confirmed the credential if ANY primary row was
  // approved, so a caregiver with an older approved duplicate read "5 of 5
  // credentials confirmed" up here while the card underneath showed the newest
  // row as Pending review. And the count read reviewStatus raw where the card
  // reads `stateOf`, so an approved credential past its expiration date was
  // counted as confirmed here and printed Expired there. One row
  // (lastPrimaryRow, as everywhere else), one ladder (stateOf).
  const confirmedCount = required.filter(
    (r) => stateOf(lastPrimaryRow(r.docs)) === 'confirmed'
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
      // If the AI has already read this file, hand its opinion to the modal so
      // the reason and the caregiver message arrive filled in. The modal
      // ignores a reason that is not selectable for this credential, and the
      // admin can change either.
      aiSuggestion:
        doc.aiExtraction?.suggestion === 'reject' && doc.aiExtraction.suggestedReasonCode
          ? {
              reason: doc.aiExtraction.suggestedReasonCode as RejectionReasonCode,
              message: doc.aiExtraction.caregiverMessage,
              confidence: doc.aiExtraction.confidence ?? undefined,
            }
          : undefined,
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
            {loaded ? `${confirmedCount} of ${required.length} credentials confirmed` : 'Loading credentials…'}
          </p>
        </div>
        {loaded && (
          <Pill tone={allConfirmed ? 'confirmed' : 'pending'}>
            {allConfirmed ? 'Confirmed' : 'Review required'}
          </Pill>
        )}
      </div>

      <div className='flex flex-col gap-4'>
        {!loaded && (
          <p className='text-sm text-[#6C6C6C]'>Loading credentials…</p>
        )}
        {loaded && required.map(({ key, docs }) => {
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
              // SCRUM-165: a caregiver switched from PCA to CNA can still hold
              // a sign-off row; it must not be shown as the CNA certificate.
              doc={lastPrimaryRow(docs)}
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
        aiSuggestion={notConfirmedModal.aiSuggestion}
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
