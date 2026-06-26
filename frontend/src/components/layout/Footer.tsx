'use client';

import Link from 'next/link';
import { Sparkles, Heart, Mail, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// Inline SVG social icons (lucide-react doesn't include social brands)
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.732-8.835L2.25 2.25h6.938l4.26 5.632 5.796-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
function YoutubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.41 19.1C5.12 19.56 12 19.56 12 19.56s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95 29 29 0 0 0 .46-5.29 29 29 0 0 0-.46-5.44z"/><polygon points="9.75,15.02 15.5,11.75 9.75,8.48 9.75,15.02" fill="white"/>
    </svg>
  );
}

const footerLinks = {
  shop: [
    { label: 'Keychains', href: '/products?category=keychains' },
    { label: 'Lockets', href: '/products?category=lockets' },
    { label: 'Rings', href: '/products?category=rings' },
    { label: 'Earrings', href: '/products?category=earrings' },
    { label: 'Custom Gifts', href: '/custom-builder' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
  ],
  support: [
    { label: 'FAQs', href: '/faqs' },
    { label: 'Shipping Policy', href: '/shipping' },
    { label: 'Return Policy', href: '/returns' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Track Order', href: '/track' },
  ],
};

export function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast.success('🎉 You\'re subscribed! Watch your inbox for exclusive drops.');
    setEmail('');
  };

  return (
    <footer className="relative border-t border-white/5 mt-24">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0612] via-[#0d0820] to-[#0a0612]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Newsletter CTA */}
        <div className="mb-16 glass-card rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10" />
          <div className="relative z-10">
            <span className="section-tag mb-4 inline-block">✨ Exclusive Access</span>
            <h3 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
              Get <span className="gradient-text">20% off</span> your first order
            </h3>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              Join 50,000+ aesthetic lovers and get early access to new drops, exclusive discounts, and resin art inspo.
            </p>
            <form onSubmit={handleNewsletter} className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-glass flex-1"
                required
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <Send size={15} /> Subscribe
              </motion.button>
            </form>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-pink flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl gradient-text-purple">ResinVerse</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-5 max-w-xs">
              Handcrafted resin art pieces made with love. Each piece is unique, aesthetic, and tells your story.
            </p>
            <p className="text-white/30 text-xs italic font-display">"Crafted Memories, Preserved Forever"</p>
            
            {/* Contact info */}
            <div className="mt-5 space-y-2">
              <a href="mailto:hello@resinverse.in" className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors">
                <Mail size={14} /> hello@resinverse.in
              </a>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <MapPin size={14} /> Made in India 🇮🇳
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3 mt-5">
              {[
                { icon: InstagramIcon, href: 'https://instagram.com/resinverse', label: 'Instagram' },
                { icon: XIcon, href: 'https://x.com/resinverse', label: 'X / Twitter' },
                { icon: YoutubeIcon, href: 'https://youtube.com/resinverse', label: 'YouTube' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full glass flex items-center justify-center text-white/50 hover:text-white hover:border-purple-500/50 transition-all hover:shadow-glow-purple"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>

          </div>

          {/* Shop */}
          <div>
            <h4 className="text-white font-semibold font-accent text-sm mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {footerLinks.shop.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/40 hover:text-white/80 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold font-accent text-sm mb-4">Support</h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/40 hover:text-white/80 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold font-accent text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/40 hover:text-white/80 text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment methods */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs text-center md:text-left">
            © 2024 ResinVerse. Made with <Heart size={10} className="inline text-pink-500" /> in India. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-white/25 text-xs">
            <span className="glass px-3 py-1 rounded-full">UPI</span>
            <span className="glass px-3 py-1 rounded-full">Razorpay</span>
            <span className="glass px-3 py-1 rounded-full">Net Banking</span>
            <span className="glass px-3 py-1 rounded-full">Cards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
