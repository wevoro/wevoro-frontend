import { NotepadText, Eye } from 'lucide-react';

export default function CredentialListIcon({
  className = 'size-5',
}: {
  className?: string;
}) {
  return (
    <span className='relative inline-flex items-center justify-center'>
      <NotepadText className={className} />
      <Eye className='absolute -bottom-1 -right-1 size-3 bg-white rounded-full' />
    </span>
  );
}
