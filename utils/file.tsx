const fileExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

export const fileIcons: Record<string, string> = {
  pdf: '/file.svg',
  jpg: '/image.svg',
  jpeg: '/image.svg',
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
