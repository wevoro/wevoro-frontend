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
