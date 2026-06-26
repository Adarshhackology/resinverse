'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Upload, X, Plus, Loader2, Check, Image as ImageIcon,
  Package, Tag, Layers, Star, Sparkles, AlertTriangle,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useStore } from '@/lib/store';
import { productsAPI, categoriesAPI, uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ProductForm {
  name: string;
  description: string;
  price: string;
  discountPct: string;
  stock: string;
  categoryId: string;
  material: string;
  tags: string;
  colors: string;
  sizes: string;
  weight: string;
  dimensions: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isActive: boolean;
}

const defaultForm: ProductForm = {
  name: '', description: '', price: '', discountPct: '0', stock: '0',
  categoryId: '', material: '', tags: '', colors: '', sizes: '',
  weight: '', dimensions: '', isFeatured: false, isBestSeller: false, isActive: true,
};

export function AdminProductFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { user, token } = useStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const isEdit = !!editId;

  // Fetch categories
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.list().then(r => r.data.categories),
  });
  const categories = catData || [];

  // Fetch existing product if editing
  const { data: existingProduct } = useQuery({
    queryKey: ['product', editId],
    queryFn: () => productsAPI.getById(editId!).then(r => r.data.product),
    enabled: !!editId,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingProduct) {
      setForm({
        name: existingProduct.name || '',
        description: existingProduct.description || '',
        price: String(existingProduct.price || ''),
        discountPct: String(existingProduct.discountPct || '0'),
        stock: String(existingProduct.stock || '0'),
        categoryId: existingProduct.categoryId || '',
        material: existingProduct.material || '',
        tags: Array.isArray(existingProduct.tags) ? existingProduct.tags.join(', ') : '',
        colors: Array.isArray(existingProduct.colors) ? existingProduct.colors.join(', ') : '',
        sizes: Array.isArray(existingProduct.sizes) ? existingProduct.sizes.join(', ') : '',
        weight: String(existingProduct.weight || ''),
        dimensions: existingProduct.dimensions || '',
        isFeatured: existingProduct.isFeatured || false,
        isBestSeller: existingProduct.isBestSeller || false,
        isActive: existingProduct.isActive ?? true,
      });
      setImages(Array.isArray(existingProduct.images) ? existingProduct.images : []);
    }
  }, [existingProduct]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => productsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('✅ Product created successfully!');
      router.push('/admin');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create product'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', editId] });
      toast.success('✅ Product updated successfully!');
      router.push('/admin');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update product'),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (!user || user.role !== 'ADMIN') {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={64} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Admin access required</h2>
            <Link href="/login"><button className="btn-primary">Sign In as Admin</button></Link>
          </div>
        </div>
      </>
    );
  }

  // Image upload handler
  const handleImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('files', f));
      const res = await uploadAPI.images(formData);
      const newUrls: string[] = res.data.urls;
      setImages(prev => [...prev, ...newUrls]);
      toast.success(`${newUrls.length} image${newUrls.length > 1 ? 's' : ''} uploaded!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleImageUpload(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setMainImage = (index: number) => {
    setImages(prev => {
      const arr = [...prev];
      [arr[0], arr[index]] = [arr[index], arr[0]];
      return arr;
    });
    toast.success('Main image updated!');
  };

  const set = (key: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
  };

  const toggle = (key: keyof ProductForm) => () => {
    setForm(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    if (!form.price || isNaN(Number(form.price))) { toast.error('Valid price is required'); return; }
    if (!form.categoryId) { toast.error('Category is required'); return; }
    if (images.length === 0) { toast.error('At least one image is required'); return; }

    const payload = {
      ...form,
      images,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      colors: form.colors.split(',').map(c => c.trim()).filter(Boolean),
      sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (isEdit) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-4 py-8">
            <Link href="/admin">
              <button className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm">
                <ArrowLeft size={15} /> Back
              </button>
            </Link>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-white">
                {isEdit ? '✏️ Edit Product' : '✨ Add New Product'}
              </h1>
              <p className="text-white/40 text-sm mt-0.5">{isEdit ? `Editing: ${existingProduct?.name || '...'}` : 'Fill in the details to create a new product'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main fields */}
              <div className="lg:col-span-2 space-y-5">

                {/* Basic Info */}
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-semibold text-white mb-5 flex items-center gap-2"><Package size={16} className="text-purple-400" /> Basic Info</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-white/60 font-accent mb-1.5 block">Product Name *</label>
                      <input value={form.name} onChange={set('name')} className="input-glass w-full" placeholder="e.g. Preserved Rose Keychain" required />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 font-accent mb-1.5 block">Description *</label>
                      <textarea value={form.description} onChange={set('description')} rows={4} className="input-glass w-full resize-none" placeholder="Describe the product in detail..." required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-white/60 font-accent mb-1.5 block">Category *</label>
                        <select value={form.categoryId} onChange={set('categoryId')} className="input-glass w-full" required>
                          <option value="" className="bg-[#0d0820]">Select category</option>
                          {categories.map((c: any) => (
                            <option key={c.id} value={c.id} className="bg-[#0d0820]">{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-white/60 font-accent mb-1.5 block">Material</label>
                        <input value={form.material} onChange={set('material')} className="input-glass w-full" placeholder="e.g. Epoxy Resin, Gold Foil" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-semibold text-white mb-5 flex items-center gap-2">💰 Pricing & Stock</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Price (₹) *', key: 'price', placeholder: '299', type: 'number' },
                      { label: 'Discount (%)', key: 'discountPct', placeholder: '10', type: 'number' },
                      { label: 'Stock', key: 'stock', placeholder: '50', type: 'number' },
                      { label: 'Weight (g)', key: 'weight', placeholder: '25', type: 'number' },
                      { label: 'Dimensions', key: 'dimensions', placeholder: '5x5x1 cm', type: 'text' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-sm text-white/60 font-accent mb-1.5 block">{f.label}</label>
                        <input
                          value={(form as any)[f.key]}
                          onChange={set(f.key as keyof ProductForm)}
                          type={f.type}
                          min={f.type === 'number' ? 0 : undefined}
                          className="input-glass w-full"
                          placeholder={f.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                  {form.price && (
                    <div className="mt-4 glass rounded-xl p-3 flex items-center gap-3 text-sm">
                      <span className="text-white/50">Effective price:</span>
                      <span className="text-purple-400 font-bold text-lg">
                        ₹{(Number(form.price) * (1 - Number(form.discountPct || 0) / 100)).toFixed(0)}
                      </span>
                      {Number(form.discountPct) > 0 && <span className="text-white/30 line-through">₹{Number(form.price).toFixed(0)}</span>}
                      {Number(form.discountPct) > 0 && <span className="badge-pink text-xs">{form.discountPct}% OFF</span>}
                    </div>
                  )}
                </div>

                {/* Tags, Colors, Sizes */}
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="font-semibold text-white mb-5 flex items-center gap-2"><Tag size={16} className="text-purple-400" /> Tags & Variants</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Tags (comma-separated)', key: 'tags', placeholder: 'rose, floral, romantic, gift' },
                      { label: 'Colors available (comma-separated)', key: 'colors', placeholder: 'Pink, Red, White, Purple' },
                      { label: 'Sizes (comma-separated)', key: 'sizes', placeholder: 'S, M, L, XL or leave blank' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-sm text-white/60 font-accent mb-1.5 block">{f.label}</label>
                        <input value={(form as any)[f.key]} onChange={set(f.key as keyof ProductForm)} className="input-glass w-full" placeholder={f.placeholder} />
                        {/* Preview chips */}
                        {(form as any)[f.key] && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(form as any)[f.key].split(',').filter((t: string) => t.trim()).map((t: string, i: number) => (
                              <span key={i} className="badge-purple text-xs">{t.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column: Images + Flags */}
              <div className="space-y-5">
                {/* Image Upload */}
                <div className="glass-card rounded-2xl p-5">
                  <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} className="text-purple-400" /> Product Images</h2>

                  {/* Drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-purple-400 bg-purple-500/10' : 'border-white/20 hover:border-purple-500/50 hover:bg-white/2'}`}
                  >
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleImageUpload(e.target.files)} />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={28} className="text-purple-400 animate-spin" />
                        <p className="text-sm text-white/50">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={28} className="text-white/30" />
                        <p className="text-sm text-white/60">Drop images here or <span className="text-purple-400">click to browse</span></p>
                        <p className="text-xs text-white/30">PNG, JPG, WebP up to 10MB each</p>
                      </div>
                    )}
                  </div>

                  {/* Image previews */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <AnimatePresence>
                        {images.map((url, i) => (
                          <motion.div
                            key={url + i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative group rounded-xl overflow-hidden aspect-square"
                          >
                            <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200'; }} />
                            {i === 0 && <div className="absolute top-1 left-1 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">Main</div>}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                              {i !== 0 && (
                                <button type="button" onClick={() => setMainImage(i)} className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-bold hover:bg-purple-400 transition-colors" title="Set as main">★</button>
                              )}
                              <button type="button" onClick={() => removeImage(i)} className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-400 transition-colors"><X size={12} /></button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {images.length === 0 && <p className="text-xs text-amber-400 mt-2 text-center">⚠ At least 1 image is required</p>}
                </div>

                {/* Flags */}
                <div className="glass-card rounded-2xl p-5">
                  <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Star size={16} className="text-purple-400" /> Product Flags</h2>
                  <div className="space-y-3">
                    {[
                      { key: 'isFeatured', label: 'Featured on Homepage', icon: '⭐' },
                      { key: 'isBestSeller', label: 'Best Seller Badge', icon: '🔥' },
                      { key: 'isActive', label: 'Active (Visible in Store)', icon: '✅' },
                    ].map(({ key, label, icon }) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer glass rounded-xl px-4 py-3 hover:bg-white/5 transition-colors">
                        <div
                          onClick={toggle(key as keyof ProductForm)}
                          className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${(form as any)[key] ? 'bg-purple-500' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${(form as any)[key] ? 'translate-x-5' : ''}`} />
                        </div>
                        <span className="text-sm text-white/80">{icon} {label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div className="space-y-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={isSaving}
                    className="w-full btn-primary py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {isSaving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
                  </motion.button>
                  <Link href="/admin">
                    <button type="button" className="w-full btn-secondary py-3 text-sm">Cancel</button>
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

export default function AdminProductFormPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex gap-2">{[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
      </div>
    }>
      <AdminProductFormPage />
    </Suspense>
  );
}
