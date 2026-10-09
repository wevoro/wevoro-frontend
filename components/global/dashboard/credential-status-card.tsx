'use client';

// SCRUM-110: caregiver-facing credential card, rebuilt to the new design.
// One row per credential: name + status on the left, the live "Expires On"
// countdown and the view action on the right, and the extracted fields
// underneath.
// SCRUM-176/177: the per-document privacy marker (globe / padlock) that used to
// sit beside the status is gone from this card on both sides. A caregiver no
// longer chooses who sees a single file — they choose who gets the profile
// link — so the icon only ever restated something that is no longer a choice.

import React, { useMemo } from 'react';
import {
  MoreVertical,
  RefreshCw,
  Trash2,
  CloudUpload,
  MoveUpRight,
  Lock,
  Clock,
  Calendar,
  Building2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CredentialStatus } from '@/lib/credential-config';
import { formatCredentialDate } from '@/lib/credential-date';
import {
  ALERT_MARK,
  BADGE_TONE,
  EXPIRY_BAND_STYLE,
  getCredentialExpiry,
  getExpiryUrgency,
  useExpiryClock,
  type CredentialExpiry,
} from '@/lib/credential-expiry';

// SCRUM-138: issue and expiration are calendar dates stored as UTC midnight.
// Formatting them in local time showed every US viewer the day before.
const formatDate = (dateStr?: string) => formatCredentialDate(dateStr, 'long', 'N/A');

/**
 * SCRUM-202: when the admin confirmed the credential. Deliberately NOT run
 * through formatCredentialDate — `reviewedAt` is a real timestamp, not a day
 * printed on a certificate, and SCRUM-138 pins those to UTC precisely because
 * they are calendar dates. Same shape as the dates above it ("September 17,
 * 2026"), read in the viewer's own timezone.
 */
