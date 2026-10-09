import React from 'react';
import { Trash2Icon } from 'lucide-react';

// SCRUM-152 (Figma, onboarding step 2): a 32px light-red circle with the red
// trash icon, 8px gap, then "Remove" at 18px medium in #E94435.
const Remove = ({ handleRemove }: { handleRemove: () => void }) => {
  return (
    <button
      // It sits inside the professional-info form: without an explicit type
      // the browser treats it as a submit button and saves the form.
      type='button'
      className='flex items-center gap-2 cursor-pointer hover:underline text-[#E94435] font-medium'
      onClick={handleRemove}
    >
      <div className='bg-[#FCE7E5] rounded-full w-8 h-8 shrink-0 flex items-center justify-center'>
        <Trash2Icon className='w-4 h-4' />
      </div>
      <span className='md:block hidden text-lg leading-[25.2px]'>Remove</span>
    </button>
  );
};

export default Remove;
