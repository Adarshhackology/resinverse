'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MapPin, CreditCard, CheckCircle, Plus, ArrowLeft, ArrowRight, Loader2, Tag } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useStore } from '@/lib/store';
import { ordersAPI, paymentsAPI, addressesAPI, cartAPI } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Link from 'next/link';

const steps = [
  { id: 1, label: 'Cart Review', icon: '🛍️' },
  { id: 2, label: 'Address', icon: '📍' },
  { id: 3, label: 'Payment', icon: '💳' },
  { id: 4, label: 'Confirmation', icon: '🎉' },
];

declare global { interface Window { Razorpay: any; } }

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, cartCount, clearCart, user } = useStore();
  const [step, setStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', label: 'Home' });

  const [showQrCode, setShowQrCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [showHelpModal, setShowHelpModal] = useState(false);

  const subtotal = cartTotal();
  const shippingCost = subtotal > 999 ? 0 : 49;
  const total = subtotal - couponDiscount + shippingCost;

  const { data: addressData, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesAPI.list().then(r => r.data.addresses),
    enabled: !!user,
  });

  const addresses = addressData || [];

  // Polling & Timer Effect
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    let pollInterval: NodeJS.Timeout;

    if (showQrCode && paymentStatus === 'PENDING') {
      timerInterval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setPaymentStatus('FAILED');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      pollInterval = setInterval(async () => {
        try {
          const res = await paymentsAPI.manualStatus(orderId);
          if (res.data.status === 'PAID') {
            setPaymentStatus('PAID');
            setStep(4);
            clearCart();
            setShowQrCode(false);
            toast.success('🎉 Payment Confirmed!');
          } else if (res.data.status === 'FAILED' || res.data.status === 'REJECTED') {
            setPaymentStatus('FAILED');
            toast.error('Payment rejected.');
          }
        } catch (e) { }
      }, 3000);
    }

    return () => {
      clearInterval(timerInterval);
      clearInterval(pollInterval);
    };
  }, [showQrCode, paymentStatus, orderId]);

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-2">Sign in to checkout</h2>
            <p className="text-white/40 mb-6">Please sign in to complete your purchase</p>
            <Link href="/login"><button className="btn-primary">Sign In</button></Link>
          </div>
        </div>
      </>
    );
  }

  if (cart.length === 0 && step < 4) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
            <Link href="/products"><button className="btn-primary mt-4">Shop Now</button></Link>
          </div>
        </div>
      </>
    );
  }

  const handleApplyCoupon = async () => {
    try {
      const res = await cartAPI.applyCoupon(couponCode, subtotal);
      setCouponDiscount(res.data.discount);
      toast.success(`Coupon applied! -₹${res.data.discount.toFixed(0)}`);
    } catch (err: any) { toast.error(err.response?.data?.error || 'Invalid coupon'); }
  };

  const handleAddAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error('Please fill all required fields'); return;
    }
    try {
      const res = await addressesAPI.create(newAddress);
      await refetchAddresses();
      setSelectedAddressId(res.data.address.id);
      setShowNewAddress(false);
      toast.success('Address saved!');
    } catch { toast.error('Failed to save address'); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) { toast.error('Please select a delivery address'); return; }
    setLoading(true);
    try {
      // Create order
      const orderRes = await ordersAPI.create({
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        addressId: selectedAddressId,
        couponCode: couponCode || undefined,
        paymentMethod: 'MANUAL_UPI',
      });
      const newOrderId = orderRes.data.order.id;
      setOrderId(newOrderId);

      // Create Manual Payment
      await paymentsAPI.manualCreate(newOrderId);
      
      setShowQrCode(true);
      setTimeLeft(120);
      setPaymentStatus('PENDING');

    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      await paymentsAPI.manualCreate(orderId);
      setShowQrCode(true);
      setTimeLeft(120);
      setPaymentStatus('PENDING');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to retry payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-white py-6">Checkout</h1>

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${step >= s.id ? 'text-purple-400' : 'text-white/25'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > s.id ? 'bg-purple-pink text-white' : step === s.id ? 'border-2 border-purple-500 bg-purple-500/10' : 'glass border border-white/10'}`}>
                    {step > s.id ? '✓' : s.icon}
                  </div>
                  <span className="hidden sm:block text-xs font-accent">{s.label}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${step > s.id ? 'bg-purple-500/60' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="md:col-span-2">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>

                  {/* Step 1: Cart Review */}
                  {step === 1 && (
                    <div className="glass-card rounded-2xl p-6">
                      <h2 className="font-semibold text-white mb-4">Review Your Cart ({cartCount()} items)</h2>
                      <div className="space-y-3">
                        {cart.map(item => {
                          const price = item.price * (1 - item.discountPct / 100);
                          return (
                            <div key={item.productId} className="flex gap-3 glass rounded-xl p-3">
                              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200'; }} />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white/90">{item.name}</p>
                                <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                              </div>
                              <p className="text-sm font-bold text-purple-400">₹{(price * item.quantity).toFixed(0)}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Coupon */}
                      <div className="flex gap-2 mt-5">
                        <div className="relative flex-1">
                          <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                          <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="WELCOME20" className="input-glass pl-9 text-sm w-full" />
                        </div>
                        <button onClick={handleApplyCoupon} className="btn-secondary text-sm px-4">Apply</button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Address */}
                  {step === 2 && (
                    <div className="glass-card rounded-2xl p-6">
                      <h2 className="font-semibold text-white mb-4">Delivery Address</h2>
                      <div className="space-y-3 mb-4">
                        {addresses.map((addr: any) => (
                          <button key={addr.id} onClick={() => setSelectedAddressId(addr.id)}
                            className={`w-full text-left glass rounded-xl p-4 transition-all ${selectedAddressId === addr.id ? 'border-purple-500 bg-purple-500/10 border' : 'border border-white/10 hover:border-white/20'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm text-white">{addr.name} <span className="badge-purple text-[10px] ml-2">{addr.label}</span></p>
                              {selectedAddressId === addr.id && <CheckCircle size={16} className="text-purple-400" />}
                            </div>
                            <p className="text-xs text-white/50">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                            <p className="text-xs text-white/50">{addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-xs text-white/50">📞 {addr.phone}</p>
                          </button>
                        ))}
                      </div>

                      <button onClick={() => setShowNewAddress(!showNewAddress)} className="btn-secondary text-sm py-2.5 w-full flex items-center justify-center gap-2">
                        <Plus size={14} /> Add New Address
                      </button>

                      <AnimatePresence>
                        {showNewAddress && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="glass rounded-2xl p-4 mt-4 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                  { label: 'Full Name*', key: 'name', placeholder: 'Priya Sharma' },
                                  { label: 'Phone*', key: 'phone', placeholder: '+91 9876543210' },
                                  { label: 'Address Line 1*', key: 'line1', placeholder: 'House/Flat No., Street' },
                                  { label: 'Line 2', key: 'line2', placeholder: 'Area, Landmark (optional)' },
                                  { label: 'City*', key: 'city', placeholder: 'Mumbai' },
                                  { label: 'State*', key: 'state', placeholder: 'Maharashtra' },
                                  { label: 'Pincode*', key: 'pincode', placeholder: '400001' },
                                ].map(f => (
                                  <div key={f.key} className={f.key === 'line1' || f.key === 'line2' ? 'col-span-2' : ''}>
                                    <label className="text-xs text-white/50 mb-1 block font-accent">{f.label}</label>
                                    <input
                                      value={(newAddress as any)[f.key]}
                                      onChange={e => setNewAddress(prev => ({ ...prev, [f.key]: e.target.value }))}
                                      placeholder={f.placeholder}
                                      className="input-glass text-sm w-full"
                                    />
                                  </div>
                                ))}
                              </div>
                              <button onClick={handleAddAddress} className="btn-primary text-sm py-2.5 w-full">Save Address</button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Step 3: Payment */}
                  {step === 3 && !showQrCode && (
                    <div className="glass-card rounded-2xl p-6">
                      <h2 className="font-semibold text-white mb-4">Payment</h2>
                      <div className="glass rounded-xl p-5 mb-5 border border-purple-500/50">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <CreditCard size={18} className="text-purple-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">UPI Payment</p>
                            <p className="text-xs text-white/40">Pay via Google Pay, PhonePe, Paytm</p>
                          </div>
                          <div className="ml-auto w-5 h-5 rounded-full border-2 border-purple-500 bg-purple-500/30 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-purple-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QR Code Flow inside Step 3 */}
                  {step === 3 && showQrCode && (
                    <div className="glass-card rounded-2xl p-6 text-center relative">
                      <div className="absolute top-4 right-4">
                        <button onClick={() => setShowHelpModal(true)} className="text-xs text-purple-400 hover:text-purple-300 underline font-medium">Need Help?</button>
                      </div>

                      <h2 className="font-semibold text-xl text-white mb-2">Scan to Pay</h2>
                      <p className="text-white/60 text-sm mb-6">Scan the QR code below using any UPI app</p>
                      
                      <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
                        {/* Assuming the user uploads upi-qr.png to the public folder */}
                        <img src="/upi-qr.png" alt="UPI QR Code" className="w-48 h-48 object-cover rounded-xl" onError={(e) => {
                          // Fallback to placeholder if not uploaded yet
                          (e.target as HTMLImageElement).src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=test@upi&pn=ResinVerse&cu=INR';
                        }} />
                      </div>

                      <div className="mb-6">
                        <p className="text-2xl font-bold gradient-text mb-1">₹{total.toFixed(0)}</p>
                        <p className="text-xs text-white/40">Order #{orderId.slice(-8).toUpperCase()}</p>
                      </div>

                      {paymentStatus === 'PENDING' ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center gap-2 text-amber-400 font-medium">
                            <Loader2 size={16} className="animate-spin" />
                            Waiting for payment confirmation...
                          </div>
                          <div className="text-3xl font-display font-bold text-white">
                            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                          </div>
                          <p className="text-xs text-white/50">Please do not close or refresh this page.</p>
                        </div>
                      ) : paymentStatus === 'FAILED' ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="text-red-400 font-medium bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20">
                            Payment Failed or Timed Out
                          </div>
                          <button onClick={handleRetryPayment} disabled={loading} className="btn-primary mt-2">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Retry Payment'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Step 4: Confirmation */}
                  {step === 4 && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card rounded-2xl p-8 text-center">
                      <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }} transition={{ duration: 0.8 }} className="text-7xl mb-4">🎉</motion.div>
                      <h2 className="font-display text-3xl font-bold text-white mb-2">Order Confirmed!</h2>
                      <p className="text-white/50 mb-2">Your handcrafted pieces are being prepared</p>
                      <p className="text-purple-400 font-semibold mb-6">Order ID: #{orderId.slice(-8).toUpperCase()}</p>
                      <div className="space-y-2 text-sm text-white/60 mb-8">
                        <p>📧 Confirmation email sent to {user.email}</p>
                        <p>🚚 Estimated delivery: 5-7 business days</p>
                        <p>📱 You'll receive WhatsApp/SMS updates</p>
                      </div>
                      <div className="flex gap-3 justify-center flex-wrap">
                        <Link href="/dashboard?tab=orders"><button className="btn-primary">Track Order</button></Link>
                        <Link href="/products"><button className="btn-secondary">Continue Shopping</button></Link>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              {step < 4 && !showQrCode && (
                <div className="flex gap-3 mt-4">
                  {step > 1 && (
                    <button onClick={() => setStep(s => s - 1)} className="btn-secondary py-3 px-6 flex items-center gap-2">
                      <ArrowLeft size={16} /> Back
                    </button>
                  )}
                  {step < 3 ? (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(s => s + 1)} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                      Continue <ArrowRight size={16} />
                    </motion.button>
                  ) : (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                      {loading ? <Loader2 size={18} className="animate-spin" /> : '🔒'} Proceed to Pay · ₹{total.toFixed(0)}
                    </motion.button>
                  )}
                </div>
              )}
            </div>

            {/* Order summary sidebar */}
            {step < 4 && (
              <div className="glass-card rounded-2xl p-5 h-fit sticky top-28">
                <h3 className="font-semibold text-white mb-4 text-sm">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/60"><span>Subtotal ({cartCount()} items)</span><span>₹{subtotal.toFixed(0)}</span></div>
                  <div className="flex justify-between text-white/60">
                    <span>Shipping</span>
                    <span className={shippingCost === 0 ? 'text-green-400' : ''}>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-400"><span>Coupon ({couponCode})</span><span>-₹{couponDiscount.toFixed(0)}</span></div>
                  )}
                  <div className="border-t border-white/10 pt-3 mt-3 flex justify-between font-bold text-white">
                    <span>Total</span><span className="gradient-text-purple text-lg">₹{total.toFixed(0)}</span>
                  </div>
                </div>
                {subtotal < 999 && (
                  <p className="text-xs text-amber-400 mt-3 text-center">Add ₹{(999 - subtotal).toFixed(0)} more for free shipping!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <CartDrawer />

      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-strong rounded-3xl p-6 w-full max-w-sm relative">
              <h3 className="text-xl font-bold text-white mb-2">Payment Issues?</h3>
              <p className="text-sm text-white/70 mb-4">If your money was deducted but the order failed, or if the timer expired during payment, don't worry!</p>
              <ul className="text-sm text-white/80 space-y-2 mb-6 list-disc list-inside">
                <li>Take a screenshot of the payment receipt.</li>
                <li>Ensure the UTR / Transaction ID is visible.</li>
                <li>Contact support via WhatsApp or Email.</li>
              </ul>
              <div className="flex gap-3">
                <button onClick={() => setShowHelpModal(false)} className="btn-secondary flex-1">Close</button>
                <a href="mailto:support@resinverse.in" className="btn-primary flex-1 text-center py-3">Email Us</a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
