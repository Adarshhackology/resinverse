'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Upload, Palette, Wand2, ArrowRight, ArrowLeft, Check, Download, ChevronDown, Camera, Type, Flower, Zap } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AIChatWidget } from '@/components/ai/AIChatWidget';
import { useStore } from '@/lib/store';
import { customOrdersAPI, aiAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const PRODUCT_TYPES = ['Keychain', 'Locket', 'Ring', 'Bracelet', 'Earrings', 'Name Tag', 'Bookmark', 'Phone Charm'];
const SHAPES = ['Round', 'Heart', 'Square', 'Star', 'Oval', 'Rectangle', 'Custom'];
const GLITTER_OPTIONS = ['None', 'Gold Glitter', 'Silver Glitter', 'Rainbow Holographic', 'Pink Glitter', 'Purple Glitter'];
const INCLUSIONS = ['None', 'Real Flowers', 'Dried Leaves', 'Seashells', 'Gold Foil', 'Stars', 'Hearts', 'Butterflies'];

const COLOR_PALETTE = [
  '#8B5CF6', '#EC4899', '#C4B5FD', '#F59E0B', '#06B6D4',
  '#ef4444', '#10b981', '#f97316', '#6366f1', '#e879f9',
  '#ffffff', '#000000', '#fcd34d', '#34d399', '#fb7185',
];

const steps = [
  { id: 1, title: 'Product Type', icon: Sparkles },
  { id: 2, title: 'Photo & Name', icon: Camera },
  { id: 3, title: 'Colors', icon: Palette },
  { id: 4, title: 'Extras & Shape', icon: Flower },
  { id: 5, title: 'Preview & Submit', icon: Wand2 },
];

interface BuilderState {
  productType: string;
  photo: string | null;
  name: string;
  colors: string[];
  glitter: string;
  shape: string;
  inclusions: string[];
  notes: string;
}

// Live Canvas Preview
function CanvasPreview({ state }: { state: BuilderState }) {
  const mainColor = state.colors[0] || '#8B5CF6';
  const accentColor = state.colors[1] || '#EC4899';

  const shapeClasses: Record<string, string> = {
    Round: 'rounded-full',
    Heart: 'rounded-full',
    Square: 'rounded-lg',
    Star: 'rounded-lg',
    Oval: 'rounded-full',
    Rectangle: 'rounded-2xl',
    Custom: 'rounded-3xl',
  };

  const shapeClass = shapeClasses[state.shape] || 'rounded-full';

  return (
    <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
      {/* Glow effect */}
      <div
        className="absolute inset-0 blur-2xl opacity-40 rounded-full"
        style={{ background: `radial-gradient(circle, ${mainColor} 0%, ${accentColor} 100%)` }}
      />

      {/* Main piece */}
      <motion.div
        animate={{ y: [-6, 6, -6], rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className={`relative w-48 h-48 ${shapeClass} overflow-hidden border-4`}
        style={{
          background: state.photo ? undefined : `linear-gradient(135deg, ${mainColor}88, ${accentColor}88)`,
          borderColor: `${mainColor}66`,
          boxShadow: `0 0 40px ${mainColor}40, 0 0 80px ${accentColor}20`,
        }}
      >
        {/* Photo background */}
        {state.photo ? (
          <img src={state.photo} alt="Custom" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${mainColor}44, ${accentColor}44)` }} />
        )}

        {/* Glitter overlay */}
        {state.glitter !== 'None' && state.glitter && (
          <div className="absolute inset-0 opacity-40" style={{
            background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='30' r='1' fill='${state.glitter.includes('Gold') ? 'gold' : state.glitter.includes('Silver') ? 'silver' : 'white'}'/%3E%3Ccircle cx='70' cy='20' r='1.5' fill='${state.glitter.includes('Gold') ? 'gold' : 'white'}'/%3E%3Ccircle cx='50' cy='60' r='1' fill='white'/%3E%3Ccircle cx='30' cy='80' r='2' fill='${state.glitter.includes('Gold') ? 'gold' : 'white'}'/%3E%3Ccircle cx='80' cy='70' r='1' fill='white'/%3E%3C/svg%3E") repeat`,
          }} />
        )}

        {/* Inclusions */}
        {state.inclusions.includes('Real Flowers') && (
          <div className="absolute inset-0 flex items-center justify-center opacity-60 text-4xl">🌸</div>
        )}
        {state.inclusions.includes('Gold Foil') && (
          <div className="absolute top-2 right-2 text-yellow-400 text-xl opacity-70">✦</div>
        )}
        {state.inclusions.includes('Stars') && (
          <div className="absolute bottom-3 left-3 text-white text-xl opacity-60">⭐</div>
        )}

        {/* Name overlay */}
        {state.name && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p className="font-display text-white text-center text-sm font-bold truncate">{state.name}</p>
          </div>
        )}
      </motion.div>

      {/* Keychain hook (for keychain) */}
      {state.productType === 'Keychain' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4">
          <div className="w-1 h-6 bg-gray-400 rounded-full mx-auto" />
          <div className="w-8 h-8 border-4 border-gray-400 rounded-full" />
        </div>
      )}
    </div>
  );
}

