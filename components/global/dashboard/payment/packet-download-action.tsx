'use client';

import React, { useState } from 'react';
import DownloadPackageButton from '@/components/global/dashboard/download-package-button';
import PacketDocumentsModal from './packet-documents-modal';
import PaymentGateModal from './payment-gate-modal';

/**
 * SCRUM-119 — the download action plus its paywall, as one self-contained
 * client component.
 *
 * The caregiver profile page is a server component, so it cannot hold the modal
 * state itself. Bundling the button with its two modals here means every
 * surface that offers a download gets the paywall automatically, instead of
 * each one re-wiring it and one of them being forgotten.
 */
interface PacketDownloadActionProps {
  caregiverId: string;
  caregiverName: string;
  caregiverImage?: string;
  caregiverRole?: string;
  className?: string;
  onDownloaded?: () => void;
}

const PacketDownloadAction: React.FC<PacketDownloadActionProps> = ({
  caregiverId,
  caregiverName,
  caregiverImage,
  caregiverRole,
  className,
  onDownloaded,
}) => {
  const [docsOpen, setDocsOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paidTick, setPaidTick] = useState(0);

  return (
    <>
      <DownloadPackageButton
        caregiverId={caregiverId}
        caregiverName={caregiverName}
        className={className}
        onDownloaded={onDownloaded}
        // A 402 is the paywall doing its job, not an error: show what the
        // packet contains so the agency can decide to buy it.
        onPaymentRequired={() => setDocsOpen(true)}
      />

      <PacketDocumentsModal
        open={docsOpen}
        onOpenChange={setDocsOpen}
        caregiverId={caregiverId}
        caregiverName={caregiverName}
        refreshKey={paidTick}
        onUnlock={() => {
          setPayOpen(true);
          setDocsOpen(false);
        }}
      />

      <PaymentGateModal
        open={payOpen}
        onOpenChange={setPayOpen}
        caregiverId={caregiverId}
        caregiverName={caregiverName}
        caregiverImage={caregiverImage}
        caregiverRole={caregiverRole}
        onPaid={async () => {
          // Force the documents modal to refetch so it flips to unlocked.
          setPaidTick((t) => t + 1);
          onDownloaded?.();
        }}
      />
    </>
  );
};

export default PacketDownloadAction;
