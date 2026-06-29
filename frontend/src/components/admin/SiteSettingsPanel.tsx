'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

export function SiteSettingsPanel() {
  const queryClient = useQueryClient();
  const [footerText, setFooterText] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerLocation, setFooterLocation] = useState('');
  const [instagramPhotos, setInstagramPhotos] = useState<string[]>([]);
  
  const { isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: () => settingsAPI.get().then(r => r.data.settings),
    onSuccess: (data) => {
      if (data) {
        setFooterText(data.footerText || '');
        setFooterEmail(data.footerEmail || '');
        setFooterLocation(data.footerLocation || '');
        try {
          setInstagramPhotos(JSON.parse(data.instagramPhotos) || []);
        } catch (e) {
          setInstagramPhotos([]);
        }
      }
    }
  });

  const mutation = useMutation({
    mutationFn: (data: any) => settingsAPI.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast.success('Site settings updated');
    },
    onError: () => {
      toast.error('Failed to update site settings');
    }
  });

  const handleSave = () => {
    mutation.mutate({
      footerText,
      footerEmail,
      footerLocation,
      instagramPhotos: JSON.stringify(instagramPhotos),
    });
  };

  const addPhoto = () => setInstagramPhotos([...instagramPhotos, '']);
  const updatePhoto = (index: number, val: string) => {
    const newPhotos = [...instagramPhotos];
    newPhotos[index] = val;
    setInstagramPhotos(newPhotos);
  };
  const removePhoto = (index: number) => {
    const newPhotos = [...instagramPhotos];
    newPhotos.splice(index, 1);
    setInstagramPhotos(newPhotos);
  };

  if (isLoading) return <div className="p-8 text-center text-white/50"><Loader2 className="animate-spin inline mr-2" /> Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-5">Footer Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/60 mb-1.5 block">Footer Description</label>
            <textarea
              value={footerText}
              onChange={e => setFooterText(e.target.value)}
              className="input-glass w-full"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/60 mb-1.5 block">Contact Email</label>
              <input type="text" value={footerEmail} onChange={e => setFooterEmail(e.target.value)} className="input-glass w-full" />
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1.5 block">Location</label>
              <input type="text" value={footerLocation} onChange={e => setFooterLocation(e.target.value)} className="input-glass w-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white flex items-center gap-2"><ImageIcon size={18} /> Instagram Feed Images</h3>
          <button onClick={addPhoto} className="btn-secondary py-1 px-3 text-xs flex items-center gap-1"><Plus size={12} /> Add Photo</button>
        </div>
        
        <div className="space-y-3">
          {instagramPhotos.map((url, i) => (
            <div key={i} className="flex gap-2 items-center bg-white/5 p-2 rounded-xl">
              <input
                type="text"
                value={url}
                onChange={e => updatePhoto(i, e.target.value)}
                placeholder="Image URL"
                className="input-glass w-full text-sm"
              />
              {url && <img src={url} className="w-10 h-10 object-cover rounded bg-white/10" />}
              <button onClick={() => removePhoto(i)} className="p-2 text-red-400 hover:text-red-300 bg-red-400/10 rounded-lg"><Trash2 size={16} /></button>
            </div>
          ))}
          {instagramPhotos.length === 0 && <p className="text-sm text-white/40">No photos added yet.</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={mutation.isLoading}
          className="btn-primary py-2.5 px-6 flex items-center gap-2"
        >
          {mutation.isLoading && <Loader2 size={14} className="animate-spin" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
