// SCRUM-117: the document list, the upload modal and the replace modal all print
// file sizes. Keeping the rounding rule here stops the same file reading as
// "1.4 MB" in one place and "1449 KB" in another.
export const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes < 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;

  return `${(kb / 1024).toFixed(1)} MB`;
};
