'use client';

import React, { useState } from 'react';
import DownloadPackageButton, {
  downloadCredentialPacket,
} from '@/components/global/dashboard/download-package-button';
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

      {/* Only one dialog is mounted at a time. Keeping both mounted meant the
          documents modal was still playing its exit animation while the gate
          played its entrance, so the payment card appeared to flash in and out
          before settling. */}
      {docsOpen && (
        <PacketDocumentsModal
          open
          onOpenChange={setDocsOpen}
          caregiverId={caregiverId}
          caregiverName={caregiverName}
          refreshKey={paidTick}
          onUnlock={() => {
            // Close first, then open the gate on the next frame, so the two
            // dialogs never overlap.
            setDocsOpen(false);
            requestAnimationFrame(() => setPayOpen(true));
          }}
        />
      )}

      {payOpen && (
        <PaymentGateModal
          open
          onOpenChange={setPayOpen}
          caregiverId={caregiverId}
          caregiverName={caregiverName}
          caregiverImage={caregiverImage}
          caregiverRole={caregiverRole}
          onPaid={async () => {
            // Actually fetch the packet. The success screen tells the agency
            // "your download is starting automatically", so this has to run the
            // real download — bumping the refresh counter alone delivered
            // nothing, because the documents modal is unmounted by now and the
            // profile surface passes no onDownloaded. If it throws, the gate
            // shows delivery-failed and the purchase still stands.
            await downloadCredentialPacket(caregiverId, caregiverName);
            // Keep the unlocked state fresh for when the documents modal
            // is reopened.
            setPaidTick((t) => t + 1);
            onDownloaded?.();
          }}
        />
      )}
    </>
  );
};

export default PacketDownloadAction;
