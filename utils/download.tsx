import { toast } from 'sonner';

/**
 * Downloads a file from a URL by fetching it as a blob and triggering
 * a native download instead of opening in a new browser tab.
 */
export const downloadFile = async (url: string, filename?: string) => {
  try {
    toast.loading('Downloading file...', { id: 'download' });

    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Derive filename from URL if not provided
    const derivedName =
      filename || url.split('/').pop()?.split('?')[0] || 'download';

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = derivedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    toast.success('File downloaded successfully!', { id: 'download' });
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download file. Please try again.', {
      id: 'download',
    });
  }
};

/**
 * Accepted file types for document uploads.
 */
export const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
];

export const ACCEPTED_FILE_EXTENSIONS = ['.jpeg', '.jpg', '.png', '.pdf'];

/**
 * Validates a file's type against accepted document upload types.
 */
export const isValidFileType = (file: File): boolean => {
  return ACCEPTED_FILE_TYPES.includes(file.type);
};

/**
 * Validates file size (max 3MB).
 */
export const isValidFileSize = (file: File, maxMB: number = 3): boolean => {
  return file.size <= maxMB * 1024 * 1024;
};
