import { FileCheck, MoreHorizontal } from 'lucide-react';

const OfferListSkeleton = () => {
  return (
    <div className='flex flex-col gap-8'>
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className='px-4 p-6 md:p-8 bg-white md:rounded-[16px] animate-pulse'
        >
          <div className='flex flex-col gap-2 w-full'>
            <div className='flex justify-between items-center'>
              <span className='bg-gray-200 h-4 w-24 rounded'></span>
              <MoreHorizontal className='w-6 h-6 text-gray-300' />
            </div>

            <div className='flex items-center gap-3'>
              <div className='bg-gray-200 w-12 h-12 sm:size-[58px] rounded-full'></div>
              <div>
                <div className='bg-gray-200 h-4 w-32 rounded mb-1'></div>
                <div className='bg-gray-200 h-4 w-24 rounded'></div>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-4 gap-2 w-auto xl:w-max'>
              <div className='flex flex-col gap-1'>
                <div className='bg-gray-200 h-4 w-24 rounded'></div>
                <div className='bg-gray-200 h-4 w-32 rounded'></div>
              </div>
              <div className='flex flex-col gap-1'>
                <div className='bg-gray-200 h-4 w-24 rounded'></div>
                <div className='bg-gray-200 h-4 w-32 rounded'></div>
              </div>
              <div className='flex flex-col gap-1'>
                <div className='bg-gray-200 h-4 w-24 rounded'></div>
                <div className='bg-gray-200 h-4 w-32 rounded'></div>
              </div>
              <div className='flex flex-col gap-1'>
                <div className='bg-gray-200 h-4 w-24 rounded'></div>
                <div className='bg-gray-200 h-4 w-32 rounded'></div>
              </div>
            </div>

            <div className='flex justify-between mt-4 gap-3'>
              <div className='bg-gray-200 h-[40px] sm:h-[50px] 2xl:h-[71px] w-full rounded-[12px]'></div>
              <div className='bg-gray-200 h-[40px] sm:h-[50px] 2xl:h-[71px] w-full rounded-[12px]'></div>
            </div>

            <div className='mt-3 flex items-center gap-2'>
              <FileCheck className='w-6 h-6 text-gray-300' />
              <div className='bg-gray-200 h-4 w-48 rounded'></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OfferListSkeleton;
