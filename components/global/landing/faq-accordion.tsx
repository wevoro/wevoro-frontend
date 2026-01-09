import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const FaqAccordion = ({ faqs }: { faqs: any }) => {
  return (
    <div className='flex-1 w-full'>
      <Accordion type='single' collapsible className='w-full flex flex-col'>
        {faqs?.map((item: any, i: number) => (
          <AccordionItem key={i} value={`${i + 1}`} className=''>
            <AccordionTrigger
              className={cn(
                'text-base font-medium md:text-lg text-secondary py-3 md:py-2.5'
              )}
            >
              {item.question}
            </AccordionTrigger>
            <AccordionContent className='text-sm md:text-base text-muted-foreground pl-[52px] rounded-md leading-[28px]'>
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FaqAccordion;
