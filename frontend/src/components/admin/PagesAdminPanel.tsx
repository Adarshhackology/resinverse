'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pagesAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Save } from 'lucide-react';

export function PagesAdminPanel() {
  const [selectedSlug, setSelectedSlug] = useState('faqs');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-pages', selectedSlug],
    queryFn: async () => {
      try {
        const res = await pagesAPI.get(selectedSlug);
        setTitle(res.data.page.title);
        setContent(res.data.page.content);
        return res.data.page;
      } catch (e: any) {
        if (e?.response?.status === 404) {
          setTitle('');
          setContent('');
          return null;
        }
        throw e;
      }
    },
    retry: false,
  });

  const handleSave = async () => {
    if (!title) return toast.error('Title is required');
    setIsSaving(true);
    try {
      await pagesAPI.update(selectedSlug, { title, content, isActive: true });
      toast.success('Page saved successfully!');
      refetch();
    } catch {
      toast.error('Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  const pagesList = [
    { slug: 'faqs', name: 'FAQs' },
    { slug: 'shipping', name: 'Shipping Policy' },
    { slug: 'returns', name: 'Return Policy' },
    { slug: 'about', name: 'About Us' },
    { slug: 'contact', name: 'Contact Us' },
    { slug: 'careers', name: 'Careers' },
    { slug: 'blog', name: 'Blog' },
    { slug: 'press', name: 'Press' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center mb-6">
        <select 
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="input-glass max-w-xs font-semibold"
        >
          {pagesList.map(p => (
            <option key={p.slug} value={p.slug} className="bg-[#0d0820] text-white">
              {p.name}
            </option>
          ))}
        </select>
        <div className="text-white/50 text-sm">
          URL: /{selectedSlug}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-white/50"><Loader2 className="animate-spin" /> Loading content...</div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          <div>
            <label className="block text-sm text-white/60 mb-1">Page Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Frequently Asked Questions"
              className="input-glass w-full text-lg"
            />
          </div>

          <div>
            <label className="block text-sm text-white/60 mb-1">Content (Markdown supported)</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="Write your page content here... (Use # for headings, **bold** for bold, etc.)"
              className="input-glass w-full h-[500px] font-mono text-sm resize-y whitespace-pre-wrap p-4"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