export default function CustomBuilderPage() {
  const router = useRouter();
  const { user } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const [state, setState] = useState<BuilderState>({
    productType: 'Keychain',
    photo: null,
    name: '',
    colors: ['#8B5CF6', '#EC4899'],
    glitter: 'None',
    shape: 'Round',
    inclusions: [],
    notes: '',
  });

  const update = (key: keyof BuilderState, value: any) =>
    setState(prev => ({ ...prev, [key]: value }));

  const toggleColor = (color: string) => {
    const current = state.colors;
    if (current.includes(color)) {
      update('colors', current.filter(c => c !== color));
    } else if (current.length < 3) {
      update('colors', [...current, color]);
    } else {
      update('colors', [...current.slice(1), color]);
    }
  };

  const toggleInclusion = (inc: string) => {
    const current = state.inclusions;
    if (inc === 'None') { update('inclusions', []); return; }
    update('inclusions', current.includes(inc) ? current.filter(i => i !== inc) : [...current, inc]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => update('photo', e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const getAISuggestions = async () => {
    setAiLoading(true);
    try {
      const res = await aiAPI.generateDesign({
        name: state.name,
        theme: `${state.productType} with ${state.inclusions.join(', ')}`,
        colors: state.colors,
        productType: state.productType,
      });
      setAiSuggestions(res.data.designs || []);
    } catch {
      toast.error('AI suggestions unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Please sign in to submit your custom order'); router.push('/login'); return; }
    setLoading(true);
    try {
      await customOrdersAPI.create({
        productType: state.productType, photos: state.photo ? [state.photo] : [],
        name: state.name, colors: state.colors, glitter: state.glitter !== 'None',
        flowers: state.inclusions.includes('Real Flowers'),
        shape: state.shape, notes: `Glitter: ${state.glitter}, Inclusions: ${state.inclusions.join(', ')}. Additional: ${state.notes}`,
      });
      toast.success('🎉 Custom order submitted! We\'ll contact you within 24 hours with a quote.');
      router.push('/dashboard?tab=orders');
    } catch {
      toast.error('Failed to submit order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center py-10">
            <span className="section-tag mb-4 inline-block"><Sparkles size={12} /> Custom Builder</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3">
              Design Your <span className="gradient-text">Perfect Piece</span>
            </h1>
            <p className="text-white/50 max-w-lg mx-auto">Upload photos, pick colors, add glitter — we'll handcraft your unique resin masterpiece</p>
          </div>

          {/* Step progress */}
          <div className="flex items-center justify-between max-w-2xl mx-auto mb-12">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isDone = step > s.id;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={{ scale: isActive ? 1.15 : 1 }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        isDone ? 'bg-purple-pink' : isActive ? 'bg-purple-500/30 border-2 border-purple-500' : 'glass border border-white/10'
                      }`}
                      onClick={() => isDone && setStep(s.id)}
                    >
                      {isDone ? <Check size={16} className="text-white" /> : <Icon size={16} className={isActive ? 'text-purple-400' : 'text-white/40'} />}
                    </motion.div>
                    <span className={`text-[10px] font-accent font-medium hidden sm:block ${isActive ? 'text-purple-400' : isDone ? 'text-white/60' : 'text-white/25'}`}>{s.title}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${isDone ? 'bg-purple-500/60' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Builder Panel */}
            <div className="glass-card rounded-3xl p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step 1: Product Type */}
                  {step === 1 && (
                    <div>
                      <h2 className="font-display text-2xl font-bold text-white mb-6">What would you like?</h2>
                      <div className="grid grid-cols-2 gap-3">
                        {PRODUCT_TYPES.map(type => (
                          <motion.button
                            key={type}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => update('productType', type)}
                            className={`p-4 rounded-2xl border text-left transition-all ${
                              state.productType === type
                                ? 'border-purple-500 bg-purple-500/15 text-white'
                                : 'border-white/10 glass text-white/60 hover:text-white hover:border-white/20'
                            }`}
                          >
                            <p className="font-semibold font-accent text-sm">{type}</p>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Photo & Name */}
                  {step === 2 && (
                    <div>
                      <h2 className="font-display text-2xl font-bold text-white mb-6">Add Your Photo & Name</h2>
                      
                      <label className="block glass border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 group">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        {state.photo ? (
                          <div className="relative">
                            <img src={state.photo} alt="Uploaded" className="w-32 h-32 object-cover rounded-xl mx-auto mb-3" />
                            <p className="text-sm text-purple-400">Click to change photo</p>
                          </div>
                        ) : (
                          <>
                            <Upload size={32} className="text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                            <p className="text-white/60 text-sm">Click to upload your photo</p>
                            <p className="text-white/30 text-xs mt-1">JPG, PNG, up to 10MB</p>
                          </>
                        )}
                      </label>

                      <div>
                        <label className="text-sm text-white/50 font-accent mb-2 block">Name or Text (optional)</label>
                        <input
                          type="text"
                          value={state.name}
                          onChange={(e) => update('name', e.target.value)}
                          placeholder="e.g. Priya, BFF, 2024..."
                          maxLength={20}
                          className="input-glass"
                        />
                        <p className="text-xs text-white/30 mt-1 text-right">{state.name.length}/20</p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Colors */}
                  {step === 3 && (
                    <div>
                      <h2 className="font-display text-2xl font-bold text-white mb-2">Choose Colors</h2>
                      <p className="text-white/40 text-sm mb-6">Pick up to 3 colors for your piece</p>
                      
                      <div className="flex gap-3 mb-6">
                        {state.colors.map((color, i) => (
                          <div key={i} className="w-12 h-12 rounded-xl border-2 border-white/20" style={{ backgroundColor: color }} />
                        ))}
                        {state.colors.length < 3 && (
                          <div className="w-12 h-12 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center text-white/20 text-xl">+</div>
                        )}
                      </div>

                      <div className="grid grid-cols-5 gap-3">
                        {COLOR_PALETTE.map(color => (
                          <motion.button
                            key={color}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleColor(color)}
                            className={`w-full aspect-square rounded-xl transition-all ${state.colors.includes(color) ? 'scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: color, outline: state.colors.includes(color) ? '3px solid white' : '1px solid rgba(255,255,255,0.1)', outlineOffset: '2px' }}
                          />
                        ))}

                      </div>
                    </div>
                  )}

                  {/* Step 4: Extras */}
                  {step === 4 && (
                    <div>
                      <h2 className="font-display text-2xl font-bold text-white mb-6">Extras & Finishing</h2>

                      <div className="mb-5">
                        <label className="text-sm text-white/50 font-accent mb-3 block">Shape</label>
                        <div className="grid grid-cols-3 gap-2">
                          {SHAPES.map(shape => (
                            <button
                              key={shape}
                              onClick={() => update('shape', shape)}
                              className={`py-2 px-3 rounded-xl text-sm font-medium font-accent transition-all ${
                                state.shape === shape ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'glass text-white/50 hover:text-white/80'
                              }`}
                            >
                              {shape}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-5">
                        <label className="text-sm text-white/50 font-accent mb-3 block">Glitter</label>
                        <div className="grid grid-cols-2 gap-2">
                          {GLITTER_OPTIONS.map(g => (
                            <button
                              key={g}
                              onClick={() => update('glitter', g)}
                              className={`py-2 px-3 rounded-xl text-sm font-medium font-accent transition-all text-left ${
                                state.glitter === g ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'glass text-white/50 hover:text-white/80'
                              }`}
                            >
                              {g === 'None' ? '✗ No Glitter' : `✦ ${g}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-5">
                        <label className="text-sm text-white/50 font-accent mb-3 block">Inclusions</label>
                        <div className="flex flex-wrap gap-2">
                          {INCLUSIONS.map(inc => (
                            <button
                              key={inc}
                              onClick={() => toggleInclusion(inc)}
                              className={`py-1.5 px-3 rounded-full text-xs font-medium font-accent transition-all ${
                                state.inclusions.includes(inc) || (inc === 'None' && state.inclusions.length === 0)
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : 'glass text-white/50 hover:text-white/80'
                              }`}
                            >
                              {inc}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-white/50 font-accent mb-2 block">Any special notes?</label>
                        <textarea
                          value={state.notes}
                          onChange={(e) => update('notes', e.target.value)}
                          rows={3}
                          placeholder="e.g. Special message, specific design requests..."
                          className="input-glass resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 5: Preview & Submit */}
                  {step === 5 && (
                    <div>
                      <h2 className="font-display text-2xl font-bold text-white mb-6">Your Order Summary</h2>
                      <div className="space-y-3 text-sm">
                        {[
                          { label: 'Product Type', value: state.productType },
                          { label: 'Name', value: state.name || 'None' },
                          { label: 'Colors', value: state.colors.join(', ') },
                          { label: 'Shape', value: state.shape },
                          { label: 'Glitter', value: state.glitter },
                          { label: 'Inclusions', value: state.inclusions.join(', ') || 'None' },
                          { label: 'Notes', value: state.notes || 'None' },
                        ].map(item => (
                          <div key={item.label} className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-white/40">{item.label}</span>
                            <span className="text-white/80 text-right max-w-[60%] truncate">{item.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="glass-card rounded-2xl p-4 mt-5">
                        <p className="text-sm text-white/50 mb-1">💡 What happens next?</p>
                        <p className="text-sm text-white/70">We'll review your design and send you a <strong className="text-purple-400">price quote within 24 hours</strong>. Once you approve, we craft your piece in 7-14 days.</p>
                      </div>

                      {/* AI Design Suggestions */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={getAISuggestions}
                        disabled={aiLoading}
                        className="w-full btn-secondary mt-4 flex items-center justify-center gap-2 py-3"
                      >
                        <Wand2 size={16} />
                        {aiLoading ? 'Getting AI suggestions...' : '✨ Get AI Design Ideas'}
                      </motion.button>

                      {aiSuggestions.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <p className="text-xs text-white/40 uppercase tracking-wider font-accent">AI Suggestions</p>
                          {aiSuggestions.map((design, i) => (
                            <div key={i} className="glass rounded-xl p-3">
                              <p className="font-semibold text-sm text-purple-300 mb-1">{design.name}</p>
                              <p className="text-xs text-white/50 mb-2">{design.vibe}</p>
                              <div className="flex gap-1">
                                {design.palette?.map((color: string) => (
                                  <div key={color} className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-2 py-3 px-6">
                    <ArrowLeft size={16} /> Back
                  </button>
                )}
                {step < 5 ? (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep(s => s + 1)}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
                  >
                    Continue <ArrowRight size={16} />
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    {loading ? 'Submitting...' : 'Submit Custom Order'}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Live Preview Panel */}
            <div className="sticky top-28">
              <div className="glass-card rounded-3xl p-8 text-center">
                <h3 className="font-accent text-sm text-white/50 uppercase tracking-wider mb-6">Live Preview</h3>
                <CanvasPreview state={state} />
                <div className="mt-6 space-y-2 text-sm text-white/40">
                  <p>Product: <span className="text-white/70">{state.productType}</span></p>
                  {state.name && <p>Name: <span className="text-white/70 font-display italic">"{state.name}"</span></p>}
                  {state.colors.length > 0 && (
                    <div className="flex items-center justify-center gap-2">
                      <span>Colors:</span>
                      <div className="flex gap-1">
                        {state.colors.map(c => <div key={c} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: c }} />)}
                      </div>
                    </div>
                  )}
                  {state.glitter !== 'None' && <p>Glitter: <span className="text-yellow-400">✦ {state.glitter}</span></p>}
                </div>

                <div className="mt-6 glass rounded-2xl p-4 text-left">
                  <p className="text-xs text-white/40 font-accent uppercase tracking-wider mb-2">Estimated Price</p>
                  <p className="text-2xl font-bold gradient-text">₹{249 + (state.name ? 50 : 0) + (state.photo ? 50 : 0) + (state.glitter !== 'None' ? 75 : 0) + (state.inclusions.length * 25)}</p>
                  <p className="text-xs text-white/30 mt-1">Final quote shared within 24hrs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <AIChatWidget />
    </>
  );
}
