import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, X } from 'lucide-react';

const Header = ({
  handleMinimize,
  handleReset,
}: {
  handleMinimize: () => void;
  handleReset: () => void;
}) => {
  return (
    <CardHeader className='flex flex-row items-center justify-between px-6 py-3.5 bg-[#F9F9FA]'>
      <div className='flex items-center gap-3'>
        <Avatar className='size-10 inline-flex items-center justify-center bg-[#33B55B]'>
          <AvatarImage src='/Tj.svg' alt='TJ' className='size-6' />
          <AvatarFallback className='text-white text-sm font-bold'>
            TJ
          </AvatarFallback>
        </Avatar>
      </div>
      <div className='flex items-center gap-5'>
        <Button
          variant='special'
          size='icon'
          className='h-6 w-6 text-[#6C6C6C]'
          onClick={handleMinimize}
        >
          <Minus className='h-6 w-6' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          className='h-6 w-6 text-[#6C6C6C]'
          onClick={handleReset}
        >
          <X className='h-6 w-6' />
        </Button>
      </div>
    </CardHeader>
  );
};

export default Header;
