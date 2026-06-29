import Link from 'next/link';

const platform = [
  { label: 'For Caregivers', href: '/pros' },
  { label: 'For Agencies', href: '/partners' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Credential Network', href: '#credential-network' },
];

const company = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className='text-xs font-semibold uppercase tracking-[1.2px] text-white/50'>
        {title}
      </h3>
      <ul className='mt-5 space-y-3'>
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className='text-sm text-white/75 transition-colors hover:text-white'
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className='bg-[#01400f] text-white'>
      <div className='mx-auto w-full max-w-[1440px] px-5 py-16 sm:px-10 lg:px-[65px] lg:py-20'>
        <div className='grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]'>
          <div className='max-w-sm'>
            <span className='text-3xl font-medium [font-family:var(--font-newsreader)]'>
              Wevoro
            </span>
            <p className='mt-5 text-sm leading-[1.7] text-white/60'>
              The verified credential platform that connects caregivers and
              healthcare agencies. Built for the future of home care staffing.
            </p>
          </div>
          <FooterCol title='Platform' links={platform} />
          <FooterCol title='Company' links={company} />
        </div>

        <div className='mt-16 border-t border-white/10 pt-8'>
          <p className='text-xs text-white/50'>
            © 2026 WeVoro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
