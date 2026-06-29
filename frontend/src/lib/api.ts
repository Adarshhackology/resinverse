import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('resinverse_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('resinverse_token');
      localStorage.removeItem('resinverse_user');
      // Don't redirect on auth pages
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API helpers
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  googleLogin: (credential: string) => api.post('/auth/google', { credential }),
  forgotPassword: (data: { email: string }) => api.post('/auth/forgot-password', data),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/me', data),
  changePassword: (data: any) => api.post('/auth/change-password', data),
  googleAuth: (data: any) => api.post('/auth/google', data),
};

export const productsAPI = {
  list: (params?: any) => api.get('/products', { params }),
  get: (id: string) => api.get(`/products/${id}`),
  getById: (id: string) => api.get(`/products/${id}`),
  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const categoriesAPI = {
  list: () => api.get('/categories'),
  get: (slug: string) => api.get(`/categories/${slug}`),
};

export const ordersAPI = {
  list: () => api.get('/orders'),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  cancel: (id: string) => api.put(`/orders/${id}/cancel`),
};

export const paymentsAPI = {
  createRazorpay: (orderId: string) => api.post('/payments/razorpay/create', { orderId }),
  verifyRazorpay: (data: any) => api.post('/payments/razorpay/verify', data),
  manualCreate: (orderId: string) => api.post('/payments/manual/create', { orderId }),
  manualStatus: (orderId: string) => api.get(`/payments/manual/status/${orderId}`),
};

export const wishlistAPI = {
  list: () => api.get('/wishlist'),
  add: (productId: string) => api.post('/wishlist', { productId }),
  remove: (productId: string) => api.delete(`/wishlist/${productId}`),
  check: (productId: string) => api.get(`/wishlist/check/${productId}`),
};

export const reviewsAPI = {
  list: (productId: string, params?: any) => api.get(`/reviews/${productId}`, { params }),
  create: (data: any) => api.post('/reviews', data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  markHelpful: (id: string) => api.post(`/reviews/${id}/helpful`),
};

export const cartAPI = {
  validate: (items: any[]) => api.post('/cart/validate', { items }),
  applyCoupon: (code: string, subtotal: number) => api.post('/cart/apply-coupon', { code, subtotal }),
};

export const addressesAPI = {
  list: () => api.get('/addresses'),
  create: (data: any) => api.post('/addresses', data),
  update: (id: string, data: any) => api.put(`/addresses/${id}`, data),
  delete: (id: string) => api.delete(`/addresses/${id}`),
};

export const customOrdersAPI = {
  create: (data: any) => api.post('/custom-orders', data),
  myOrders: () => api.get('/custom-orders/my'),
};

export const aiAPI = {
  recommend: (data: any) => api.post('/ai/recommend', data),
  generateDesign: (data: any) => api.post('/ai/generate-design', data),
  chat: (message: string, history?: any[]) => api.post('/ai/chat', { message, history }),
};

export const adminAPI = {
  analytics: () => api.get('/admin/analytics'),
  users: (params?: any) => api.get('/admin/users', { params }),
  updateUserRole: (id: string, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  allOrders: (params?: any) => api.get('/orders/admin/all', { params }),
  updateOrderStatus: (id: string, data: any) => api.put(`/orders/admin/${id}/status`, data),
  coupons: () => api.get('/admin/coupons'),
  createCoupon: (data: any) => api.post('/admin/coupons', data),
  pendingPayments: () => api.get('/admin/payments/pending'),
  verifyPayment: (id: string, action: 'APPROVE' | 'REJECT') => api.post(`/admin/payments/${id}/verify`, { action }),
};

export const notificationsAPI = {
  list: () => api.get('/notifications'),
  readAll: () => api.put('/notifications/read-all'),
  read: (id: string) => api.put(`/notifications/${id}/read`),
};

export const uploadAPI = {
  image: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload/image', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  images: (formData: FormData) => {
    return api.post('/upload/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
};

