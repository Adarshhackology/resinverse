'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Star, ChevronLeft, ChevronRight, Share2, Minus, Plus, Truck, Shield, RefreshCw, Zap, Check, Camera } from 'lucide-react';
import { productsAPI, wishlistAPI } from '@/lib/api';
import { useStore } from '@/lib/store';
import { ProductCard } from '@/components/products/ProductCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AIChatWidget } from '@/components/ai/AIChatWidget';
import { VirtualTryOn } from '@/components/products/VirtualTryOn';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ProductDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { addToCart, setCartOpen, user } = useStore();

  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [addedToCart, setAddedToCart] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsAPI.getBySlug(slug).then(r => r.data),
    enabled: !!slug,
  });

  const product = data?.product;
  const related = data?.related || [];

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 py-12">
            <div className="aspect-square glass rounded-3xl shimmer-bg" />
            <div className="space-y-4 py-8">
              <div className="h-8 shimmer-bg rounded-full w-2/3" />
              <div className="h-5 shimmer-bg rounded-full w-1/3" />
              <div className="h-12 shimmer-bg rounded-full w-1/2" />
              <div className="h-32 shimmer-bg rounded-2xl" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-4">Product not found</h2>
          <Link href="/products"><button className="btn-primary">Browse Products</button></Link>
        </div>
      </div>
      <Footer />
    </>
  );

  const discountedPrice = product.price * (1 - (product.discountPct || 0) / 100);

  const handleAddToCart = () => {
    addToCart({
      productId: product.id, name: product.name, price: product.price,
      discountPct: product.discountPct || 0, image: product.images[0],
      quantity, slug: product.slug, stock: product.stock,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    setCartOpen(true);
    toast.success(`${product.name} added to cart! 🛍️`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Sign in to save to wishlist'); return; }
    try {
      if (wishlisted) {
        await wishlistAPI.remove(product.id);
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(product.id);
        setWishlisted(true);
        toast.success('Added to wishlist! 💖');
      }
    } catch { toast.error('Something went wrong'); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  const images = product.images?.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/40 py-6">
            <Link href="/" className="hover:text-white/70 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-white/70 transition-colors">Products</Link>
            <span>/</span>
            <span className="text-white/70 truncate max-w-xs">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">
            {/* Image Gallery */}
            <div className="flex flex-col gap-4">
              {/* Main image */}
              <div className="relative aspect-square rounded-3xl overflow-hidden glass-card group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImg}
                    src={images[selectedImg]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600'; }}
                  />
                </AnimatePresence>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.isBestSeller && <span className="badge-gold">⭐ Best Seller</span>}
                  {(product.discountPct || 0) > 0 && <span className="badge-pink">-{product.discountPct}% OFF</span>}
                  {product.stock <= 5 && product.stock > 0 && <span className="badge text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">🔥 Only {product.stock} left!</span>}
                </div>

                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setSelectedImg(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => setSelectedImg(i => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                  {images.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImg(i)}
                      className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all ${
                        selectedImg === i ? 'ring-2 ring-purple-500 scale-105' : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200'; }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col gap-5">
              {/* Category & Name */}
              <div>
                {product.category && (
                  <Link href={`/products?category=${product.category.slug}`}>
                    <span className="section-tag text-xs mb-2 inline-block">{product.category.name}</span>
                  </Link>
                )}
                <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">{product.name}</h1>
              </div>

              {/* Rating */}
              {(product.rating || 0) > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={16} fill={s <= Math.round(product.rating) ? '#f59e0b' : 'none'} stroke={s <= Math.round(product.rating) ? '#f59e0b' : '#ffffff20'} />
                    ))}
                  </div>
                  <span className="text-white font-semibold text-sm">{product.rating}</span>
                  <span className="text-white/40 text-sm">({product.reviewCount} reviews)</span>
                  <button onClick={() => setActiveTab('reviews')} className="text-purple-400 text-sm hover:text-purple-300 transition-colors">View all</button>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-4">
                <span className="font-display text-4xl font-bold gradient-text">₹{discountedPrice.toFixed(0)}</span>
                {(product.discountPct || 0) > 0 && (
                  <>
                    <span className="text-xl text-white/30 line-through">₹{product.price}</span>
                    <span className="badge-pink">Save ₹{(product.price - discountedPrice).toFixed(0)}</span>
                  </>
                )}
              </div>

              {/* Stock */}
              {product.stock <= 10 && product.stock > 0 && (
                <p className="text-orange-400 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                  Only {product.stock} items left in stock
                </p>
              )}

              {/* Colors */}
              {product.colors?.length > 0 && (
                <div>
                  <p className="text-sm text-white/50 mb-2 font-accent">Available Colors</p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color: string) => (
                      <span key={color} className="badge-purple text-xs">{color}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="flex items-center gap-4">
                <p className="text-sm text-white/50 font-accent">Quantity</p>
                <div className="flex items-center gap-1 glass rounded-full px-2 py-1.5">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all">
                    <Minus size={14} />
                  </button>
                  <span className="text-white font-semibold w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock} className="w-8 h-8 rounded-full hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all disabled:opacity-30">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <AnimatePresence mode="wait">
                    {addedToCart ? (
                      <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                        <Check size={18} /> Added!
                      </motion.span>
                    ) : (
                      <motion.span key="add" className="flex items-center gap-2">
                        <ShoppingBag size={18} /> Add to Cart
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBuyNow}
                  disabled={product.stock === 0}
                  className="flex-1 py-4 px-6 rounded-full font-semibold font-accent text-white border border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap size={16} /> Buy Now
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleWishlist}
                  className={`w-14 h-14 rounded-full border border-white/20 flex items-center justify-center transition-all ${wishlisted ? 'bg-pink-500/20 border-pink-500/40' : 'hover:bg-white/5'}`}
                >
                  <Heart size={20} fill={wishlisted ? '#ec4899' : 'none'} stroke={wishlisted ? '#ec4899' : 'currentColor'} className={wishlisted ? 'text-pink-500' : 'text-white/60'} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Share2 size={18} />
                </motion.button>
              </div>

              {/* Virtual Try-On */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTryOn(true)}
                className="w-full py-4 mt-2 rounded-2xl font-semibold font-accent text-fuchsia-100 bg-gradient-to-r from-fuchsia-900/40 to-cyan-900/40 border border-fuchsia-500/30 hover:border-fuchsia-400/50 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-fuchsia-500/10"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera size={16} className="text-fuchsia-400" />
                </div>
                Virtual Try-On
              </motion.button>

              {/* Delivery info */}
              <div className="glass rounded-2xl p-4 grid grid-cols-3 gap-3">
                {[
                  { icon: Truck, text: 'Free delivery above ₹999' },
                  { icon: Shield, text: 'Secure Razorpay payment' },
                  { icon: RefreshCw, text: '7-day easy returns' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex flex-col items-center gap-1.5 text-center">
                    <Icon size={18} className="text-purple-400" />
                    <p className="text-xs text-white/50">{text}</p>
                  </div>
                ))}
              </div>

              {/* Material tags */}
              {product.material && (
                <div>
                  <p className="text-xs text-white/40 font-accent mb-1">Material</p>
                  <p className="text-sm text-white/70">{product.material}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-16">
            <div className="flex gap-1 glass rounded-2xl p-1.5 w-fit mb-6">
              {['description', 'reviews', 'shipping'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-medium font-accent transition-all capitalize ${
                    activeTab === tab ? 'bg-purple-500/30 text-purple-300' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {tab} {tab === 'reviews' && product.reviewCount > 0 && `(${product.reviewCount})`}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="glass-card rounded-2xl p-6 md:p-8"
              >
                {activeTab === 'description' && (
                  <div>
                    <p className="text-white/70 leading-relaxed text-base">{product.description}</p>
                    {product.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-6">
                        {product.tags.map((tag: string) => <span key={tag} className="badge-purple text-xs">#{tag}</span>)}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div>
                    {data?.product?.reviews?.length > 0 ? (
                      <div className="space-y-4">
                        {data.product.reviews.map((review: any) => (
                          <div key={review.id} className="glass rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-400">
                                  {review.user?.name?.[0] || 'U'}
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-white">{review.user?.name}</p>
                                  <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={s <= review.rating ? '#f59e0b' : 'none'} stroke={s <= review.rating ? '#f59e0b' : '#ffffff20'} />)}
                                  </div>
                                </div>
                              </div>
                              {review.isVerified && <span className="badge-purple text-[10px]">✓ Verified Purchase</span>}
                            </div>
                            <p className="text-white/65 text-sm mt-3 leading-relaxed">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-white/40">No reviews yet. Be the first to review!</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'shipping' && (
                  <div className="space-y-4">
                    {[
                      { title: 'Standard Delivery', desc: '5-7 business days • FREE on orders above ₹999 • ₹49 for smaller orders' },
                      { title: 'Express Delivery', desc: '2-3 business days • ₹99 extra • Pan India delivery' },
                      { title: 'Custom Orders', desc: '7-14 business days for custom/personalized products' },
                      { title: 'Returns & Exchanges', desc: '7-day return policy for defective items. Custom products are non-returnable.' },
                    ].map(item => (
                      <div key={item.title} className="flex gap-3 p-4 glass rounded-xl">
                        <Check size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-white/90">{item.title}</p>
                          <p className="text-sm text-white/50 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="mt-20">
              <h2 className="font-display text-3xl font-bold text-white mb-8">
                You Might <span className="gradient-text">Also Love</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {related.map((p: any, i: number) => (
                  <ProductCard key={p.id} {...p} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <AIChatWidget />
      
      <AnimatePresence>
        {showTryOn && <VirtualTryOn productImage={images[0]} onClose={() => setShowTryOn(false)} />}
      </AnimatePresence>
    </>
  );
}
