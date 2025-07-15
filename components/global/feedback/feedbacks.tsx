'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/global/admin/data-table';
import { feedbackColumns } from '@/components/global/admin/columns';
import Title from '@/components/global/title';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Feedbacks({
  feedbacks,
  qaFeedbacks,
}: {
  feedbacks: any[];
  qaFeedbacks: any[];
}) {
  const router = useRouter();

  const searchParams = useSearchParams();
  const userType = searchParams.get('userType');
  const feedbackType = searchParams.get('feedbackType');
  const status = searchParams.get('status');
  const sort = searchParams.get('sort');
  const env = searchParams.get('env');
  const [globalFilter, setGlobalFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState(userType || 'all');
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState(
    feedbackType || 'all'
  );
  const [statusFilter, setStatusFilter] = useState(status || 'all');
  const [sortFilter, setSortFilter] = useState(sort || 'newest');
  const [envFilter, setEnvFilter] = useState(env || 'prod');
  const handleChangeFilter = (key: string, value: string) => {
    if (key === 'userType') setUserTypeFilter(value);
    if (key === 'feedbackType') setFeedbackTypeFilter(value);
    if (key === 'status') setStatusFilter(value);
    if (key === 'sort') setSortFilter(value);
    if (key === 'env') setEnvFilter(value);
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set(key, value);

    router.push(`/admin/feedbacks?${queryParams.toString()}`);
  };

  const activeFeedbacks = envFilter === 'qa' ? qaFeedbacks : feedbacks;

  const filteredFeedbacks =
    activeFeedbacks?.filter(
      (feedback: any) =>
        (userTypeFilter === 'all' ||
          feedback.user?.role?.toLowerCase() ===
            userTypeFilter.toLowerCase()) &&
        (feedbackTypeFilter === 'all' ||
          feedback.feedbackType?.toLowerCase() ===
            feedbackTypeFilter.toLowerCase()) &&
        (statusFilter === 'all' ||
          feedback.status?.toLowerCase() === statusFilter.toLowerCase()) &&
        (globalFilter === '' ||
          feedback.user?.name
            ?.toLowerCase()
            .includes(globalFilter.toLowerCase()) ||
          feedback.user?.email
            ?.toLowerCase()
            .includes(globalFilter.toLowerCase()) ||
          feedback.message?.toLowerCase().includes(globalFilter.toLowerCase()))
    ) || [];

  const sortedFeedbacks = [...filteredFeedbacks].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();

    if (sortFilter === 'newest') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  return (
    <div className='space-y-6'>
      <Title className='mb-4 sm:mb-6' text="User's Feedback" />

      <div className='flex flex-col sm:flex-row gap-6 flex-wrap'>
        <Input
          placeholder='Search username or email...'
          className='w-full sm:max-w-[300px] rounded-[12px] h-12 sm:h-14'
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
        <div className='grid grid-cols-3 gap-5 items-center lg:flex'>
          <h2 className='text-sm'>Filter by:</h2>
          <Select
            value={userTypeFilter}
            onValueChange={(value: string) =>
              handleChangeFilter('userType', value)
            }
          >
            <SelectTrigger className='w-full sm:w-[180px] rounded-[12px] h-12 sm:h-14'>
              <SelectValue placeholder='User Type' />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='pro'>Pro&apos;s</SelectItem>
              <SelectItem value='partner'>Partner&apos;s</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={feedbackTypeFilter}
            onValueChange={(value: string) =>
              handleChangeFilter('feedbackType', value)
            }
          >
            <SelectTrigger className='w-full sm:w-[180px] rounded-[12px] h-12 sm:h-14'>
              <SelectValue placeholder='Feedback type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='Feature Request'>Feature Request</SelectItem>
              <SelectItem value='Report a bug to fix'>Report Issue</SelectItem>
              <SelectItem value='Others'>Others</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value: string) =>
              handleChangeFilter('status', value)
            }
          >
            <SelectTrigger className='w-full sm:w-[180px] rounded-[12px] h-12 sm:h-14'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='new'>New</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
              <SelectItem value='solved'>Solved</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sortFilter}
            onValueChange={(value: string) => handleChangeFilter('sort', value)}
          >
            <SelectTrigger className='w-full sm:w-[180px] rounded-[12px] h-12 sm:h-14'>
              <SelectValue placeholder='Sort by' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='newest'>New to old</SelectItem>
              <SelectItem value='oldest'>Old to new</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={envFilter}
            onValueChange={(value) => handleChangeFilter('env', value)}
          >
            <SelectTrigger className='w-full sm:w-[180px] rounded-[12px] h-12 sm:h-14'>
              <SelectValue placeholder='Env' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='prod'>Prod</SelectItem>
              <SelectItem value='qa'>QA</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={feedbackColumns}
        data={sortedFeedbacks}
        hideHeader={true}
      />
    </div>
  );
}
