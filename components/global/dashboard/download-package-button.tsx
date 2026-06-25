'use client';
import React, { useState } from 'react';
import { Download, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DownloadPackageButtonProps {
  caregiverId: string;
  caregiverName: string;
  /** SCRUM-88: invoked after a successful download so callers can refetch
   * (e.g. move the agency Submitted card to Received). */
  onDownloaded?: () => void;
  className?: string;
}

/**
 * SCRUM-67: Download Credential Package Button
 * Assembles and downloads all accessible documents as a package
 */
const DownloadPackageButton: React.FC<DownloadPackageButtonProps> = ({
  caregiverId,
  caregiverName,
  onDownloaded,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownloadPackage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/document/download-package/${caregiverId}`);
      const data = await response.json();

      if (!data.success || !data.data?.length) {
        toast.error('No downloadable documents found');
        return;
      }

      // Download each file
      const docs = data.data;
      toast.success(`Downloading ${docs.length} documents for ${caregiverName}`);

      // Open each document URL for download
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

      // SCRUM-88: notify caller so the engagement can transition to Received.
      onDownloaded?.();
    } catch (err) {
      toast.error('Failed to download credential package');
    } finally {
      setIsLoading(false);
    }
  };

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
