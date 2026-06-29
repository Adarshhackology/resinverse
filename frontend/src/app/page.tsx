'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Star, Package, Truck, RefreshCw, Shield, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { productsAPI, categoriesAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '@/components/products/ProductCard';
import { AIChatWidget } from '@/components/ai/AIChatWidget';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Camera, Heart } from 'lucide-react';

// ─── Floating Particles ─────────────────────────────────────────────────────
function FloatingParticles() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      delay: Math.random() * 6,
      duration: Math.random() * 8 + 6,
      color: ['#8B5CF6', '#EC4899', '#C4B5FD', '#F59E0B', '#06B6D4'][Math.floor(Math.random() * 5)],
    })));
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.4,
            filter: 'blur(1px)',
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.2, 0.6, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────
function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  const heroWords = ['Keychains', 'Lockets', 'Rings', 'Memories'];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setWordIndex(i => (i + 1) % heroWords.length), 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-resin-hero">
      <FloatingParticles />

      {/* Radial gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="section-tag mb-6"
        >
          <Sparkles size={12} /> Handcrafted in India • Made with Love
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-display text-5xl sm:text-7xl lg:text-8xl font-bold text-white mb-4 leading-none tracking-tight"
        >
          Crafted{' '}
          <AnimatePresence mode="wait">
            <motion.span
              key={wordIndex}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="gradient-text inline-block"
            >
              {heroWords[wordIndex]}
            </motion.span>
          </AnimatePresence>
          <br />
          <span className="text-white/80">Preserved Forever</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Discover handmade resin art jewelry, keychains, and personalized gifts. 
          Each piece is a unique work of art, crafted with love for aesthetic souls.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/products">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="btn-primary text-base py-4 px-8 flex items-center gap-2">
              Shop Now <ArrowRight size={18} />
            </motion.button>
          </Link>
          <Link href="/custom-builder">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="btn-secondary text-base py-4 px-8 flex items-center gap-2">
              <Sparkles size={16} /> Custom Builder
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-2 md:flex items-center justify-center gap-6 md:gap-16 mt-16"
        >
          {[
            { value: '50K+', label: 'Happy Customers' },
            { value: '1000+', label: 'Unique Designs' },
            { value: '4.9★', label: 'Average Rating' },
            { value: '100%', label: 'Handmade' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl md:text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-xs text-white/40 mt-1 font-accent">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30"
        >
          <span className="text-xs font-accent">Scroll to explore</span>
          <div className="w-0.5 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Scrolling Marquee ────────────────────────────────────────────────────────
function ScrollingMarquee() {
  const words = ["✨ HANDCRAFTED", "🔥 TRENDY", "💅 AESTHETIC", "🎁 CUSTOM MADE", "⭐ GEN-Z APPROVED", "✨ HANDCRAFTED", "🔥 TRENDY", "💅 AESTHETIC", "🎁 CUSTOM MADE", "⭐ GEN-Z APPROVED"];
  return (
    <div className="w-full bg-purple-500/10 border-y border-purple-500/20 py-4 overflow-hidden relative rotate-[-1deg] scale-105 my-12">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0612] to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0612] to-transparent z-10" />
      <div className="flex w-[200%] animate-[marquee_25s_linear_infinite]">
        {words.map((word, i) => (
          <span key={i} className="text-xl md:text-2xl font-bold font-display text-white/80 mx-8 whitespace-nowrap">
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Instagram Style Feed ────────────────────────────────────────────────────
function InstagramFeed() {
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => settingsAPI.get().then(r => r.data.settings),
  });

  let images = [
    "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400",
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400",
    "https://images.unsplash.com/photo-1571439908151-512a84a20b08?w=400",
    "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=400",
    "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400",
  ];

  if (settings && settings.instagramPhotos) {
    try {
      const parsed = JSON.parse(settings.instagramPhotos);
      if (Array.isArray(parsed) && parsed.length > 0) {
        images = parsed;
      }
    } catch (e) {}
  }


  return (
    <section className="py-20 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium mb-4">
            <Camera size={14} /> @ResinVerse
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-2">Spotted on <span className="gradient-text">Instagram</span></h2>
          <p className="text-white/50 text-sm max-w-lg mx-auto">Tag us in your photos to be featured on our page!</p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {images.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative min-w-[250px] aspect-[4/5] rounded-2xl overflow-hidden snap-center group cursor-pointer"
            >
              <img src={img} alt="Instagram Post" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Heart className="text-white fill-white scale-0 group-hover:scale-100 transition-transform duration-500 delay-100" size={32} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Categories Grid ─────────────────────────────────────────────────────────
function CategoriesGrid() {
  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list().then(r => r.data.categories),
  });

  const hardcodedCategories = [
    { slug: 'keychains', name: 'Keychains', icon: '🔑', gradient: 'from-purple-500/20 to-pink-500/20', glow: 'rgba(139,92,246,0.3)' },
    { slug: 'lockets', name: 'Lockets', icon: '💝', gradient: 'from-pink-500/20 to-rose-500/20', glow: 'rgba(236,72,153,0.3)' },
    { slug: 'rings', name: 'Rings', icon: '💍', gradient: 'from-violet-500/20 to-purple-500/20', glow: 'rgba(139,92,246,0.3)' },
    { slug: 'bracelets', name: 'Bracelets', icon: '📿', gradient: 'from-cyan-500/20 to-blue-500/20', glow: 'rgba(6,182,212,0.3)' },
    { slug: 'earrings', name: 'Earrings', icon: '✨', gradient: 'from-amber-500/20 to-yellow-500/20', glow: 'rgba(245,158,11,0.3)' },
    { slug: 'couple-gifts', name: 'Couple Gifts', icon: '💑', gradient: 'from-red-500/20 to-pink-500/20', glow: 'rgba(236,72,153,0.3)' },
    { slug: 'bookmarks', name: 'Bookmarks', icon: '📚', gradient: 'from-green-500/20 to-teal-500/20', glow: 'rgba(6,182,212,0.3)' },
    { slug: 'phone-charms', name: 'Phone Charms', icon: '📱', gradient: 'from-purple-500/20 to-indigo-500/20', glow: 'rgba(139,92,246,0.3)' },
    { slug: 'custom-gifts', name: 'Custom Gifts', icon: '🎁', gradient: 'from-amber-500/20 to-rose-500/20', glow: 'rgba(245,158,11,0.3)' },
    { slug: 'name-tags', name: 'Name Tags', icon: '🏷️', gradient: 'from-teal-500/20 to-cyan-500/20', glow: 'rgba(6,182,212,0.3)' },
  ];
  const displayCategories = data && data.length > 0 ? data : hardcodedCategories;

  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="section-tag mb-4 inline-block">Browse by Category</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
            Shop <span className="gradient-text">Collections</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayCategories.map((cat: any, i: number) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <Link href={`/products?category=${cat.slug}`}>
                <div
                  className={`glass rounded-2xl p-6 text-center cursor-pointer group relative overflow-hidden bg-gradient-to-br ${cat.gradient || 'from-white/5 to-white/10'}`}
                  style={{ boxShadow: `0 8px 32px ${cat.glow || 'rgba(0,0,0,0.1)'}` }}
                >
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{cat.icon || '✨'}</div>
                  <h3 className="font-semibold text-white/90 group-hover:text-white transition-colors">{cat.name}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Best Sellers ─────────────────────────────────────────────────────────────
function BestSellers() {
  const { data, isLoading } = useQuery({
    queryKey: ['bestsellers'],
    queryFn: () => productsAPI.list({ bestseller: true, limit: 8 }).then(r => r.data.products),
  });

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="section-tag mb-3 inline-block">⭐ Top Picks</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
              Best <span className="gradient-text">Sellers</span>
            </h2>
          </div>
          <Link href="/products?sort=bestseller" className="text-purple-400 hover:text-purple-300 font-accent text-sm flex items-center gap-1 transition-colors">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass rounded-2xl overflow-hidden">
                <div className="aspect-square shimmer-bg" />
                <div className="p-4 space-y-2">
                  <div className="h-4 shimmer-bg rounded-full w-3/4" />
                  <div className="h-3 shimmer-bg rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {data?.map((product: any, i: number) => (
              <ProductCard key={product.id} {...product} index={i} categoryName={product.category?.name} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Featured Banner ──────────────────────────────────────────────────────────
function FeaturedBanner() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-3xl overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-500/10 to-cyan-500/10" />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />

          <div className="relative z-10 grid md:grid-cols-2 items-center gap-8 p-8 md:p-12">
            <div>
              <span className="section-tag mb-4 inline-block">✨ New Collection</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Build Your <span className="gradient-text">Dream Piece</span>
              </h2>
              <p className="text-white/50 mb-6 text-lg leading-relaxed">
                Upload your photos, choose your colors, add names and glitter — we'll handcraft your unique resin piece and ship it to you in 7-14 days.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                {['Upload Photos', 'Add Your Name', 'Choose Colors', 'Pick Glitter', 'Live Preview'].map(feature => (
                  <span key={feature} className="badge-purple text-xs">✓ {feature}</span>
                ))}
              </div>
              <Link href="/custom-builder">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="btn-primary flex items-center gap-2">
                  <Sparkles size={18} /> Start Customizing
                </motion.button>
              </Link>
            </div>
            <div className="relative hidden md:block">
              <motion.div
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-full aspect-square max-w-sm mx-auto"
              >
                <div className="absolute inset-8 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 blur-2xl" />
                <div className="absolute inset-0 rounded-3xl glass-card flex items-center justify-center text-8xl">
                  ✨
                </div>
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl glass flex items-center justify-center text-3xl"
                >
                  💍
                </motion.div>
                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -bottom-4 -left-4 w-16 h-16 rounded-2xl glass flex items-center justify-center text-3xl"
                >
                  🔑
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Customer Reviews ─────────────────────────────────────────────────────────
function CustomerReviews() {
  const reviews = [
    { name: 'Priya Sharma', avatar: '👩', rating: 5, text: 'Absolutely love my custom keychain! The quality is amazing and the glitter inside is so beautiful. Will definitely order again! 💜', product: 'Custom Name Keychain', location: 'Mumbai' },
    { name: 'Ananya Gupta', avatar: '👩‍🦱', rating: 5, text: 'The couple heart set was the perfect anniversary gift. My boyfriend and I both love it so much! Packaging was also super aesthetic ✨', product: 'Couple Heart Set', location: 'Delhi' },
    { name: 'Riya Mehta', avatar: '👩‍🦰', rating: 5, text: 'I\'ve ordered 3 times already and every piece exceeds my expectations. The preserved rose keychain is literally art 🌹', product: 'Preserved Rose Keychain', location: 'Bangalore' },
    { name: 'Shreya Patel', avatar: '🧑‍🦱', rating: 5, text: 'My friend literally cried when she saw the custom locket I made for her birthday. The personalization is so thoughtful!', product: 'Galaxy Glitter Locket', location: 'Pune' },
    { name: 'Meera Singh', avatar: '👩‍🦳', rating: 4, text: 'The butterfly earrings are so lightweight and pretty. Received so many compliments at college! Fast delivery too 🦋', product: 'Butterfly Earrings', location: 'Chennai' },
  ];

  const [active, setActive] = useState(0);

  const next = () => setActive(i => (i + 1) % reviews.length);
  const prev = () => setActive(i => (i - 1 + reviews.length) % reviews.length);

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none" />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <span className="section-tag mb-4 inline-block">💬 Real Customers</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
            What They're <span className="gradient-text">Saying</span>
          </h2>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="glass-card rounded-3xl p-8 md:p-12 text-center relative"
            >
              <div className="flex justify-center mb-4">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={20} fill={s <= reviews[active].rating ? '#f59e0b' : 'none'} stroke={s <= reviews[active].rating ? '#f59e0b' : '#ffffff20'} />
                ))}
              </div>
              <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-6 font-display italic">
                "{reviews[active].text}"
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="text-3xl">{reviews[active].avatar}</div>
                <div className="text-left">
                  <p className="font-semibold text-white">{reviews[active].name}</p>
                  <p className="text-sm text-white/40">{reviews[active].location} · {reviews[active].product}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={prev} className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/60 hover:text-white transition-all">
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === active ? 'bg-purple-500 w-6' : 'bg-white/20'}`}
                />
              ))}
            </div>
            <button onClick={next} className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/60 hover:text-white transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Trust Badges ─────────────────────────────────────────────────────────────
function TrustBadges() {
  const badges = [
    { icon: Package, title: 'Premium Quality', desc: 'UV-resistant, durable resin' },
    { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
    { icon: RefreshCw, title: '7-Day Returns', desc: 'Hassle-free returns' },
    { icon: Shield, title: 'Secure Payment', desc: 'Razorpay encrypted' },
  ];

  return (
    <section className="py-12 px-4 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 glass rounded-2xl group hover:bg-white/5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/25 transition-all">
                <b.icon size={18} className="text-purple-400" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm font-semibold text-white/90">{b.title}</p>
                <p className="text-xs text-white/40">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Featured Products (New) ──────────────────────────────────────────────────
function FeaturedProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured'],
    queryFn: () => productsAPI.list({ featured: true, limit: 4 }).then(r => r.data.products),
  });

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="section-tag mb-3 inline-block">✨ Trending</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
              Featured <span className="gradient-text">Picks</span>
            </h2>
          </div>
          <Link href="/products?featured=true" className="text-purple-400 hover:text-purple-300 font-accent text-sm flex items-center gap-1 transition-colors">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl aspect-[3/4] shimmer-bg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data?.map((p: any, i: number) => <ProductCard key={p.id} {...p} index={i} categoryName={p.category?.name} />)}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <ScrollingMarquee />
        <CategoriesGrid />
        <BestSellers />
        <FeaturedBanner />
        <InstagramFeed />
        <FeaturedProducts />
        <CustomerReviews />
      </main>
      <Footer />
      <CartDrawer />
      <AIChatWidget />
    </>
  );
}
