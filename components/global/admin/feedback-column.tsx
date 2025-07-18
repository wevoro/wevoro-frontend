import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import { FeedbackModal } from './feedback-modal';
import FeedbackDropdown from './feedback-dropdown';

const FeedbackColumn = ({ row }: { row: any }) => {
  return (
    <div className='flex items-center justify-end gap-2'>
      <FeedbackModal data={row.original}>
        <Button
          variant='outline'
          className='text-sm px-3 py-2 h-10 font-medium'
        >
          View Message
          <ArrowUpRight className='size-5 ml-1' />
        </Button>
      </FeedbackModal>
      <FeedbackDropdown data={row.original} />
    </div>
  );
};

export default FeedbackColumn;
