'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Package, Heart, Star, Settings, LogOut, ChevronRight, Sparkles, Gift, MapPin, Bell, Truck } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { TrackingModal } from '@/components/orders/TrackingModal';
import { useStore } from '@/lib/store';
import { ordersAPI, wishlistAPI, reviewsAPI, addressesAPI, notificationsAPI, authAPI } from '@/lib/api';
import { ProductCard } from '@/components/products/ProductCard';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

const tabs = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'reviews', label: 'My Reviews', icon: Star },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const orderStatusColors: Record<string, string> = {
  PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  CONFIRMED: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  PROCESSING: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  SHIPPED: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
  DELIVERED: 'text-green-400 bg-green-400/10 border-green-400/30',
  CANCELLED: 'text-red-400 bg-red-400/10 border-red-400/30',
  REFUNDED: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
};

function DashboardContent() {
  const { user, logout } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabQuery = searchParams?.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabQuery || 'overview');
  const [name, setName] = useState(user?.name || '');
  const [editingProfile, setEditingProfile] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (tabQuery && tabs.some(t => t.id === tabQuery)) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  const { data: ordersData } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersAPI.list().then(r => r.data.orders),
    enabled: !!user,
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistAPI.list().then(r => r.data.items),
    enabled: !!user,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.list().then(r => r.data),
    enabled: !!user,
  });

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-white mb-4">Sign in to view your dashboard</h2>
            <Link href="/login"><button className="btn-primary">Sign In</button></Link>
          </div>
        </div>
      </>
    );
  }

  const handleLogout = async () => {
    await authAPI.logout();
    logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  const handleUpdateProfile = async () => {
    try {
      await authAPI.updateProfile({ name });
      toast.success('Profile updated!');
      setEditingProfile(false);
    } catch { toast.error('Update failed'); }
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.readAll();
    toast.success('All notifications marked as read');
  };

  const orders = ordersData || [];
  const wishlistItems = wishlistData || [];
  const notifications = notifData?.notifications || [];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="py-8 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-purple-pink flex items-center justify-center text-white text-2xl font-bold font-display">
              {user.avatar ? <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" /> : user.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white">Hey, {user.name.split(' ')[0]}! 👋</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-white/40 text-sm">{user.email}</p>
                {(user as any).loyaltyPoints > 0 && (
                  <span className="badge-gold text-xs">✨ {(user as any).loyaltyPoints} points</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="glass-card rounded-2xl p-2 h-fit sticky top-28">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium font-accent transition-all ${
                      activeTab === tab.id ? 'bg-purple-500/20 text-purple-300' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} /> {tab.label}
                    {tab.id === 'notifications' && notifData?.unreadCount > 0 && (
                      <span className="ml-auto w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center">{notifData.unreadCount}</span>
                    )}
                    <ChevronRight size={14} className="ml-auto opacity-40" />
                  </button>
                );
              })}
              <div className="border-t border-white/10 mt-2 pt-2">
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/5 transition-all">
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-3">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

                {/* Overview */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Orders', value: orders.length, icon: '📦' },
                        { label: 'Wishlist', value: wishlistItems.length, icon: '❤️' },
                        { label: 'Loyalty Points', value: (user as any).loyaltyPoints || 0, icon: '✨' },
                        { label: 'Reviews', value: 0, icon: '⭐' },
                      ].map(stat => (
                        <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
                          <div className="text-3xl mb-2">{stat.icon}</div>
                          <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                          <div className="text-xs text-white/40 font-accent">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Recent orders */}
                    <div className="glass-card rounded-2xl p-5">
                      <h3 className="font-semibold text-white mb-4 flex items-center justify-between">
                        Recent Orders
                        <button onClick={() => setActiveTab('orders')} className="text-purple-400 text-sm hover:text-purple-300">View all</button>
                      </h3>
                      {orders.length === 0 ? (
                        <div className="text-center py-8">
                          <Package size={36} className="text-white/20 mx-auto mb-3" />
                          <p className="text-white/40 text-sm">No orders yet</p>
                          <Link href="/products"><button className="btn-primary text-sm mt-4 py-2">Start Shopping</button></Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.slice(0, 3).map((order: any) => (
                            <div key={order.id} className="flex items-center gap-3 glass rounded-xl p-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white">#{order.id.slice(-8).toUpperCase()}</p>
                                <p className="text-xs text-white/40">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                              </div>
                              <span className={`text-xs px-2.5 py-1 rounded-full border ${orderStatusColors[order.status] || 'text-white/50'}`}>{order.status}</span>
                              <span className="text-sm font-bold gradient-text-purple">₹{order.total?.toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Orders */}
                {activeTab === 'orders' && (
                  <div className="glass-card rounded-2xl p-5">
                    <h3 className="font-semibold text-white mb-5">My Orders</h3>
                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <Package size={48} className="text-white/20 mx-auto mb-3" />
                        <p className="text-white/40">No orders yet. Time to shop! 🛍️</p>
                        <Link href="/products"><button className="btn-primary mt-4">Shop Now</button></Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order: any) => (
                          <div key={order.id} className="glass rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-semibold text-white">#{order.id.slice(-8).toUpperCase()}</p>
                                <p className="text-xs text-white/40">{new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-xs px-3 py-1 rounded-full border ${orderStatusColors[order.status] || 'text-white/50'}`}>{order.status}</span>
                                <p className="text-sm font-bold text-white mt-1">₹{order.total?.toFixed(0)}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                              {order.items?.map((item: any) => (
                                <div key={item.id} className="flex-shrink-0 flex items-center gap-2 glass rounded-xl px-3 py-2">
                                  <img src={item.product?.images?.[0]} alt={item.product?.name} className="w-8 h-8 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100'; }} />
                                  <div>
                                    <p className="text-xs text-white/80 font-medium max-w-24 truncate">{item.product?.name}</p>
                                    <p className="text-[10px] text-white/40">×{item.quantity}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {order.trackingNum && (
                              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                <p className="text-xs text-white/40">AWB: {order.trackingNum} ({order.courierName || 'Shipping'})</p>
                                <button onClick={() => setTrackingOrderId(order.id)} className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg">
                                  <Truck size={14} /> Track Order
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Wishlist */}
                {activeTab === 'wishlist' && (
                  <div>
                    <h3 className="font-semibold text-white mb-5">Wishlist ({wishlistItems.length} items)</h3>
                    {wishlistItems.length === 0 ? (
                      <div className="glass-card rounded-2xl p-12 text-center">
                        <Heart size={48} className="text-white/20 mx-auto mb-3" />
                        <p className="text-white/40">Your wishlist is empty</p>
                        <Link href="/products"><button className="btn-primary mt-4">Discover Products</button></Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {wishlistItems.map((item: any, i: number) => (
                          <ProductCard key={item.id} {...item.product} index={i} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                  <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-semibold text-white">Notifications</h3>
                      {notifData?.unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-purple-400 hover:text-purple-300">Mark all read</button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-center py-12">
                        <Bell size={48} className="text-white/20 mx-auto mb-3" />
                        <p className="text-white/40">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map((notif: any) => (
                          <div key={notif.id} className={`glass rounded-xl p-4 ${!notif.read ? 'border border-purple-500/30' : ''}`}>
                            <div className="flex items-start gap-3">
                              <div className="text-xl">{notif.type === 'ORDER_UPDATE' ? '📦' : notif.type === 'OFFER' ? '🎁' : '🔔'}</div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-white">{notif.title}</p>
                                <p className="text-xs text-white/50 mt-0.5">{notif.body}</p>
                                <p className="text-[10px] text-white/30 mt-1">{new Date(notif.createdAt).toLocaleDateString('en-IN')}</p>
                              </div>
                              {!notif.read && <div className="w-2 h-2 rounded-full bg-purple-500 mt-1 flex-shrink-0" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Settings */}
                {activeTab === 'settings' && (
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="font-semibold text-white mb-6">Account Settings</h3>
                    <div className="space-y-5">
                      <div>
                        <label className="text-sm text-white/50 font-accent mb-2 block">Display Name</label>
                        {editingProfile ? (
                          <div className="flex gap-2">
                            <input value={name} onChange={e => setName(e.target.value)} className="input-glass flex-1" />
                            <button onClick={handleUpdateProfile} className="btn-primary text-sm py-2 px-4">Save</button>
                            <button onClick={() => setEditingProfile(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-white/80">{user.name}</span>
                            <button onClick={() => setEditingProfile(true)} className="text-purple-400 text-xs hover:text-purple-300">Edit</button>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="text-sm text-white/50 font-accent mb-2 block">Email</label>
                        <p className="text-white/60">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-white/50 font-accent mb-2 block">Loyalty Points</label>
                        <div className="flex items-center gap-3">
                          <span className="gradient-text font-bold text-lg">{(user as any).loyaltyPoints || 0} pts</span>
                          <span className="badge-gold text-xs">≈ ₹{Math.floor(((user as any).loyaltyPoints || 0) / 10)} cashback</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      {trackingOrderId && <TrackingModal orderId={trackingOrderId} onClose={() => setTrackingOrderId(null)} />}
      <Footer />
      <CartDrawer />
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-24 text-center text-white">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
