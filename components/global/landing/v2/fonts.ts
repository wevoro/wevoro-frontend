import { DM_Sans, Newsreader } from 'next/font/google';

// Primary sans used across the redesign (Figma: 'DM Sans')
export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

// Serif used for the italic accent words (e.g. "Credential Profile.", "Your career.")
export const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['italic', 'normal'],
  variable: '--font-newsreader',
  display: 'swap',
});
