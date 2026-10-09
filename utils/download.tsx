import { toast } from 'sonner';

/**
 * Save a file to the visitor's computer instead of opening it in a tab.
 *
 * SCRUM-148: a file on the CDN cannot be fetched by the browser — the CDN
 * sends no CORS header, so the fetch is blocked and the caregiver saw
 * "Failed to download file" on a file they had just uploaded. Anything that
 * is not on our own origin is fetched by our server instead, which has no
 * CORS to answer to.
 */
export const downloadFile = async (url: string, filename?: string) => {
  try {
    toast.loading('Downloading file...', { id: 'download' });

    const sameOrigin =
      url.startsWith('/') ||
      (typeof window !== 'undefined' && url.startsWith(window.location.origin));
    const response = sameOrigin
      ? await fetch(url)
      : await fetch('/api/proxy-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Derive filename from URL if not provided. A title carries no file
    // type, so the one from the url is kept on the end.
    const fromUrl = url.split('/').pop()?.split('?')[0] || 'download';
    const ext = fromUrl.includes('.') ? '.' + fromUrl.split('.').pop() : '';
    const derivedName = filename
      ? filename.toLowerCase().endsWith(ext.toLowerCase())
        ? filename
        : `${filename}${ext}`
      : fromUrl;

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
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['.jpeg', '.jpg', '.png', '.pdf'];
  
  // Strict matching on both MIME type or Extension (since Windows sometimes drops MIME)
  return ACCEPTED_FILE_TYPES.includes(file.type) || validExtensions.includes(extension);
};

/**
 * Validates file size (max 10MB).
 *
 * SCRUM-97: raised from 3MB — unmodified smartphone photos are typically 3–8MB,
 * so caregivers were being forced to upload screenshots of their credentials
 * instead of the photos themselves.
 */
export const MAX_UPLOAD_MB = 10;

export const isValidFileSize = (
  file: File,
  maxMB: number = MAX_UPLOAD_MB
): boolean => {
  return file.size <= maxMB * 1024 * 1024;
};
