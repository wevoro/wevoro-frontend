import { SquareCheck, SquareX } from 'lucide-react';
import Container from '../container';
import { cn } from '@/lib/utils';

interface SolutionItem {
  title: string;
  description: string;
}

interface ComparisonBox {
  type: 'problem' | 'solution';
  title: string;
  hasBadge: boolean;
  items: SolutionItem[];
}

interface SolutionProps {
  title?: string;
  description?: string;
  comparisonBoxes?: ComparisonBox[];
  footerText?: string;
}

const Solution = ({
  title,
  description,
  comparisonBoxes,
  footerText,
}: SolutionProps) => {
  return (
    <section className='pt-20'>
      <Container className='px-0 sm:px-6 lg:px-8'>
        <h2 className='md:text-[45px] text-[31px] text-secondary md:leading-[54px] leading-[37.2px] text-center transition-all duration-300 mb-3 md:max-w-none max-w-[343px] mx-auto'>
          {title}
        </h2>
        <p className='text-[#6C6C6C] text-center md:text-lg text-sm mb-10'>
          {description}
        </p>

        {/* Comparison Cards */}
        <div className='flex flex-col md:flex-row md:gap-8'>
          {comparisonBoxes?.map((box, boxIndex) => (
            <div
              key={boxIndex}
              className={cn(
                `flex-1 px-4 py-10 md:p-12`,
                box.type === 'problem' ? 'bg-[#FFF5F5]' : 'bg-[#BBF8DC]'
              )}
            >
              <div>
                {box.hasBadge ? (
                  <div className='inline-block bg-[#1A5632] text-white font-medium text-lg md:text-[28px] leading-[120%] px-6 py-2  mb-8 md:mb-12 -ml-4 md:-ml-14 italic'>
                    {box.title}
                  </div>
                ) : (
                  <h3 className='text-2xl md:text-[28px] leading-[120%] font-medium text-secondary mb-8 md:mb-12'>
                    {box.title}
                  </h3>
                )}
                <div className='space-y-6 md:space-y-10'>
                  {box.items?.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className='flex items-center gap-4 md:gap-8 md:min-h-[100px]'
                    >
                      {box.type === 'problem' ? (
                        <SquareX className='size-7 md:size-8 text-red-600 flex-shrink-0' />
                      ) : (
                        <SquareCheck className='size-7 md:size-8 text-secondary flex-shrink-0' />
                      )}
                      <div>
                        <h4 className='text-secondary text-lg md:text-2xl'>
                          {item.title}
                        </h4>
                        <p className='text-[#6C6C6C] text-sm md:text-lg mt-1 md:mt-2'>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {footerText && (
          <p className='text-secondary text-sm md:text-2xl mt-12 text-center'>
            {footerText}
          </p>
        )}
      </Container>
    </section>
  );
};

export default Solution;
