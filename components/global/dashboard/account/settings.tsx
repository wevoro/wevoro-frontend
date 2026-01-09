import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const links = [
  {
    icon: <img src='/faq.svg' alt='account' className='size-6' />,
    name: 'FAQ',
    path: '/#faqs',
  },
  {
    icon: <img src='/privacy.svg' alt='account' className='size-6' />,
    name: 'Privacy Policy',
    path: '/privacy',
  },
  {
    icon: <img src='/terms.svg' alt='account' className='size-6' />,
    name: 'Terms and Conditions',
    path: '/terms',
  },
  {
    icon: <img src='/logout.svg' alt='account' className='size-6' />,
    name: 'Logout',
    path: '/logout',
    className: 'text-red-500',
  },
];

const Settings = () => {
  return (
    <div className='flex flex-col bg-white rounded-lg p-6 gap-5'>
      {links.map((link, index) => (
        <Link
          key={index}
          href={link.path}
          className={`flex items-center justify-between p-4 ${
            link.className || ''
          }`}
        >
          <div className='flex items-center gap-6'>
            {link.icon}
            <span className='text-muted-foreground text-sm'>{link.name}</span>
          </div>
          <ChevronRight className='size-5' />
        </Link>
      ))}
    </div>
  );
};

export default Settings;
