'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, Zap } from 'lucide-react';
import { useStore } from '@/lib/store';
import { wishlistAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPct?: number;
  images: string[];
  rating?: number;
  reviewCount?: number;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  stock?: number;
  categoryName?: string;
  index?: number;
}

export function ProductCard({
  id, name, slug, price, discountPct = 0, images, rating = 0, reviewCount = 0,
  isBestSeller, isFeatured, stock = 10, categoryName, index = 0,
}: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [hoveredImg, setHoveredImg] = useState(0);
  const { addToCart, setCartOpen, user } = useStore();

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const discountedPrice = price * (1 - discountPct / 100);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      productId: id, name, price, discountPct,
      image: images[0] || '/placeholder.jpg',
      quantity: 1, slug, stock,
    });
    setCartOpen(true);
    toast.success(`${name} added to cart! ✨`);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Sign in to save to wishlist'); return; }
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await wishlistAPI.remove(id);
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(id);
        setWishlisted(true);
        toast.success('Added to wishlist! 💖');
      }
    } catch { toast.error('Something went wrong'); }
    finally { setWishlistLoading(false); }
  };

  const displayImg = images[hoveredImg] || images[0] || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      className="perspective-1000"
    >
      <Link href={`/products/${slug}`} className="block group">
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY }}
          className="product-card relative transform-preserve-3d"
        >
          {/* Image container */}
          <div className="relative aspect-square overflow-hidden bg-white/5">
            <motion.img
              key={displayImg}
              src={displayImg}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600';
              }}
            />

            {/* Second image on hover */}
            {images.length > 1 && (
              <img
                src={images[1]}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {isBestSeller && <span className="badge-gold text-[10px]">⭐ Best Seller</span>}
              {isFeatured && <span className="badge-purple text-[10px]">✨ Featured</span>}
              {discountPct > 0 && <span className="badge-pink text-[10px]">-{discountPct}%</span>}
              {stock <= 5 && stock > 0 && <span className="badge text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30">🔥 Only {stock} left</span>}
              {stock === 0 && <span className="badge text-[10px] bg-red-500/20 text-red-300 border border-red-500/30">Sold Out</span>}
            </div>

            {/* Actions */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleWishlist}
                disabled={wishlistLoading}
                className={`w-9 h-9 rounded-full glass-strong flex items-center justify-center transition-all ${
                  wishlisted ? 'text-pink-500' : 'text-white/60 hover:text-pink-400'
                }`}
              >
                <Heart size={16} fill={wishlisted ? '#ec4899' : 'none'} />
              </motion.button>
            </div>

            {/* Quick add to cart */}
            {stock > 0 && (
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddToCart}
                  className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={14} /> Quick Add
                </motion.button>
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="p-4">
            {categoryName && (
              <p className="text-xs text-purple-400/70 font-accent font-medium mb-1 uppercase tracking-wider">{categoryName}</p>
            )}
            <h3 className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors line-clamp-2 mb-2">
              {name}
            </h3>

            {/* Rating */}
            {rating > 0 && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} size={11} fill={star <= Math.round(rating) ? '#f59e0b' : 'none'} stroke={star <= Math.round(rating) ? '#f59e0b' : '#ffffff30'} />
                  ))}
                </div>
                <span className="text-[11px] text-white/40">{reviewCount > 0 ? `(${reviewCount})` : ''}</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="text-base font-bold gradient-text-purple">₹{discountedPrice.toFixed(0)}</span>
              {discountPct > 0 && (
                <span className="text-sm text-white/30 line-through">₹{price}</span>
              )}
              {discountPct >= 20 && (
                <span className="ml-auto flex items-center gap-1 text-[10px] text-green-400">
                  <Zap size={10} /> Great deal
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
