import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';

const FacebookIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.99 22 12z" />
  </svg>
);

const TwitterIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedInIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

interface LinkItem {
  label: string;
  href: string;
}

interface LinkColumn {
  heading: string;
  links: LinkItem[];
}

const columns: LinkColumn[] = [
  {
    heading: 'AfriZoneMart Services',
    links: [
      { label: 'AndromedaPay', href: '/services/andromeda-pay' },
      {
        label: 'Earn 5% back with the AfrizoneMart Credit Card',
        href: '/services/credit-card',
      },
      {
        label: 'Advertise Your Products with AfriZoneMart',
        href: '/services/advertise',
      },
      { label: 'AfriZoneMart Pro', href: '/services/pro' },
    ],
  },
  {
    heading: 'Make Money With Us',
    links: [
      { label: 'For Manufacturers', href: '/sell/manufacturers' },
      { label: 'For Suppliers', href: '/sell/suppliers' },
      { label: 'For Creative Entrepreneurs', href: '/sell/creatives' },
      { label: 'AfriZoneMart In-Store Franchise', href: '/sell/franchise' },
    ],
  },
  {
    heading: 'Get to Know Us',
    links: [
      { label: 'Pickup Locations', href: '/about/locations' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Corporate Affairs', href: '/about/corporate' },
      { label: 'AfriZoneMart & Covid 19', href: '/about/covid' },
      { label: 'AfriZoneMart & Climate Change', href: '/about/climate' },
      { label: 'Visit an AfriZoneMart Store', href: '/about/stores' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy & Security', href: '/legal/privacy' },
      { label: 'Terms of Use', href: '/legal/terms' },
      {
        label: 'Do Not Sell Your Personal Information',
        href: '/legal/do-not-sell',
      },
      {
        label: 'AfrizoneMart & Personal Information',
        href: '/legal/personal-info',
      },
      { label: 'Buyer Protection', href: '/legal/buyer-protection' },
    ],
  },
];

const socials = [
  { Icon: FacebookIcon, href: 'https://facebook.com/afrizonemart', label: 'Facebook' },
  { Icon: TwitterIcon, href: 'https://x.com/afrizonemart', label: 'X (Twitter)' },
  { Icon: InstagramIcon, href: 'https://instagram.com/afrizonemart', label: 'Instagram' },
  { Icon: LinkedInIcon, href: 'https://linkedin.com/company/afrizonemart', label: 'LinkedIn' },
];

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-site px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-10">
          <div className="flex flex-col gap-4 md:col-span-3">
            <Link href="/" className="block">
              <Image
                src="/images/logo.png"
                alt="AfriZoneMart.com — Made in Africa, delivered worldwide"
                width={260}
                height={80}
                className="h-14 w-auto md:h-16"
              />
            </Link>
            <div className="flex flex-col gap-2">
              <p className="font-raleway text-sm font-bold text-navy">Contact Info</p>
              <a
                href="tel:+2347036141990"
                className="flex items-center gap-2 font-sans text-xs text-charcoal hover:text-navy md:text-sm"
              >
                <Phone size={14} aria-hidden />
                +234 7036141990
              </a>
              <a
                href="mailto:corporate@afrizonemart.com"
                className="flex items-center gap-2 font-sans text-xs text-charcoal hover:text-navy md:text-sm"
              >
                <Mail size={14} aria-hidden />
                corporate@afrizonemart.com
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-9 md:grid-cols-4">
            {columns.map((col) => (
              <div key={col.heading} className="flex flex-col gap-3">
                <h4 className="font-raleway text-sm font-bold text-navy md:text-base">
                  {col.heading}
                </h4>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="font-sans text-xs leading-snug text-muted transition-colors hover:text-navy md:text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-site flex-col items-center justify-between gap-3 px-4 py-4 text-center md:flex-row md:text-left">
          <p className="font-sans text-xs text-muted">
            © 2026 AfrizoneMart. All rights reserved.
          </p>
          <p className="font-sans text-xs text-muted">
            Powered by{' '}
            <a
              href="https://afrizonemart.com"
              className="font-semibold text-navy hover:underline"
            >
              Afrizonemart
            </a>
          </p>
          <div className="flex items-center gap-3">
            <span className="font-raleway text-xs font-semibold text-navy">
              Follow Us
            </span>
            {socials.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-white transition-colors hover:bg-amber hover:text-navy"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
