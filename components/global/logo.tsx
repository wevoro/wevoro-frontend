import { cn } from '@/lib/utils';
import Link from 'next/link';
import React from 'react';
import { Averia_Serif_Libre } from 'next/font/google';

const averia = Averia_Serif_Libre({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
});

const Logo = ({ className }: { className?: string }) => {
  return (
    <Link
      href='/'
      className={cn(`${averia.className} text-4xl text-primary`, className)}
    >
      Wevoro
    </Link>
  );
};

export default Logo;
