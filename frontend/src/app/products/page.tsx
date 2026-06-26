'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, ChevronDown, Search, Grid3X3, List } from 'lucide-react';
import { productsAPI } from '@/lib/api';
import { ProductCard } from '@/components/products/ProductCard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AIChatWidget } from '@/components/ai/AIChatWidget';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'bestseller', label: 'Best Sellers' },
];

const categories = [
  { value: '', label: 'All Products' },
  { value: 'keychains', label: 'Keychains' },
  { value: 'lockets', label: 'Lockets' },
  { value: 'rings', label: 'Rings' },
  { value: 'bracelets', label: 'Bracelets' },
  { value: 'earrings', label: 'Earrings' },
  { value: 'bookmarks', label: 'Bookmarks' },
  { value: 'phone-charms', label: 'Phone Charms' },
  { value: 'couple-gifts', label: 'Couple Gifts' },
  { value: 'custom-gifts', label: 'Custom Gifts' },
  { value: 'name-tags', label: 'Name Tags' },
];

const colorOptions = ['Pink', 'Purple', 'Blue', 'Gold', 'White', 'Black', 'Lavender', 'Teal', 'Red', 'Holographic'];

function ProductsPage() {

  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    rating: searchParams.get('rating') || '',
    colors: [] as string[],
  });

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam = 1 }) =>
      productsAPI.list({
        page: pageParam,
        limit: 12,
        search: filters.search || undefined,
        categoryId: filters.category || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        sort: filters.sort,
        rating: filters.rating || undefined,
        colors: filters.colors.join(',') || undefined,
      }).then(r => r.data),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.pages ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
  });

  const allProducts = data?.pages.flatMap(p => p.products) || [];
  const total = data?.pages[0]?.pagination?.total || 0;

  // Infinite scroll observer
  const observerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }, { rootMargin: '100px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const clearFilters = () => {
    setFilters({ search: '', category: '', minPrice: '', maxPrice: '', sort: 'newest', rating: '', colors: [] });
  };

  const activeFilterCount = [filters.category, filters.minPrice, filters.maxPrice, filters.rating, ...filters.colors].filter(Boolean).length;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="py-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-2">
              {filters.category ? (
                <>Shop <span className="gradient-text capitalize">{filters.category.replace('-', ' ')}</span></>
              ) : filters.search ? (
                <>Search: <span className="gradient-text">"{filters.search}"</span></>
              ) : (
                <>All <span className="gradient-text">Products</span></>
              )}
            </h1>
            <p className="text-white/40">{isLoading ? 'Loading...' : `${total} products found`}</p>
          </div>

          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search products..."
              className="input-glass w-full py-3 pr-4 pl-12"
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {/* Filter toggle */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filtersOpen ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'glass text-white/70 hover:text-white'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">{activeFilterCount}</span>}
            </motion.button>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => updateFilter('category', cat.value)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium font-accent transition-all ${
                    filters.category === cat.value
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                      : 'glass text-white/50 hover:text-white/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="glass text-white/70 text-sm pl-3 pr-8 py-2.5 rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500/50 bg-transparent"
              >
                {sortOptions.map(o => <option key={o.value} value={o.value} className="bg-[#0d0820] text-white">{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            </div>

            {/* View mode */}
            <div className="flex gap-1 glass rounded-xl p-1">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-purple-500/30 text-purple-300' : 'text-white/40 hover:text-white/70'}`}>
                <Grid3X3 size={16} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-purple-500/30 text-purple-300' : 'text-white/40 hover:text-white/70'}`}>
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="glass-card rounded-2xl overflow-hidden mb-6"
              >
                <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-5">
                  {/* Price range */}
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Min Price (₹)</label>
                    <input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => updateFilter('minPrice', e.target.value)}
                      placeholder="0"
                      className="input-glass text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Max Price (₹)</label>
                    <input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => updateFilter('maxPrice', e.target.value)}
                      placeholder="5000"
                      className="input-glass text-sm"
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Min Rating</label>
                    <select
                      value={filters.rating}
                      onChange={(e) => updateFilter('rating', e.target.value)}
                      className="glass w-full text-white/70 text-sm px-3 py-3 rounded-xl appearance-none cursor-pointer focus:outline-none bg-transparent"
                    >
                      <option value="" className="bg-[#0d0820]">Any rating</option>
                      {[4, 3, 2, 1].map(r => <option key={r} value={r} className="bg-[#0d0820]">⭐ {r}+ stars</option>)}
                    </select>
                  </div>

                  {/* Colors */}
                  <div>
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 block">Colors</label>
                    <div className="flex flex-wrap gap-1.5">
                      {colorOptions.slice(0, 6).map(color => (
                        <button
                          key={color}
                          onClick={() => {
                            const current = filters.colors;
                            updateFilter('colors', current.includes(color) ? current.filter(c => c !== color) : [...current, color]);
                          }}
                          className={`text-xs px-2 py-1 rounded-full transition-all ${
                            filters.colors.includes(color)
                              ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                              : 'glass text-white/40 hover:text-white/70'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-4 flex gap-3">
                  <button onClick={clearFilters} className="btn-secondary text-sm py-2 px-5 flex items-center gap-2">
                    <X size={14} /> Clear All
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="glass rounded-2xl overflow-hidden">
                  <div className="aspect-square shimmer-bg" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 shimmer-bg rounded-full w-3/4" />
                    <div className="h-3 shimmer-bg rounded-full w-1/2" />
                    <div className="h-5 shimmer-bg rounded-full w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : allProducts.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
              <p className="text-white/40 mb-6">Try adjusting your filters or search term</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'flex flex-col gap-4'
            }>
              {allProducts.map((product: any, i: number) => (
                <ProductCard key={product.id} {...product} index={i} categoryName={product.category?.name} />
              ))}
            </div>
          )}

          {/* Infinite scroll trigger */}
          <div ref={observerRef} className="h-10 mt-8 flex items-center justify-center">
            {isFetchingNextPage && (
              <div className="flex gap-2">
                {[0,1,2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                    className="w-2 h-2 rounded-full bg-purple-500" />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <AIChatWidget />
    </>
  );
}

export default function ProductsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    }>
      <ProductsPage />
    </Suspense>
  );
}
