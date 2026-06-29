import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  discountPct: number;
  image: string;
  quantity: number;
  slug: string;
  stock: number;
  customization?: Record<string, any>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  loyaltyPoints?: number;
}

interface StoreState {
  // Auth
  user: User | null;
  token: string | null;
  setUser: (user: User | null, token?: string) => void;
  logout: () => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartCount: () => number;
  appliedCoupon: { code: string; discount: number } | null;
  setAppliedCoupon: (coupon: { code: string; discount: number } | null) => void;

  // UI
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  isChatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Recently viewed
  recentlyViewed: string[];
  addRecentlyViewed: (id: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Auth state
      user: null,
      token: null,
      setUser: (user, token) => {
        set({ user, token: token || get().token });
        if (token) localStorage.setItem('resinverse_token', token);
        if (user) localStorage.setItem('resinverse_user', JSON.stringify(user));
      },
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('resinverse_token');
        localStorage.removeItem('resinverse_user');
      },

      // Cart state
      cart: [],
      addToCart: (newItem) => {
        const cart = get().cart;
        const existing = cart.find(i => i.productId === newItem.productId);
        if (existing) {
          set({
            cart: cart.map(i =>
              i.productId === newItem.productId
                ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.stock) }
                : i
            ),
          });
        } else {
          set({ cart: [...cart, newItem] });
        }
      },
      removeFromCart: (productId) => {
        set({ cart: get().cart.filter(i => i.productId !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeFromCart(productId);
          return;
        }
        set({
          cart: get().cart.map(i =>
            i.productId === productId ? { ...i, quantity: Math.min(quantity, i.stock) } : i
          ),
        });
      },
      clearCart: () => set({ cart: [], appliedCoupon: null }),
      cartTotal: () => get().cart.reduce((total, item) => total + (item.price * (1 - item.discountPct / 100)) * item.quantity, 0),
      cartCount: () => get().cart.reduce((count, item) => count + item.quantity, 0),
      appliedCoupon: null,
      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),

      // UI state
      isCartOpen: false,
      setCartOpen: (open) => set({ isCartOpen: open }),
      isChatOpen: false,
      setChatOpen: (open) => set({ isChatOpen: open }),
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      // Recently viewed
      recentlyViewed: [],
      addRecentlyViewed: (id) => {
        const current = get().recentlyViewed.filter(i => i !== id);
        set({ recentlyViewed: [id, ...current].slice(0, 10) });
      },
    }),
    {
      name: 'resinverse-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        cart: state.cart,
        recentlyViewed: state.recentlyViewed,
      }),
    }
  )
);
