'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Package, Users, ShoppingBag, DollarSign, Settings, Plus, Search, Edit, Trash2, ChevronRight, Star, AlertTriangle, CheckCircle, Clock, Truck } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { adminAPI, productsAPI } from '@/lib/api';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const adminTabs = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'payments', label: 'Pending Payments', icon: DollarSign },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'coupons', label: 'Coupons', icon: Settings },
];

const orderStatusColors: Record<string, string> = {
  PENDING: 'text-amber-400',
  CONFIRMED: 'text-blue-400',
  PROCESSING: 'text-purple-400',
  SHIPPED: 'text-cyan-400',
  DELIVERED: 'text-green-400',
  CANCELLED: 'text-red-400',
};

function StatCard({ title, value, subtitle, trend, icon: Icon, color }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white font-display">{value}</p>
      <p className="text-sm text-white/50 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
}

export default function AdminPage() {
  const { user } = useStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('analytics');
  const [orderSearch, setOrderSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminAPI.analytics().then(r => r.data),
    enabled: !!user && user.role === 'ADMIN',
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users', userSearch],
    queryFn: () => adminAPI.users({ search: userSearch }).then(r => r.data),
    enabled: activeTab === 'customers' && !!user && user.role === 'ADMIN',
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminAPI.allOrders({ limit: 30 }).then(r => r.data),
    enabled: activeTab === 'orders' && !!user && user.role === 'ADMIN',
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products', productSearch],
    queryFn: () => productsAPI.list({ search: productSearch, limit: 30 }).then(r => r.data),
    enabled: activeTab === 'products' && !!user && user.role === 'ADMIN',
  });

  const { data: couponsData } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminAPI.coupons().then(r => r.data),
    enabled: activeTab === 'coupons' && !!user && user.role === 'ADMIN',
  });

  const { data: pendingPaymentsData } = useQuery({
    queryKey: ['admin-pending-payments'],
    queryFn: () => adminAPI.pendingPayments().then(r => r.data.payments),
    enabled: activeTab === 'payments' && !!user && user.role === 'ADMIN',
    refetchInterval: 3000, // Poll for new pending payments every 3 seconds
  });

  const handleVerifyPayment = async (paymentId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      await adminAPI.verifyPayment(paymentId, action);
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payments'] });
      toast.success(action === 'APPROVE' ? 'Payment Approved!' : 'Payment Rejected!');
    } catch {
      toast.error(`Failed to ${action.toLowerCase()} payment`);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={64} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-white/40 mb-6">Admin access required</p>
            <Link href="/"><button className="btn-primary">Go Home</button></Link>
          </div>
        </div>
      </>
    );
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await adminAPI.updateOrderStatus(orderId, { status });
      toast.success(`Order status updated to ${status}`);
    } catch { toast.error('Failed to update status'); }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Deactivate this product? It will be hidden from the store.')) return;
    try {
      await productsAPI.delete(productId);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deactivated');
    } catch { toast.error('Failed to deactivate'); }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="py-8 flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-white/40 mt-1">Manage your ResinVerse store</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/products/new">
                <button className="btn-primary text-sm py-2.5 flex items-center gap-2"><Plus size={15} /> Add Product</button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 glass rounded-2xl p-1.5 w-fit mb-8 overflow-x-auto scrollbar-hide">
            {adminTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium font-accent whitespace-nowrap transition-all ${
                    activeTab === tab.id ? 'bg-purple-500/30 text-purple-300' : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  <Icon size={15} /> {tab.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

              {/* Analytics */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[...Array(4)].map((_, i) => <div key={i} className="glass-card rounded-2xl h-28 shimmer-bg" />)}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title="Total Revenue" value={`₹${((analytics?.revenue?.total || 0) / 1000).toFixed(1)}K`} subtitle={`₹${((analytics?.revenue?.thisMonth || 0)).toFixed(0)} this month`} trend={analytics?.revenue?.growth} icon={DollarSign} color="bg-purple-500/30" />
                        <StatCard title="Total Orders" value={analytics?.orders?.total || 0} subtitle={`${analytics?.orders?.thisMonth || 0} this month`} trend={analytics?.orders?.growth} icon={ShoppingBag} color="bg-pink-500/30" />
                        <StatCard title="Customers" value={analytics?.customers?.total || 0} subtitle={`${analytics?.customers?.thisMonth || 0} new this month`} icon={Users} color="bg-cyan-500/30" />
                        <StatCard title="Products" value={analytics?.products?.total || 0} subtitle={`${analytics?.products?.lowStock || 0} low stock`} icon={Package} color="bg-amber-500/30" />
                      </div>

                      {/* Orders by status */}
                      {analytics?.orders?.byStatus && (
                        <div className="glass-card rounded-2xl p-6">
                          <h3 className="font-semibold text-white mb-4">Orders by Status</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {analytics.orders.byStatus.map((s: any) => (
                              <div key={s.status} className="glass rounded-xl p-3 text-center">
                                <p className={`text-xl font-bold ${orderStatusColors[s.status] || 'text-white'}`}>{s._count}</p>
                                <p className="text-xs text-white/40 mt-1">{s.status}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent orders */}
                      <div className="glass-card rounded-2xl p-6">
                        <h3 className="font-semibold text-white mb-4 flex items-center justify-between">
                          Recent Orders
                          <button onClick={() => setActiveTab('orders')} className="text-purple-400 text-sm hover:text-purple-300">View all</button>
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-white/40 text-left border-b border-white/10">
                                <th className="pb-3 font-medium">Order ID</th>
                                <th className="pb-3 font-medium">Customer</th>
                                <th className="pb-3 font-medium">Total</th>
                                <th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">Payment</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {analytics?.recentOrders?.map((order: any) => (
                                <tr key={order.id} className="hover:bg-white/2 transition-colors">
                                  <td className="py-3 text-purple-400 font-mono text-xs">#{order.id.slice(-8).toUpperCase()}</td>
                                  <td className="py-3">
                                    <p className="text-white/80 text-xs">{order.user?.name}</p>
                                    <p className="text-white/40 text-[10px]">{order.user?.email}</p>
                                  </td>
                                  <td className="py-3 text-white font-semibold">₹{order.total?.toFixed(0)}</td>
                                  <td className="py-3"><span className={`text-xs ${orderStatusColors[order.status] || 'text-white/50'}`}>{order.status}</span></td>
                                  <td className="py-3"><span className={`text-xs ${order.payment?.status === 'PAID' ? 'text-green-400' : 'text-amber-400'}`}>{order.payment?.status || 'N/A'}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Top products */}
                      {analytics?.topProducts?.length > 0 && (
                        <div className="glass-card rounded-2xl p-6">
                          <h3 className="font-semibold text-white mb-4">Top Selling Products</h3>
                          <div className="space-y-3">
                            {analytics.topProducts.map((tp: any, i: number) => (
                              <div key={tp.productId} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full glass flex items-center justify-center text-xs text-white/40 font-bold">{i + 1}</div>
                                {tp.product?.images?.[0] && <img src={tp.product.images[0]} alt="" className="w-10 h-10 rounded-xl object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100'; }} />}
                                <div className="flex-1">
                                  <p className="text-sm text-white/80">{tp.product?.name}</p>
                                  <p className="text-xs text-white/40">{tp._sum?.quantity} units sold</p>
                                </div>
                                <p className="text-sm font-bold gradient-text-purple">₹{tp.product?.price}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Orders */}
              {activeTab === 'orders' && (
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-white">All Orders</h3>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                      <input type="text" placeholder="Search orders..." className="input-glass text-sm py-2 pr-3 pl-9 w-48" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 text-left border-b border-white/10">
                          {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Actions'].map(h => <th key={h} className="pb-3 pr-4 font-medium whitespace-nowrap">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(ordersData?.orders || []).map((order: any) => (
                          <tr key={order.id} className="hover:bg-white/2 transition-colors">
                            <td className="py-3 pr-4 text-purple-400 font-mono text-xs">#{order.id.slice(-8).toUpperCase()}</td>
                            <td className="py-3 pr-4">
                              <p className="text-white/80 text-xs">{order.user?.name}</p>
                              <p className="text-white/40 text-[10px]">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                            </td>
                            <td className="py-3 pr-4 text-white/60 text-xs">{order.items?.length} items</td>
                            <td className="py-3 pr-4 text-white font-semibold">₹{order.total?.toFixed(0)}</td>
                            <td className="py-3 pr-4">
                              <select
                                defaultValue={order.status}
                                onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                                className={`text-xs glass px-2 py-1.5 rounded-lg bg-transparent cursor-pointer focus:outline-none ${orderStatusColors[order.status] || 'text-white/50'}`}
                              >
                                {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => (
                                  <option key={s} value={s} className="bg-[#0d0820] text-white">{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 pr-4"><span className={`text-xs ${order.payment?.status === 'PAID' ? 'text-green-400' : 'text-amber-400'}`}>{order.payment?.status || 'PENDING'}</span></td>
                            <td className="py-3"><button className="text-purple-400 text-xs hover:text-purple-300">View</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="glass rounded-3xl p-6">
                <h2 className="font-display text-2xl font-bold text-white mb-6">Pending UPI Payments</h2>
                {!pendingPaymentsData || pendingPaymentsData.length === 0 ? (
                  <div className="text-center py-12 text-white/40">
                    <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
                    <p>No pending payments!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPaymentsData.map((p: any) => (
                      <div key={p.id} className="glass-card rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 border border-purple-500/20">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="badge-purple text-xs">Order #{p.orderId.slice(-8).toUpperCase()}</span>
                            <span className="text-xs text-white/50">{new Date(p.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="font-semibold text-white">{p.user.name}</p>
                          <p className="text-xs text-white/40">{p.user.email}</p>
                          <p className="text-xl font-bold gradient-text mt-2">₹{p.amount.toFixed(0)}</p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                          <button onClick={() => handleVerifyPayment(p.id, 'REJECT')} className="btn-secondary py-2 flex-1 md:w-32 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20">
                            Reject
                          </button>
                          <button onClick={() => handleVerifyPayment(p.id, 'APPROVE')} className="btn-primary py-2 flex-1 md:w-32 bg-green-500 hover:bg-green-600 border-none shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                            Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

              {/* Products */}
              {activeTab === 'products' && (
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-white">Products ({productsData?.pagination?.total || 0})</h3>
                    <div className="flex gap-3">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                        <input value={productSearch} onChange={e => setProductSearch(e.target.value)} type="text" placeholder="Search products..." className="input-glass text-sm py-2 pr-3 pl-9 w-48" />
                      </div>
                      <Link href="/admin/products/new"><button className="btn-primary text-sm py-2 px-4 flex items-center gap-1"><Plus size={14} /> Add</button></Link>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 text-left border-b border-white/10">
                          {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Status', 'Actions'].map(h => <th key={h} className="pb-3 pr-4 font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(productsData?.products || []).map((p: any) => (
                          <tr key={p.id} className="hover:bg-white/2 transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <img src={p.images?.[0]} alt={p.name} className="w-10 h-10 rounded-lg object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100'; }} />
                                <p className="text-white/80 text-xs max-w-32 truncate">{p.name}</p>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-white/50 text-xs">{p.category?.name}</td>
                            <td className="py-3 pr-4">
                              <p className="text-white text-xs font-semibold">₹{(p.price * (1 - (p.discountPct || 0) / 100)).toFixed(0)}</p>
                              {p.discountPct > 0 && <p className="text-white/30 text-[10px] line-through">₹{p.price}</p>}
                            </td>
                            <td className="py-3 pr-4">
                              <span className={`text-xs ${p.stock <= 5 ? 'text-red-400' : p.stock <= 20 ? 'text-amber-400' : 'text-green-400'}`}>{p.stock}</span>
                            </td>
                            <td className="py-3 pr-4 text-amber-400 text-xs">⭐ {p.rating}</td>
                            <td className="py-3 pr-4"><span className={`text-xs ${p.isActive ? 'text-green-400' : 'text-red-400'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                            <td className="py-3">
                              <div className="flex gap-2">
                                <button onClick={() => router.push(`/admin/products/new?edit=${p.id}`)} className="text-purple-400 hover:text-purple-300 transition-colors" title="Edit product"><Edit size={14} /></button>
                                <button onClick={() => handleDeleteProduct(p.id)} className="text-red-400 hover:text-red-300 transition-colors" title="Deactivate product"><Trash2 size={14} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Customers */}
              {activeTab === 'customers' && (
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-white">Customers ({usersData?.pagination?.total || 0})</h3>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
                      <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search customers..." className="input-glass text-sm py-2 pr-3 pl-9 w-48" />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/40 text-left border-b border-white/10">
                          {['Customer', 'Email', 'Orders', 'Loyalty Pts', 'Joined', 'Role'].map(h => <th key={h} className="pb-3 pr-4 font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(usersData?.users || []).map((u: any) => (
                          <tr key={u.id} className="hover:bg-white/2 transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">{u.name[0]}</div>
                                <p className="text-white/80 text-xs">{u.name}</p>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-white/50 text-xs">{u.email}</td>
                            <td className="py-3 pr-4 text-white/60 text-xs">{u._count?.orders || 0}</td>
                            <td className="py-3 pr-4 text-amber-400 text-xs">✨ {u.loyaltyPoints}</td>
                            <td className="py-3 pr-4 text-white/40 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                            <td className="py-3 pr-4"><span className={`text-xs ${u.role === 'ADMIN' ? 'text-purple-400' : 'text-white/50'}`}>{u.role}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Coupons */}
              {activeTab === 'coupons' && (
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-5">Coupon Codes</h3>
                  <div className="grid gap-3">
                    {(couponsData?.coupons || []).map((coupon: any) => (
                      <div key={coupon.id} className="glass rounded-xl p-4 flex items-center gap-4">
                        <div className="font-mono font-bold text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg">{coupon.code}</div>
                        <div className="flex-1">
                          <p className="text-sm text-white/80">{coupon.description}</p>
                          <p className="text-xs text-white/40 mt-0.5">
                            {coupon.discountPct ? `${coupon.discountPct}% off` : `₹${coupon.discountAmt} off`}
                            {coupon.minOrder > 0 ? ` · Min order ₹${coupon.minOrder}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/50">{coupon.usedCount}/{coupon.maxUses} used</p>
                          <span className={`text-xs ${coupon.isActive ? 'text-green-400' : 'text-red-400'}`}>{coupon.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