const formatReviewedOn = (dateStr?: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/* ------------------------------------------------------------- statuses */

/**
 * The VERIFICATION pill — always shown. SCRUM-136 (final, 9/17) fixes its five
 * wordings: Not confirmed (nothing uploaded), Pending review, Rejected,
 * Confirmed, Expired. How close a Confirmed credential is to expiring is NOT a
 * verification state any more: it used to replace "Confirmed" with a static
 * yellow "Expires Soon" that could sit beside a red countdown, three signals
 * that disagreed. That now lives in the separate urgency pill below.
 */
export type CardStatus =
  | 'confirmed'
  | 'expired'
  | 'notConfirmed'
  | 'notUploaded'
  | 'pending';

/*
 * SCRUM-136 (Faisal, Figma 11002:3957): every badge used to fail WCAG AA at
 * 12px — Rejected was even red text on the same red. The tints stay; only the
 * text is darkened: Confirmed #01400F (10.1:1), Pending #7A5600 (6.5:1), and
 * Not confirmed / Rejected / Expired #A32219 (6.4:1). No new hues: #01400F is
 * already a project token, the other two are darker steps of the amber and red.
 *
 * Those three reds were then pixel-identical — only the word differed, which is
 * the very thing Faisal's audit flagged. Each now carries its own mark (see
 * ALERT_MARK): a crossed calendar for Expired, a crossed circle for Rejected,
 * and a dashed circle in a dashed outline for Not confirmed, the empty slot.
 * Colours and contrast are untouched.
 */
type StatusStyle = { text: string; cls: string; mark?: (typeof ALERT_MARK)[keyof typeof ALERT_MARK] };

const STATUS_STYLE: Record<CardStatus, StatusStyle> = {
  confirmed: { text: 'Confirmed', cls: BADGE_TONE.green },
  expired: { text: 'Expired', cls: BADGE_TONE.red, mark: ALERT_MARK.expired },
  // `notConfirmed` is the admin-rejected state; SCRUM-136 names it "Rejected".
  notConfirmed: { text: 'Rejected', cls: BADGE_TONE.red, mark: ALERT_MARK.rejected },
  // Nothing uploaded. The final badge sheet draws it in the red family too.
  notUploaded: { text: 'Not confirmed', cls: BADGE_TONE.red, mark: ALERT_MARK.missing },
  pending: { text: 'Pending review', cls: BADGE_TONE.amber },
};

// The dashed outline adds a pixel each side, so it takes a pixel off the
// padding to keep every pill in the row the same height.
const PILL_BASE =
  'inline-flex shrink-0 items-center gap-1 rounded-full text-xs font-medium leading-[18px]';
const PILL_PLAIN = 'px-2.5 py-0.5';
const PILL_OUTLINED = 'border border-dashed border-current px-[9px] py-px';

/** Now, as a default for callers that do not run the card's own clock. */
const expiryNow = (credential: CredentialStatus) =>
  getCredentialExpiry(credential.document?.credentialExpirationDate, Date.now());

/**
 * Resolve the badge a credential should carry. Exported so the PCA group can
 * tint itself. SCRUM-136: pass the credential's expiry when you have it, so the
 * badge is read from the same instant as the pill and countdown beside it.
 */
export function resolveCardStatus(
  credential: CredentialStatus,
  exp: CredentialExpiry = expiryNow(credential)
): CardStatus {
  const doc = credential.document;
  if (credential.state === 'not_uploaded') return 'notUploaded';
  if (credential.state === 'rejected') return 'notConfirmed';
  if (credential.state !== 'verified') return 'pending';
  if (!exp.hasExpiration || doc?.hasNoExpiration) return 'confirmed';
  if (exp.expired) return 'expired';
  return 'confirmed';
}

/**
 * SCRUM-136: the URGENCY pill. Only beside a Confirmed credential, only within
 * 60 days of expiring, and always the same colour as the countdown next to it
 * (yellow 30–60 days, red under 30). Hidden everywhere else, including past
 * expiry, where the verification pill already reads "Expired".
 *
 * AC1 by construction: the pill, the status and the countdown are all drawn
 * from ONE expiry value. It used to be worked out twice, each time reading
 * "now" on its own, so near a band boundary the two could disagree.
 */
export function getUrgencyPill(
  credential: CredentialStatus,
  exp: CredentialExpiry = expiryNow(credential)
): { text: string; cls: string; band: 'yellow' | 'red' } | null {
  if (resolveCardStatus(credential, exp) !== 'confirmed') return null;
  if (credential.document?.hasNoExpiration) return null;
  return getExpiryUrgency(exp);
}

/* --------------------------------------------------- per-credential fields */

interface FieldLabels {
  issued: string;
  expiration: string;
  issuer: string;
  viewAction: string;
}

const DEFAULT_FIELD_LABELS: FieldLabels = {
  issued: 'ISSUED DATE',
  expiration: 'EXPIRATION DATE',
  issuer: 'ISSUING ORGANIZATION',
  viewAction: 'View Credential',
};

const FIELD_LABELS_BY_KEY: Record<string, Partial<FieldLabels>> = {
  // SCRUM-182: the TB card used to rename both of its dates — the admin's
  // Issue Date as "SERVICE DATE" and the admin's Expiration Date as "INITIAL
  // EXPIRATION". Neither of those fields exists. A document row carries one
  // `credentialIssueDate` and one `credentialExpirationDate`, and the Confirm
  // Credential modal writes exactly those two; there is no service date and no
  // initial expiration anywhere in the model.
  //
  // A TB test is renewed annually, so "INITIAL EXPIRATION" reads as the expiry
  // of the FIRST test — a different, older thing than the expiry the admin has
  // just confirmed. That is how it was reported: the date and the "Expires On"
  // countdown beside it were both correct for the confirmed record (Nov 29
  // 2026 and 66 days agree), and the card still did not look like the record
  // the admin had confirmed, because it did not call it by that name.
  //
  // Same rule as SCRUM-149 below: one value, one name, and the name is the one
  // the admin panel and every other credential card already use.
  tb_tests: {
    issuer: 'CLINIC / LAB',
    viewAction: 'View Record',
  },
  // SCRUM-149: the driving licence used to label this field "STATE" while the
  // admin panel, and every other credential card, call the same value the
  // issuing organization. One value, one name.
  auto_insurance: { issuer: 'CARRIER' },
};

function getFieldLabels(key?: string): FieldLabels {
  return { ...DEFAULT_FIELD_LABELS, ...(FIELD_LABELS_BY_KEY[key || ''] || {}) };
}

/** Extra identifier shown inline beside the ID (licence/policy number, TB result). */
function getInlineExtra(
  key: string | undefined,
  doc: CredentialStatus['document']
): { label: string; value: string; accent?: boolean } | null {
  if (!doc) return null;
  if (key === 'driver_license' && doc.credentialIdNumber)
    return { label: 'LICENSE NUMBER', value: doc.credentialIdNumber };
  if (key === 'auto_insurance' && doc.credentialIdNumber)
    return { label: 'POLICY NUMBER', value: doc.credentialIdNumber };
  // SCRUM-135: TB Test used to return a hard-coded "INITIAL RESULT: Negative".
  // No test result is stored anywhere — the document model has no such field —
  // so every TB card on every surface asserted a negative result nobody had
  // entered or checked, including to agencies the SCRUM-99 tier gate had not
  // cleared to see health results at all. A result is not shown until one is
  // actually captured.
  return null;
}

/* ------------------------------------------------------------ the card */

interface CredentialStatusCardProps {
  credential: CredentialStatus;
  onUpdateVerification?: () => void;
  onRemove?: () => void;
  index?: number;
  /** Agency view: same card, minus the caregiver-only controls. */
  readOnly?: boolean;
  /**
   * Overrides the card heading. SCRUM-165: the two PCA parts render as
   * PCA_EXAM.label and PCA_SIGNOFF.label from credential-config.
   */
  titleOverride?: string;
  /**
   * Agency view, when the file is withheld because the caregiver's packet has
   * not been bought yet (SCRUM-119): open the locked documents instead.
   */
  onLockedView?: () => void;
  /**
   * SCRUM-130: has this agency bought the caregiver's packet? Viewing is free
   * either way, but an agency that has not paid reads the file in a preview
   * that offers no download, while one that has paid opens it directly —
   * downloading is what they bought.
   */
  packetPaid?: boolean;
  /** Agency, unpaid: open the in-app preview instead of navigating to the file. */
  onPreview?: (doc: { documentId: string; title: string }) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

const VIEW_ACTION_CLASS =
  'inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#B0BCB8] bg-white px-3.5 text-[13px] font-medium text-[#1C1C1C] transition-colors hover:bg-gray-50';

const CredentialStatusCard: React.FC<CredentialStatusCardProps> = ({
  credential,
  onUpdateVerification,
  onRemove,
  readOnly = false,
  titleOverride,
  onLockedView,
  packetPaid = false,
  onPreview,
}) => {
  const doc = credential.document;
  // SCRUM-136: one clock, one expiry value per credential. The status badge,
  // the urgency pill and the countdown are all read from `exp`, so they flip
  // together at a band boundary; and the clock ticks (every minute, every
  // second in the last hour), so the countdown actually counts down instead of
  // freezing at page load.
  const now = useExpiryClock(doc?.credentialExpirationDate);
  const exp = useMemo(
    () => getCredentialExpiry(doc?.credentialExpirationDate, now),
    [doc?.credentialExpirationDate, now]
  );
  const status = resolveCardStatus(credential, exp);
  const labels = getFieldLabels(credential.key);
  const extra = getInlineExtra(credential.key, doc);
  const badge = STATUS_STYLE[status];
  const BadgeIcon = badge.mark?.Icon;
  const urgency = getUrgencyPill(credential, exp);

  // SCRUM-136: the countdown appears only for a Confirmed credential that has an
  // expiry date, and for an Expired one (as a red "Expired"). Not uploaded,
  // Pending review, Rejected and "no expiration" credentials show none — they
  // used to show a row of grey dashes, which read as missing data.
  const noExpiry = doc?.hasNoExpiration || !exp.hasExpiration;
  const showCountdown =
    (status === 'confirmed' && !noExpiry) || status === 'expired';
  // Days only while three or more remain; hours and minutes join below three,
  // where they actually matter (an audit two hours out, not one 47 days out).
  const countdownParts =
    exp.days >= 3
      ? [{ v: exp.days, u: exp.days === 1 ? 'day' : 'days' }]
      : [
          { v: exp.days, u: exp.days === 1 ? 'day' : 'days' },
          { v: exp.hrs, u: 'hrs' },
          { v: exp.min, u: 'min' },
        ];

  // SCRUM-63 Scenario 4: a credential the caregiver has not uploaded is name +
  // badge only. There is no document, so an expiry countdown of dashes and a
  // View Credential link pointing at "#" are both noise — and the link would
  // read as an offer to open something that does not exist.
  const isMissing = status === 'notUploaded';

  // SCRUM-63: the agency-facing states are Confirmed -> full details + View,
  // and Pending / Not confirmed / Not uploaded -> badge only, no details. So an
  // agency may only open a credential WeVoro has actually confirmed. A pending
  // document is one nobody has checked yet, and letting an agency read it would
  // pass off an unverified file as a credential — the same reason SCRUM-131
  // keeps pending documents out of the paid package. Caregivers keep access to
  // their own files in every state; `readOnly` is the agency view.
  const canOpen = !readOnly || credential.state === 'verified';

  // SCRUM-135: the server withholds a sensitive credential's details from an
  // agency WeVoro has not confirmed yet (SCRUM-99 tier gate), and says so with
  // `restricted` and a reason. The card ignored both, so TB Test rendered as an
  // ordinary Confirmed card whose fields and countdown were simply blank —
  // which reads as broken data, and is exactly how it was reported. Its View
  // button then fell through to the paywall, inviting the agency to pay for
  // something payment does not unlock. A restricted credential now says why it
  // is closed and offers no action.
  const isRestricted = readOnly && !!doc?.restricted;

  // SCRUM-178: the caregiver's per-row menu is back. It was built with the card
  // and then hidden behind a constant, which left Update Verification and Remove
  // reachable only from the Credentials side panel and the Completing Profile
  // modal — neither of which a caregiver looking at a Confirmed credential would
  // think to open.
  //
  // `readOnly` is the agency view and keeps NO menu: SCRUM-63 gives an agency a
  // read-only card, and nothing on it may edit somebody else's credentials.
  //
  // Shown on any credential the caregiver has actually uploaded — Confirmed
  // (the ticket's case), and equally Pending review, Rejected and Expired,
  // which the same two handlers already cover: the upload modal replaces the
  // file whatever state it is in, and the delete takes the document away.
  // A Not Uploaded row has no document to update or remove, so it shows none.
  const showRowMenu = !readOnly && !!doc?._id;

  // SCRUM-202 / SCRUM-104: the source line under a confirmed credential —
  // "Confirmed by Wevoro on [date]", renamed from "Verified by Wevoro on
  // [date]" when SCRUM-104 dropped "Verified" from everything user-facing. It
  // was missing from the card altogether.
  //
  // Caregiver-side only. `readOnly` is the agency view, and SCRUM-63 takes this
  // line off it on purpose — that card is the subtraction-based variant, and an
  // agency reads WeVoro's confirmation from the Confirmed badge itself.
  //
  // The date is the admin's confirmation date (`reviewedAt`, written by the
  // Confirm Credential action). A row confirmed before that field was stored
  // has none, so it carries no line rather than a date we made up.
  const confirmedOn =
    !readOnly && status === 'confirmed' ? formatReviewedOn(doc?.reviewedAt) : '';

  return (
    // SCRUM-165: a PCA's written exam and RN/LPN sign-off are both
    // 'certifications' rows, so data-key alone no longer tells the two cards
    // apart; data-part does ('practical_signoff' on the sign-off card).
    <div
      data-testid='credential-card'
      data-key={credential.key}
      data-part={credential.document?.part}
      className='rounded-xl border border-[#DFE2E0] bg-white px-5 py-4'
    >
      <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6'>
        {/* Left: name, status, ids, fields */}
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <h3 className='text-base font-semibold leading-6 text-[#1C1C1C]'>
              {titleOverride || credential.label}
            </h3>
            <span
              data-testid='credential-status'
              data-status={status}
              className={`${PILL_BASE} ${badge.mark?.outline ? PILL_OUTLINED : PILL_PLAIN} ${badge.cls}`}
            >
              {BadgeIcon && <BadgeIcon aria-hidden className='size-3 shrink-0' strokeWidth={2.25} />}
              {badge.text}
            </span>
            {urgency && !isRestricted && (
              <span
                data-testid='credential-urgency'
                data-band={urgency.band}
                className={`${PILL_BASE} ${PILL_PLAIN} ${urgency.cls}`}
              >
                {urgency.text}
              </span>
            )}
          </div>

          {(doc?.wevoroCredentialId || doc?.credentialIdNumber || extra) && (
            <div className='mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#6C6C6C]'>
              {(doc?.wevoroCredentialId || doc?.credentialIdNumber) && (
                <span>ID: {doc?.wevoroCredentialId || doc?.credentialIdNumber}</span>
              )}
              {extra && (
                <span>
                  {extra.label}:{' '}
                  <span className={extra.accent ? 'font-medium text-[#008000]' : 'text-[#1C1C1C]'}>
                    {extra.value}
                  </span>
                </span>
              )}
            </div>
          )}

          {doc?.credentialIssueDate && (
            <div className='mt-2 flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs'>
              <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
                <Clock className='size-3.5 shrink-0 text-[#9E9E9E]' />
                <span className='uppercase tracking-wide text-[#6C6C6C]'>{labels.issued}</span>
                <span className='text-[#1C1C1C]'>{formatDate(doc?.credentialIssueDate)}</span>
              </span>
              <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
                <Calendar className='size-3.5 shrink-0 text-[#9E9E9E]' />
                <span className='uppercase tracking-wide text-[#6C6C6C]'>{labels.expiration}</span>
                <span className='text-[#1C1C1C]'>
                  {noExpiry ? 'No official expiration date' : formatDate(doc?.credentialExpirationDate)}
                </span>
              </span>
              {doc?.issuingOrganization && (
                <span className='inline-flex items-center gap-1.5 whitespace-nowrap'>
                  <Building2 className='size-3.5 shrink-0 text-[#9E9E9E]' />
                  <span className='uppercase tracking-wide text-[#6C6C6C]'>{labels.issuer}</span>
                  <span className='text-[#1C1C1C]'>{doc.issuingOrganization}</span>
                </span>
              )}
            </div>
          )}

          {/* SCRUM-202: see `confirmedOn` above — caregiver's own card only. */}
          {confirmedOn && (
            <p
              data-testid='credential-confirmed-on'
              className='mt-2 text-xs text-[#6C6C6C]'
            >
              Confirmed by Wevoro on {confirmedOn}
            </p>
          )}

          {isRestricted && (
            <p className='mt-2 flex items-start gap-1.5 text-xs text-[#6C6C6C]'>
              <Lock className='mt-px size-3.5 shrink-0 text-[#9E9E9E]' />
              <span>
                {doc?.restrictedReason ||
                  'Details are visible once WeVoro confirms your agency.'}
              </span>
            </p>
          )}

          {/* Why it was not confirmed. SCRUM-63 Scenario 5: this is feedback
              between the admin and the caregiver, and agencies must not see it
              — they get "Not confirmed" and nothing more, so they know the
              caregiver has work to do without learning that a document looked
              altered or the name did not match. `readOnly` is the agency view. */}
          {!readOnly && status === 'notConfirmed' && doc?.rejectionReason && (
            <div className='mt-3 rounded-lg bg-[#FDECEC] px-3 py-2'>
              <p className='text-xs font-semibold text-[#A32219]'>In-correct Information</p>
              <p className='mt-0.5 text-xs text-[#A32219]'>{doc.rejectionReason}</p>
              {doc.replacementRequested && (
                // SCRUM-136 baseline: #A9700B on this tint was 3.80:1; the
                // Pending review amber text reads 6.02:1 on it.
                <p className='mt-1.5 inline-block rounded-full bg-[#FEF3D7] px-2 py-0.5 text-[11px] font-medium text-[#7A5600]'>
                  Replacement requested
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: countdown + action */}
        <div className='flex shrink-0 flex-wrap items-center gap-3'>
          {/* A restricted credential's expiry is withheld, so its countdown can
              only ever be blank dashes — which is the "missing data" that was
              reported. Leave it out rather than render a meaningless clock. */}
          {/* SCRUM-132: the digits take the band's colour — they used to stay
              grey however close the expiry was. SCRUM-136: the band is the
              same `exp` the urgency pill reads, so the two always match. */}
          {showCountdown && !isRestricted && (
          <div data-testid='credential-countdown' data-band={exp.band} className='flex items-center gap-1.5'>
            {/* SCRUM-206: the label sits in front of a day count, so "Expires On"
                read as "Expires on 24 days". SCRUM-136's wording is "in". */}
            <span className='text-xs text-[#6C6C6C]'>Expires in</span>
            {status === 'expired' ? (
              <span
                className={`inline-flex h-7 items-center justify-center rounded-md px-2 text-sm font-semibold ${EXPIRY_BAND_STYLE.red}`}
              >
                Expired
              </span>
            ) : (
              countdownParts.map(({ v, u }) => (
                <React.Fragment key={u}>
                  <span
                    className={`inline-flex h-7 min-w-[34px] items-center justify-center rounded-md px-1.5 text-sm font-semibold ${EXPIRY_BAND_STYLE[exp.band]}`}
                  >
                    {u === 'day' || u === 'days' ? String(v).padStart(2, '0') : pad(v)}
                  </span>
                  <span className='text-[11px] text-[#6C6C6C]'>{u}</span>
                </React.Fragment>
              ))
            )}
          </div>
          )}

          {!isMissing &&
            (doc?.url && canOpen ? (
              <a
                // SCRUM-189: for an agency this arrow used to point straight at
                // the CDN, so the file opened without ever touching our backend
                // and WeVoro never saw it. It goes through our own route now.
                //
                // SCRUM-209: that route is the VIEW route, not the download
                // one. View and Download are two different actions — viewing
                // is free (SCRUM-119) and only the package download is sold —
                // and sending View through download-file served the file with
                // an attachment disposition, so the browser saved it instead
                // of opening it. The caregiver's own card still opens its own
                // file directly; reading your own document needs no server.
                href={readOnly ? `/api/document/view/${doc._id}` : doc.url}
                target='_blank'
                rel='noopener noreferrer'
                className={VIEW_ACTION_CLASS}
              >
                {labels.viewAction}
                <MoveUpRight className='size-3.5' />
              </a>
            ) : doc?.hasFile && !doc?.restricted && canOpen ? (
              // SCRUM-130: viewing a credential is free — only the packet
              // download is paid for. The url is still withheld on purpose (the
              // CDN links are unsigned, so sending one would give the file
              // away), so everything below goes through the server-side view
              // route, which streams the document without revealing where it
              // lives.
              readOnly && !packetPaid && onPreview ? (
                // Not paid: read it here, in a preview with no download control
                // and the browser's own PDF toolbar suppressed. Opening the file
                // in a tab handed the agency Chrome's download button, which
                // turned the free view into a free download and made the packet
                // worth nothing.
                <button
                  type='button'
                  onClick={() =>
                    onPreview({
                      documentId: String(doc._id),
                      title: titleOverride || credential.label,
                    })
                  }
                  className={VIEW_ACTION_CLASS}
                >
                  {labels.viewAction}
                </button>
              ) : (
                // Paid, or the caregiver's own card: open the document in a
                // new tab, with the browser's own toolbar left alone. A paid
                // agency has nothing left to withhold.
                //
                // SCRUM-209: both go through the view route, which streams the
                // file inline. This used to send a paid agency to the download
                // route so SCRUM-189's "Credentials Downloaded" notice would
                // fire, and the attachment disposition that route sets turned
                // every View into a save — the agency could not look at an
                // updated credential without downloading it first. Viewing and
                // downloading are separate actions (SCRUM-119, SCRUM-141,
                // SCRUM-67), so the notice belongs to the real download: the
                // package, whose route writes the audit row and fires it.
                <a
                  href={`/api/document/view/${doc._id}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={VIEW_ACTION_CLASS}
                >
                  {labels.viewAction}
                  <MoveUpRight className='size-3.5' />
                </a>
              )
            ) : (
              // Nothing to open: either the credential has no file, or it is
              // sensitive and this agency is not Confirmed yet (SCRUM-99).
              // A credential still awaiting review is not for sale either
              // (SCRUM-131 keeps it out of the package), so sending the agency
              // to the paywall would offer something it cannot buy. Say why it
              // is closed instead.
              !canOpen ? (
                <button
                  type='button'
                  disabled
                  title='WeVoro has not reviewed this document yet.'
                  className={`${VIEW_ACTION_CLASS} cursor-not-allowed opacity-60`}
                >
                  <Lock className='size-3.5' />
                  Awaiting review
                </button>
              ) : isRestricted ? (
                // SCRUM-135: held back by the tier gate, not by the paywall.
                // Paying would not reveal it, so do not send them to pay.
                <button
                  type='button'
                  disabled
                  title={doc?.restrictedReason || 'Visible once WeVoro confirms your agency.'}
                  className={`${VIEW_ACTION_CLASS} cursor-not-allowed opacity-60`}
                >
                  <Lock className='size-3.5' />
                  Locked
                </button>
              ) : (
                <button type='button' onClick={onLockedView} className={VIEW_ACTION_CLASS}>
                  <Lock className='size-3.5' />
                  {labels.viewAction}
                </button>
              )
            ))}

          {/* SCRUM-178: caregiver-only row menu — Update Verification and
              Remove. See `showRowMenu` above for which rows carry it. */}
          {showRowMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type='button'
                  data-testid='credential-row-menu'
                  aria-label={`Actions for ${titleOverride || credential.label}`}
                  className='flex size-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100'
                >
                  <MoreVertical className='size-4 text-[#6C6C6C]' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuItem onClick={onUpdateVerification} className='cursor-pointer gap-2'>
                  {status === 'confirmed' ? (
                    // SCRUM-178 names this action "Update Verification"; it
                    // opens the same upload modal, locked to this credential.
                    <>
                      <RefreshCw className='size-4' /> Update Verification
                    </>
                  ) : (
                    <>
                      <CloudUpload className='size-4' /> Re-upload Document
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onRemove}
                  className='cursor-pointer gap-2 text-red-600 focus:text-red-600'
                >
                  <Trash2 className='size-4' /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
};

export default CredentialStatusCard;
