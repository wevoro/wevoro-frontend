'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Share2, Mail, MessageSquare, Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareProfileModalProps {
  shareLink: string;
  children: React.ReactNode;
}

const ShareProfileModal: React.FC<ShareProfileModalProps> = ({ shareLink, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard!', { position: 'top-center' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShareSMS = () => {
    const message = encodeURIComponent(
      `Check out my caregiver profile on Wevoro: ${shareLink}`
    );
    window.open(`sms:?body=${message}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent('View my Wevoro caregiver profile');
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to share my verified caregiver profile with you on Wevoro.\n\nView my profile here: ${shareLink}\n\nBest regards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
              <Share2 className='w-5 h-5 text-primary' />
            </div>
            <div>
              <DialogTitle>Share Profile</DialogTitle>
              <p className='text-sm text-gray-500 mt-0.5'>
                Share this link with an agency to invite them to view your profile
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-4'>
          {/* Share link field */}
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Link2 className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                value={shareLink}
                readOnly
                className='pl-9 pr-4 bg-gray-50 text-sm font-medium text-gray-700 cursor-default'
              />
            </div>
            <Button onClick={handleCopy} className='gap-2 min-w-[100px]' size='default'>
              <AnimatePresence mode='wait'>
                {copied ? (
                  <motion.div key='check' initial={{ scale: 0 }} animate={{ scale: 1 }} className='flex items-center gap-1.5'>
                    <Check className='w-4 h-4' />
                    Copied!
                  </motion.div>
                ) : (
                  <motion.div key='copy' initial={{ scale: 0 }} animate={{ scale: 1 }} className='flex items-center gap-1.5'>
                    <Copy className='w-4 h-4' />
                    Copy Link
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>

          {/* Share via buttons */}
          <div className='flex gap-3'>
            <Button
              variant='outline'
              className='flex-1 gap-2'
              onClick={handleShareSMS}
            >
              <MessageSquare className='w-4 h-4' />
              Share via SMS
            </Button>
            <Button
              variant='outline'
              className='flex-1 gap-2'
              onClick={handleShareEmail}
            >
              <Mail className='w-4 h-4' />
              Share via Email
            </Button>
          </div>

          {/* Explanatory text */}
          <p className='text-xs text-gray-400 text-center leading-relaxed'>
            Share this link with an agency to invite them to view your profile and connect on Wevoro.
            Agencies who sign up through your link will be able to see your verified credentials.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProfileModal;
