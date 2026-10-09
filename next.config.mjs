/**
 * SCRUM-144: the pages moved from /pro and /partner to /caregiver and /agency.
 * Every old address still works by forwarding to the new one, so links in
 * emails that were already sent, stored notification links, bookmarks and a
 * Stripe checkout started before the change all keep landing correctly.
 *
 * Order matters: the specific renames inside a path come before the catch-alls.
 * Temporary (307) on purpose — browsers cache a permanent redirect for good, so
 * it cannot be taken back if the naming changes again. Switch to permanent once
 * the new names are final.
 */
const LEGACY_URLS = [
  { source: '/partner/pros', destination: '/agency/caregivers' },
  { source: '/partner/pros/:id', destination: '/agency/caregivers/:id' },
  { source: '/partner/:path*', destination: '/agency/:path*' },
  { source: '/pro/partner/:id', destination: '/caregiver/agencies/:id' },
  { source: '/pro/:path*', destination: '/caregiver/:path*' },
  { source: '/pros', destination: '/caregivers' },
  { source: '/partners', destination: '/agencies' },
  { source: '/admin/pros', destination: '/admin/caregivers' },
  { source: '/admin/partners', destination: '/admin/agencies' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [

      {
        hostname: 'res.cloudinary.com',
      },

    ],
  },
  async redirects() {
    return LEGACY_URLS.map((r) => ({ ...r, permanent: false }));
  },
};

export default nextConfig;
