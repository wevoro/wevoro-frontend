const fileExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'];

export const fileIcons: Record<string, string> = {
  pdf: '/file.svg',
  doc: '/doc.svg',
  docx: '/doc.svg',
  jpg: '/jpeg.svg',
  jpeg: '/jpeg.svg',
  png: '/image.svg',
  svg: '/image.svg',
};

export const getFileType = (file: string) => {
  const extension = file?.split('.').pop()?.toLowerCase() || '';

  if (fileExtensions.includes(extension)) {
    return extension.toLowerCase();
  } else {
    return extension.toLowerCase() || 'file';
  }
};

/**
 * A long file name, shortened in the middle so the extension stays visible:
 * "caregiver_cpr_certificate_2026_final_signed_copy.pdf" →
 * "caregiver_cpr_certifica…signed_copy.pdf". Long names without spaces
 * cannot wrap, and pushed modals wider than the screen.
 */
export const shortFileName = (name: string, max = 42): string => {
  if (!name || name.length <= max) return name;
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 && name.length - dot <= 6 ? name.slice(dot) : '';
  const base = ext ? name.slice(0, dot) : name;
  const keepEnd = Math.min(10, Math.floor((max - ext.length) / 3));
  const keepStart = max - ext.length - keepEnd - 1;
  return `${base.slice(0, keepStart)}…${base.slice(base.length - keepEnd)}${ext}`;
};
