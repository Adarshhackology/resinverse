'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Sparkles, Loader2, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const IMAGES = [
  '/login-slider/1.jpg',
  '/login-slider/2.jpg',
  '/login-slider/3.jpg',
  '/login-slider/4.jpg',
];

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-scroll images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authAPI.login(data);
      setUser(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}! 💜`);
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0612] flex overflow-hidden">
      
      {/* LEFT SIDE - BEAUTIFUL IMAGE SLIDER (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-end p-12">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={IMAGES[currentImageIndex]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full object-cover"
              alt="Resin Art"
            />
          </AnimatePresence>
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0612] via-black/40 to-transparent" />
        </div>

        {/* Text over images */}
        <div className="relative z-10 max-w-lg mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-12 opacity-80 hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-purple-pink flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-white">ResinVerse</span>
          </Link>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h2 className="text-5xl font-display font-bold text-white mb-4 leading-tight">
              Crafted with Love.<br/>
              <span className="text-purple-300 italic">Preserved forever.</span>
            </h2>
            <p className="text-white/80 text-lg leading-relaxed font-light">
              Join ResinVerse to track your orders, save your favorite pieces to your wishlist, and unlock exclusive loyalty rewards.
            </p>
          </motion.div>
        </div>

        {/* Slider Indicators */}
        <div className="relative z-10 flex gap-3">
          {IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentImageIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentImageIndex ? 'w-10 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Background glow effects for right side */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full mix-blend-screen opacity-20 blur-[100px] bg-purple-600" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full mix-blend-screen opacity-20 blur-[100px] bg-pink-600" />
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
          
          <div className="mb-10 lg:hidden text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-purple-pink flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-2xl gradient-text-purple">ResinVerse</span>
            </Link>
          </div>

          <div className="mb-8 lg:text-left text-center">
            <h1 className="font-display text-4xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/50 text-lg">Sign in to your account 💜</p>
          </div>

          <div className="glass-card rounded-3xl p-8 border border-white/5 shadow-2xl backdrop-blur-xl">
            <GoogleAuthButton />
            
            <div className="relative flex items-center py-6">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-white/30 text-xs font-semibold uppercase tracking-widest">or sign in with email</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="text-sm text-white/70 font-medium mb-2 block">Email Address</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                  <input 
                    {...register('email')} 
                    type="email" 
                    placeholder="your@email.com" 
                    className="input-glass pl-12 w-full h-12 text-[15px] bg-white/5 border-white/10 focus:border-purple-500/50 focus:bg-white/10 transition-all rounded-xl" 
                  />
                </div>
                {errors.email && <p className="text-pink-400 text-xs mt-1.5 ml-1">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-white/70 font-medium block">Password</label>
                  <Link href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">Forgot password?</Link>
                </div>
                <div className="relative group">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-purple-400 transition-colors" />
                  <input 
                    {...register('password')} 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password" 
                    className="input-glass pl-12 pr-12 w-full h-12 text-[15px] bg-white/5 border-white/10 focus:border-purple-500/50 focus:bg-white/10 transition-all rounded-xl" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-pink-400 text-xs mt-1.5 ml-1">{errors.password.message}</p>}
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-semibold text-[15px] shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In to ResinVerse'}
              </button>
            </form>

            <p className="text-center text-sm text-white/50 mt-8">
              Don't have an account? <Link href="/register" className="text-white hover:text-purple-400 font-medium transition-colors">Create one now</Link>
            </p>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
