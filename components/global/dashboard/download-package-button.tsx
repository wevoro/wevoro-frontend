'use client';
import React, { useState } from 'react';
import { Download, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { isSharingEnabled } from '@/lib/credentialing';
import { EVENTS, track } from '@/lib/analytics';

interface DownloadPackageButtonProps {
  caregiverId: string;
  caregiverName: string;
  /** SCRUM-88: invoked after a successful download so callers can refetch
   * (e.g. move the agency Submitted card to Received). */
  onDownloaded?: () => void;
  /**
   * SCRUM-119: the packet is behind a paywall. The server answers an unpaid
   * download with 402, and this hands that back to the caller so the payment
   * gate can open instead of the agency seeing a dead error toast.
   */
  onPaymentRequired?: (caregiverId: string) => void;
  /**
   * When given, the button opens the documents list instead of downloading.
   *
   * The list is the designed surface for a bought packet: it names every file,
   * gives each one its own download and carries the "Download all (ZIP)"
   * action. Downloading straight from the button meant a paid agency never saw
   * what they owned — a ZIP simply appeared in the downloads tray — and there
   * was no way back to the list short of an unpaid 402.
   */
  onOpenList?: (caregiverId: string) => void;
  className?: string;
}

/**
 * SCRUM-67 / SCRUM-119: fetch the packet and save every file in it.
 *
 * Lives outside the button because the paywall needs it too. The success screen
 * promises "your download is starting automatically", and the only way to keep
 * that promise is for the payment gate to run this same routine once the charge
 * confirms — previously it only bumped a refresh counter on an unmounted modal,
 * so nothing was ever fetched and no file reached the agency.
 *
 * Throws when the packet cannot be delivered, which is what drives the gate's
 * delivery-failed state. Returns `paymentRequired` instead of throwing on a 402,
 * because an unpaid packet is the paywall working, not a failure.
 */
/**
 * SCRUM-131. Said in words an agency can act on: the packet ships confirmed
 * credentials and the documents the caregiver signed, so an empty one means
 * the review has not happened yet and nothing has been signed.
 */
export const NOTHING_CONFIRMED =
  'There is nothing to download yet. None of this caregiver’s credentials have been confirmed by WeVoro, and they have not signed any of your documents.';

/**
 * SCRUM-67: the message an agency may be shown for a failed download.
 *
 * The download routes answer with sentences written for people (402, 403, 404,
 * 409, 502). Anything else is a fault — a 400 from Mongoose reads "Cast Error",
 * a 500 carries the raw exception text — and the packet's GCHEXS row put
 * exactly that in a toast. Those fall back to our own wording.
 */
export const agencyFacingMessage = (
  status: number,
  message: unknown,
  fallback: string,
): string => {
  const text = typeof message === 'string' ? message.trim() : '';
  if (!text || ![402, 403, 404, 409, 502].includes(status)) return fallback;
  if (/cast error|validation error|objectid|mongo|e11000|cannot read|undefined|\bnull\b/i.test(text)) {
    return fallback;
  }
  return text;
};

export async function downloadCredentialPacket(
  caregiverId: string,
  caregiverName: string,
): Promise<{ paymentRequired: boolean; count: number }> {
  // The same missing name reached the download: an empty one made a file
  // called "-credentials.zip" and a toast that stopped mid-sentence.
  const who = (caregiverName || '').trim() || 'caregiver';

  // SCRUM-67: straight to the ZIP. This used to ask the credential list first
  // and announce "Preparing 5 documents" from it, while the ZIP also carries
  // the signed documents — 7 files for a toast that said 5 — and it refused
  // outright when no credential was confirmed yet, even with signed documents
  // waiting. It also wrote a second bulk-download audit row on every run.
  const toastId = `packet-${caregiverId}`;
  toast.loading(`Preparing ${who}’s package…`, { id: toastId });

  // SCRUM-67 Scenario 2: one zip, built on the server and saved from our own
  // origin. This replaces a loop that clicked a hidden <a download> per file
  // straight at the CDN — a browser blocks repeated programmatic downloads, and
  // ignores `download` cross-origin, so only the first file ever arrived while
  // the agency was told several were coming.
  let zipResponse: Response;
  try {
    zipResponse = await fetch(`/api/document/download-package-zip/${caregiverId}`);
  } catch {
    toast.dismiss(toastId);
    throw new Error('Failed to download credential package');
  }

  // SCRUM-119: 402 means this packet has not been paid for. That is a
  // normal, expected answer — the paywall working — so it opens the
  // payment gate rather than surfacing as a failure.
  if (zipResponse.status === 402) {
    toast.dismiss(toastId);
    return { paymentRequired: true, count: 0 };
  }
  if (!zipResponse.ok) {
    toast.dismiss(toastId);
    const problem = await zipResponse.json().catch(() => null);
    throw new Error(
      agencyFacingMessage(
        zipResponse.status,
        problem?.message,
        // SCRUM-131: an empty package nearly always means nothing has been
        // confirmed or signed yet, rather than something failing.
        zipResponse.status === 404
          ? NOTHING_CONFIRMED
          : 'Failed to download credential package',
      ),
    );
  }

  let blob: Blob;
  try {
    blob = await zipResponse.blob();
  } catch {
    // A body cut off mid-download; the loading toast must not stay up forever.
    toast.dismiss(toastId);
    throw new Error('Failed to download credential package');
  }
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `${who.replace(/[^\w.-]+/g, '_')}-credentials.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);

  // What is really in the ZIP, as counted by the server that built it.
  const count = Number(zipResponse.headers.get('x-document-count')) || 0;

  // "Viewed" == the agency actually pulled the pack. Fired only once the ZIP
  // has arrived, so an empty or failed pack is not counted as a view.
  // caregiverId is included so the share funnel can be joined caregiver-side;
  // no name or PII is sent.
  track(EVENTS.CREDENTIAL_PACK_VIEWED, {
    caregiverId,
    documentCount: count,
  });

  toast.success(
    count
      ? `Downloaded ${count} ${count === 1 ? 'document' : 'documents'} for ${who}`
      : `Downloaded ${who}’s package`,
    { id: toastId },
  );

  return { paymentRequired: false, count };
}

/**
 * SCRUM-67: Download Credential Package Button
 * Assembles and downloads all accessible documents as a package
 */
const DownloadPackageButton: React.FC<DownloadPackageButtonProps> = ({
  caregiverId,
  caregiverName,
  onDownloaded,
  onPaymentRequired,
  onOpenList,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadPackage = async () => {
    // Paid or not, show the agency the list rather than acting silently.
    if (onOpenList) {
      onOpenList(caregiverId);
      return;
    }
    setIsLoading(true);
    try {
      const { paymentRequired } = await downloadCredentialPacket(
        caregiverId,
        caregiverName,
      );
      if (paymentRequired) {
        onPaymentRequired?.(caregiverId);
        return;
      }
      // SCRUM-88: notify caller so the engagement can transition to Received.
      onDownloaded?.();
    } catch (err: any) {
      // Already put in words an agency can read by downloadCredentialPacket.
      toast.error(err?.message || 'Failed to download credential package');
    } finally {
      setIsLoading(false);
    }
  };

  // Staged rollout: download surfaces hidden while sharing is disabled.
  if (!isSharingEnabled()) return null;

  return (
    <Button
      onClick={handleDownloadPackage}
      disabled={isLoading}
      className={className || 'bg-indigo-600 hover:bg-indigo-700 text-white gap-2'}
    >
      {isLoading ? (
        <>
          <Loader2 className='size-4 animate-spin' />
          Preparing Package...
        </>
      ) : (
        <>
          <Package className='size-4' />
          Download Credential Package
        </>
      )}
    </Button>
  );
};

/**
 * Individual document download button
 */
export const DownloadDocumentButton: React.FC<{
  documentId: string;
  documentTitle: string;
  size?: 'sm' | 'default';
}> = ({ documentId, documentTitle, size = 'sm' }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/document/download/${documentId}`);

      // SCRUM-119: a single file is covered by the same per-caregiver
      // entitlement as the whole packet, so it can come back 402 too. Say what
      // is actually true instead of "failed".
      if (response.status === 402) {
        toast.error('Unlock this caregiver\'s packet to download their documents');
        return;
      }

      const data = await response.json();

      if (!data.success || !data.data?.url) {
        toast.error('Failed to download document');
        return;
      }

      // Open the download URL
      const link = document.createElement('a');
      link.href = data.data.url;
      link.download = documentTitle || 'credential';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${documentTitle}`);
    } catch (err) {
      toast.error('Failed to download document');
    } finally {
      setIsLoading(false);
    }
  };

  // Staged rollout: download surfaces hidden while sharing is disabled.
  if (!isSharingEnabled()) return null;

  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className={`inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors font-medium ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      }`}
      title={`Download ${documentTitle}`}
    >
      {isLoading ? (
        <Loader2 className='size-3 animate-spin' />
      ) : (
        <Download className='size-3' />
      )}
      Download
    </button>
  );
};

export default DownloadPackageButton;
