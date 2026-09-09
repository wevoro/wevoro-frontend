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
export async function downloadCredentialPacket(
  caregiverId: string,
  caregiverName: string,
): Promise<{ paymentRequired: boolean; count: number }> {
  const response = await fetch(`/api/document/download-package/${caregiverId}`);

  // SCRUM-119: 402 means this packet has not been paid for. That is a
  // normal, expected answer — the paywall working — so it opens the
  // payment gate rather than surfacing as a failure.
  if (response.status === 402) {
    return { paymentRequired: true, count: 0 };
  }

  const data = await response.json();
  if (!data.success || !data.data?.length) {
    throw new Error('No downloadable documents found');
  }

  const docs = data.data;

  // "Viewed" == the agency actually pulled the pack. Fired after the
  // fetch succeeds and only when documents came back, so an empty or
  // failed pack is not counted as a view. caregiverId is included so the
  // share funnel can be joined caregiver-side; no name or PII is sent.
  track(EVENTS.CREDENTIAL_PACK_VIEWED, {
    caregiverId,
    documentCount: docs.length,
  });

  toast.success(`Downloading ${docs.length} documents for ${caregiverName}`);

  for (const doc of docs) {
    if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.title || 'credential';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Slight delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return { paymentRequired: false, count: docs.length };
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
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadPackage = async () => {
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
      toast.error(
        err?.message === 'No downloadable documents found'
          ? 'No downloadable documents found'
          : 'Failed to download credential package',
      );
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
