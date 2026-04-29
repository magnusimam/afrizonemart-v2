import type { MetadataRoute } from 'next';

/**
 * PWA web app manifest. Lets users "Add to Home Screen" on mobile.
 * Icons live in /public/icons. Replace with proper transparent
 * navy-on-amber afrizonemart marks when ready.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Afrizonemart — Made in Africa',
    short_name: 'Afrizonemart',
    description: 'Authentic African groceries, beauty, fashion and home goods, delivered.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F8FAFC',
    theme_color: '#000066',
    icons: [
      // TEMP: until proper transparent-bg navy-on-amber app icons land,
      // we point at the existing favicon so installs work without 404s.
      // Replace with /icons/icon-192.png and /icons/icon-512.png when
      // brand designer ships them.
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
    categories: ['shopping', 'lifestyle'],
  };
}
