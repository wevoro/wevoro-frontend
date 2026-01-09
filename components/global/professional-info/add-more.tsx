import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddMoreProps {
  handleAdd: () => void;
  iconBgColor?: string;
  textColor?: string;
}

const AddMore = ({
  handleAdd,
  iconBgColor = 'bg-tertiary',
  textColor = 'text-tertiary',
}: AddMoreProps) => {
  return (
    <div
      className='flex items-center gap-2 cursor-pointer hover:underline'
      onClick={handleAdd}
    >
      <div
        className={cn(
          'rounded-full w-8 h-8 text-white flex items-center justify-center',
          iconBgColor
        )}
      >
        <Plus className='w-4 h-4 text-white' />
      </div>
      <span className={cn('text-lg leading-[25.2px]', textColor)}>
        Add more
      </span>
    </div>
  );
};

export default AddMore;
