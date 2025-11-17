import React from 'react';
import SwalangLogoIcon from './icons/SwalangLogoIcon';
import TwitterIcon from './icons/TwitterIcon';
import GithubIcon from './icons/GithubIcon';
import DiscordIcon from './icons/DiscordIcon';
import Link from 'next/link';

const FooterLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <li>
    <Link href={href} className="text-gray-400 dark:text-swa-light-gray hover:text-swa-green transition-colors text-sm">
      {children}
    </Link>
  </li>
);

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 dark:bg-black text-white pt-16 pb-8 border-t border-gray-700 dark:border-swa-gray">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1 mb-8 lg:mb-0">
             <div className="[&_span]:!text-white">
                <SwalangLogoIcon />
             </div>
             <div className="flex space-x-4 mt-6">
                <a href="#" aria-label="Swalang on Twitter" className="text-gray-400 dark:text-swa-light-gray hover:text-swa-green transition-colors">
                    <TwitterIcon className="h-5 w-5" />
                </a>
                <a href="#" aria-label="Swalang on Github" className="text-gray-400 dark:text-swa-light-gray hover:text-swa-green transition-colors">
                    <GithubIcon className="h-5 w-5" />
                </a>
                <a href="#" aria-label="Join Swalang Discord" className="text-gray-400 dark:text-swa-light-gray hover:text-swa-green transition-colors">
                    <DiscordIcon className="h-5 w-5" />
                </a>
             </div>
          </div>

          <div>
            <h3 className="font-bold text-sm tracking-widest uppercase mb-4">About</h3>
            <ul className="space-y-3">
              <FooterLink href="/about">About Swalang</FooterLink>
              <FooterLink href="/getting-started">Getting Started</FooterLink>
              <FooterLink href="#">Help</FooterLink>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-widest uppercase mb-4">Resources</h3>
            <ul className="space-y-3">
              <FooterLink href="/downloads">Downloads</FooterLink>
              <FooterLink href="/docs">Documentation</FooterLink>
              <FooterLink href="/news">News</FooterLink>
              <FooterLink href="/careers">Careers</FooterLink>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-widest uppercase mb-4">Community</h3>
            <ul className="space-y-3">
              <FooterLink href="#">Swa Foundation</FooterLink>
              <FooterLink href="#">Code of Conduct</FooterLink>
              <FooterLink href="#">SwaHub</FooterLink>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-widest uppercase mb-4">Contribute</h3>
            <ul className="space-y-3">
              <FooterLink href="#">Issue Tracker</FooterLink>
              <FooterLink href="#">Source Code</FooterLink>
              <FooterLink href="#">Developer's Guide</FooterLink>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 dark:border-swa-gray pt-8 text-center text-sm text-gray-400 dark:text-swa-light-gray">
          <p>&copy; {new Date().getFullYear()} Swa Foundation. All rights reserved.</p>
          <p>Feedback: <a href="mailto:contact@swalang.org" className="text-swa-green hover:underline">contact@swalang.org</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;