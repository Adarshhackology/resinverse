'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Search, Heart, Menu, X, Sparkles, User, LogOut, Settings, Package, ChevronDown } from 'lucide-react';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

const navLinks = [
  { href: '/products', label: 'Shop All' },
  { href: '/products?categoryId=keychains', label: 'Keychains' },
  { href: '/products?categoryId=couple-gifts', label: 'Couple Gifts' },
  { href: '/custom-builder', label: '✨ Custom', highlight: true },
];

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { cart, cartCount, user, logout, setCartOpen } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const count = cartCount();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } finally {
      logout();
      toast.success('Logged out successfully');
      router.push('/');
    }
  };

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass py-3 shadow-2xl bg-[#0a0612]/90 backdrop-blur-3xl' : 'bg-transparent py-5'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 rounded-xl bg-purple-pink opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 rounded-xl bg-purple-pink blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                <Sparkles className="relative z-10 w-5 h-5 text-white m-2" />
              </div>
              <span className="font-display font-bold text-xl gradient-text-purple hidden sm:block">
                ResinVerse
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden xl:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium font-accent rounded-full transition-all duration-200 ${
                    link.highlight
                      ? 'bg-purple-pink text-white shadow-glow-purple hover:shadow-glow-pink'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchOpen(true)}
                className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <Search size={20} />
              </motion.button>

              {/* Wishlist */}
              {mounted && user && (
                <Link href="/dashboard?tab=wishlist">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Heart size={20} />
                  </motion.button>
                </Link>
              )}

              {/* Cart */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setCartOpen(true)}
                className="relative p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <ShoppingBag size={20} />
                <AnimatePresence>
                  {mounted && count > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-pink text-white text-[10px] font-bold flex items-center justify-center"
                    >
                      {count > 99 ? '99+' : count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* User menu */}
              {mounted && user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-pink flex items-center justify-center text-white text-sm font-bold">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        user.name[0].toUpperCase()
                      )}
                    </div>
                    <ChevronDown size={14} className={`text-white/60 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-48 glass rounded-2xl p-2 border border-white/10 shadow-xl overflow-hidden"
                      >
                        <div className="px-3 py-2 mb-2 border-b border-white/10">
                          <p className="text-sm font-bold text-white truncate">{user.name}</p>
                          <p className="text-xs text-white/50 truncate">{user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all" onClick={() => setUserMenuOpen(false)}>
                            <User size={15} /> My Account
                          </Link>
                          <Link href="/dashboard?tab=orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-all" onClick={() => setUserMenuOpen(false)}>
                            <Package size={15} /> My Orders
                          </Link>
                          {user.role === 'ADMIN' && (
                            <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-white/5 transition-all" onClick={() => setUserMenuOpen(false)}>
                              <Settings size={15} /> Admin Panel
                            </Link>
                          )}
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-all">
                            <LogOut size={15} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login" className="hidden sm:block">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="btn-primary text-sm py-2 px-5"
                  >
                    Sign In
                  </motion.button>
                </Link>
              )}

              {/* Mobile menu */}
              <button
                className="xl:hidden p-2.5 text-white/70 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="xl:hidden glass border-t border-white/10"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-3 rounded-xl text-sm font-medium font-accent transition-all ${
                      link.highlight
                        ? 'bg-purple-pink text-white text-center'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                
                {/* Mobile Auth Links */}
                {!user && (
                  <Link
                    href="/login"
                    className="px-4 py-3 mt-2 rounded-xl text-sm font-medium font-accent bg-white/10 text-white text-center hover:bg-white/20 transition-all"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4"
            style={{ background: 'rgba(10, 6, 18, 0.9)', backdropFilter: 'blur(20px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
          >
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              className="w-full max-w-2xl"
            >
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for resin keychains, rings, custom gifts..."
                  className="w-full pl-12 pr-24 py-4 glass-card rounded-2xl text-white placeholder-white/30 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <button type="submit" className="!absolute right-3 top-1/2 -translate-y-1/2 btn-primary text-sm py-2 px-4">
                  Search
                </button>
              </form>
              <p className="text-center text-white/30 text-sm mt-4">Press Esc to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
