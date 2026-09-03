'use client';
import { useNotifications } from '@/app/apiHooks/useNotifications';
import type { Notification } from '@/app/types/types';
import { Button } from '@/components/ui/button';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  FileCheck,
  ArrowRight,
  UserPlus,
  Download,
  PenLine,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// SCRUM-65: Notification type config
const NOTIFICATION_CONFIG: Record<
  string,
  { icon: React.ReactNode; bgColor: string; borderColor: string; label: string }
> = {
  credential_yellow: {
    icon: <Clock className='size-4 text-amber-600' />,
    bgColor: 'bg-amber-50',
    borderColor: 'border-l-4 border-amber-400',
    label: 'Expiring Soon',
  },
  credential_red: {
    icon: <AlertTriangle className='size-4 text-red-600' />,
    bgColor: 'bg-red-50',
    borderColor: 'border-l-4 border-red-500',
    label: 'Urgent',
  },
  credential_expired: {
    icon: <ShieldX className='size-4 text-red-700' />,
    bgColor: 'bg-red-50',
    borderColor: 'border-l-4 border-red-700',
    label: 'Expired',
  },
  credential_rejected: {
    icon: <ShieldAlert className='size-4 text-orange-600' />,
    bgColor: 'bg-orange-50',
    borderColor: 'border-l-4 border-orange-500',
    label: 'Action Required',
  },
  private_access_request: {
    icon: <FileCheck className='size-4 text-blue-600' />,
    bgColor: 'bg-blue-50',
    borderColor: 'border-l-4 border-blue-500',
    label: 'Access Request',
  },
  private_access_granted: {
    icon: <ShieldCheck className='size-4 text-green-600' />,
    bgColor: 'bg-green-50',
    borderColor: 'border-l-4 border-green-500',
    label: 'Access Granted',
  },
  private_access_revoked: {
    icon: <ShieldX className='size-4 text-gray-600' />,
    bgColor: 'bg-gray-50',
    borderColor: 'border-l-4 border-gray-400',
    label: 'Access Revoked',
  },
  // SCRUM-87/88: credentialing-mode engagement notifications
  agency_onboarded: {
    icon: <UserPlus className='size-4 text-indigo-600' />,
    bgColor: 'bg-indigo-50',
    borderColor: 'border-l-4 border-indigo-500',
    label: 'Agency Onboarded',
  },
  credentials_downloaded: {
    icon: <Download className='size-4 text-emerald-600' />,
    bgColor: 'bg-emerald-50',
    borderColor: 'border-l-4 border-emerald-500',
    label: 'Credentials Downloaded',
  },
  // SCRUM-117/118: e-signature flow
  esign_reminder: {
    icon: <PenLine className='size-4 text-amber-600' />,
    bgColor: 'bg-amber-50',
    borderColor: 'border-l-4 border-amber-400',
    label: 'Signature Needed',
  },
  esign_completed: {
    icon: <CheckCircle className='size-4 text-green-600' />,
    bgColor: 'bg-green-50',
    borderColor: 'border-l-4 border-green-500',
    label: 'Signing Complete',
  },
  esign_replaced: {
    icon: <RefreshCw className='size-4 text-amber-700' />,
    bgColor: 'bg-amber-50',
    borderColor: 'border-l-4 border-amber-500',
    label: 'Document Updated',
  },
  general: {
    icon: null,
    bgColor: '',
    borderColor: '',
    label: '',
  },
};

const Notifications = () => {
  const {
    data: notifications,
    refetch: refetchNotifications,
    isLoading: isNotificationsLoading,
  } = useNotifications();
  const isUnreadNotification = useMemo(
    () => notifications?.filter((noti: Notification) => !noti.isRead) || [],
    [notifications],
  );
  const router = useRouter();
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

  const handleCtaClick = (ctaLink: string) => {
    if (ctaLink) {
      router.push(ctaLink);
    }
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
      <div className='flex flex-col bg-white rounded-lg p-6 gap-3'>
        {notifications?.length > 0 ? (
          notifications?.map((noti: Notification, index: number) => {
            const config = NOTIFICATION_CONFIG[noti.type || 'general'] || NOTIFICATION_CONFIG.general;

            return (
              <div
                key={index}
                className={`flex flex-col gap-1.5 justify-between p-3 rounded-lg transition-colors ${config.bgColor} ${config.borderColor}`}
              >
                <div className='flex justify-between items-start gap-4'>
                  <div className='flex items-start gap-2.5 flex-1'>
                    {config.icon && (
                      <div className='mt-0.5 flex-shrink-0'>
                        {config.icon}
                      </div>
                    )}
                    <div className='flex-1'>
                      {config.label && (
                        <span className='text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5 block'>
                          {config.label}
                        </span>
                      )}
                      <div
                        className='text-sm text-gray-800'
                        dangerouslySetInnerHTML={{ __html: noti.message }}
                      ></div>
                    </div>
                  </div>
                  <Button
                    variant='special'
                    onClick={() => handleRemove(noti._id)}
                    disabled={isLoading}
                    className='flex-shrink-0'
                  >
                    <X className='size-4' />
                  </Button>
                </div>
                <div className='flex items-center justify-between pl-7'>
                  <span className='text-muted-foreground text-xs'>
                    {moment(noti.createdAt).format('DD MMM, YYYY, h:mm A')}
                  </span>
                  {noti.ctaLink && (
                    <button
                      onClick={() => handleCtaClick(noti.ctaLink!)}
                      className='flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors'
                    >
                      View <ArrowRight className='size-3' />
                    </button>
                  )}
                </div>
              </div>
            );
          })
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
