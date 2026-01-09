'use client';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/lib/context';
import { useNotificationsContext } from '@/lib/contexts';
import { X } from 'lucide-react';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const Notifications = () => {
  const {
    notifications,
    refetchNotifications,
    isNotificationsLoading,
    isUnreadNotification,
  } = useNotificationsContext();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isUnreadNotification?.length > 0) {
      const markAllAsRead = async () => {
        await fetch(`/api/user/notification/mark-as-read`, {
          method: 'PATCH',
        });
        refetchNotifications();
      };

      markAllAsRead();
    }
  }, [isUnreadNotification]);

  const handleRemove = async (id: string) => {
    setIsLoading(true);
    const response = fetch(`/api/user/notification/delete`, {
      method: 'DELETE',
      body: JSON.stringify(id),
    });
    toast.promise(response, {
      loading: 'Deleting notification...',
      success: async (data: any) => {
        refetchNotifications();
        const responseData: any = await data.json();
        return responseData.message || 'Notification deleted successfully!';
      },
      error: 'Failed to delete notification',
    });
    setIsLoading(false);
  };

  if (isNotificationsLoading) {
    return (
      <div className='flex flex-col gap-8'>
        <div className='flex flex-col bg-white rounded-lg p-6 gap-5'>
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className='flex flex-col gap-1 justify-between p-2.5'
            >
              <div className='flex justify-between items-start gap-6'>
                <div className='w-3/4 h-4 bg-gray-200 rounded-full animate-pulse'></div>
                <div className='w-6 h-6 bg-gray-200 rounded-full animate-pulse'></div>
              </div>
              <div className='w-1/2 h-4 bg-gray-200 rounded-full animate-pulse'></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col bg-white rounded-lg p-6 gap-5'>
        {notifications?.length > 0 ? (
          notifications?.map((noti: any, index: any) => (
            <div
              key={index}
              className={`flex flex-col gap-1 justify-between p-2.5`}
            >
              <div className='flex justify-between items-start gap-6'>
                <div
                  className=''
                  dangerouslySetInnerHTML={{ __html: noti.message }}
                ></div>
                <Button
                  variant='special'
                  onClick={() => handleRemove(noti._id)}
                  disabled={isLoading}
                >
                  <X className='size-5' />
                </Button>
              </div>
              <span className='text-muted-foreground text-xs'>
                {moment(noti.createdAt).format('DD MMM, YYYY, h:mm A')}
              </span>
            </div>
          ))
        ) : (
          <div className='flex justify-center items-center h-full'>
            <span className='text-sm text-gray-500'>No notifications</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
