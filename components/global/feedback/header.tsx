import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, X } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

const Header = ({
  handleMinimize,
  handleReset,
}: {
  handleMinimize: () => void;
  handleReset: () => void;
}) => {
  return (
    <CardHeader className='flex flex-row items-center justify-between px-6 py-3.5 bg-[#F9F9FA]'>
      <div className='flex items-center gap-3'></div>
      <div className='flex items-center gap-5'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='special'
                size='icon'
                className='h-6 w-6 text-muted-foreground'
                onClick={handleMinimize}
              >
                <Minus className='h-6 w-6' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side='top'>Minimize</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6 text-muted-foreground'
                onClick={handleReset}
              >
                <X className='h-6 w-6' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side='top'>End chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </CardHeader>
  );
};

export default Header;
