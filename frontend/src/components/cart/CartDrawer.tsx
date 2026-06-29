'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Tag } from 'lucide-react';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { cartAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export function CartDrawer() {
  const { cart, isCartOpen, setCartOpen, updateQuantity, removeFromCart, cartTotal, cartCount, appliedCoupon, setAppliedCoupon } = useStore();
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || '');
  const [couponLoading, setCouponLoading] = useState(false);

  const subtotal = cartTotal();
  const shippingCost = subtotal > 999 ? 0 : 49;
  const couponDiscount = appliedCoupon?.discount || 0;
  const total = subtotal - couponDiscount + shippingCost;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await cartAPI.applyCoupon(couponCode.trim(), subtotal);
      setAppliedCoupon({ code: res.data.coupon.code, discount: res.data.discount });
      toast.success(`Coupon applied! You saved ₹${res.data.discount.toFixed(0)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[80] w-full max-w-md bg-[#0a0612] border-l border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-purple-400" />
                <span className="font-display text-lg font-semibold text-white">Your Cart</span>
                <span className="badge-purple text-xs">{cartCount()} items</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setCartOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4 px-6 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16">
                  <div className="w-24 h-24 rounded-full glass flex items-center justify-center">
                    <ShoppingBag size={36} className="text-white/20" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Your cart is empty</h3>
                    <p className="text-white/40 text-sm">Discover beautiful resin art pieces</p>
                  </div>
                  <Link href="/products" onClick={() => setCartOpen(false)}>
                    <button className="btn-primary text-sm">Browse Products</button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const discountedPrice = item.price * (1 - item.discountPct / 100);
                    return (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-4 glass rounded-2xl p-3 group"
                      >
                        <div className="w-18 h-18 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative" style={{ width: 72, height: 72 }}>
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.slug}`} onClick={() => setCartOpen(false)}>
                            <h4 className="text-sm font-medium text-white/90 truncate hover:text-white transition-colors">{item.name}</h4>
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-purple-400 font-semibold text-sm">₹{discountedPrice.toFixed(0)}</span>
                            {item.discountPct > 0 && (
                              <span className="text-white/30 text-xs line-through">₹{item.price}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1 glass rounded-full px-1 py-0.5">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-6 h-6 rounded-full hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-white text-sm font-medium w-6 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                className="w-6 h-6 rounded-full hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all disabled:opacity-30"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                removeFromCart(item.productId);
                                toast.success('Removed from cart');
                              }}
                              className="ml-auto p-1.5 rounded-full text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer with totals */}
            {cart.length > 0 && (
              <div className="border-t border-white/10 px-6 py-5 space-y-4">
                {/* Coupon */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="w-full pl-9 pr-3 py-2.5 glass rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    className="btn-secondary text-sm py-2.5 px-4 whitespace-nowrap"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-400 flex items-center gap-1">
                      <Tag size={12} /> {appliedCoupon.code}
                    </span>
                    <span className="text-green-400">-₹{appliedCoupon.discount.toFixed(0)}</span>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? <span className="text-green-400">FREE</span> : `₹${shippingCost}`}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-white text-base pt-2 border-t border-white/10">
                    <span>Total</span><span className="gradient-text-purple">₹{total.toFixed(0)}</span>
                  </div>
                  {subtotal < 999 && (
                    <p className="text-xs text-white/40 text-center">Add ₹{(999 - subtotal).toFixed(0)} more for free shipping!</p>
                  )}
                </div>

                <Link href="/checkout" onClick={() => setCartOpen(false)}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="w-full btn-primary py-3.5 flex items-center justify-center gap-2"
                  >
                    Checkout <ArrowRight size={16} />
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
