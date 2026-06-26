'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, Sparkles, ArrowRight } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useStore } from '@/lib/store';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const res = await authAPI.register(data);
      setUser(res.data.user, res.data.token);
      toast.success('🎉 Welcome to ResinVerse!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-resin-hero flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-pink flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-2xl gradient-text-purple">ResinVerse</span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mt-4">Create Account</h1>
          <p className="text-white/40 mt-2">Join thousands of aesthetic lovers 💜</p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-sm text-white/60 font-accent mb-1.5 block">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                <input {...register('name')} type="text" placeholder="Priya Sharma" className="input-glass pl-11 w-full" />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm text-white/60 font-accent mb-1.5 block">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                <input {...register('email')} type="email" placeholder="your@email.com" className="input-glass pl-11 w-full" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm text-white/60 font-accent mb-1.5 block">Phone (optional)</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                <input {...register('phone')} type="tel" placeholder="+91 98765 43210" className="input-glass pl-11 w-full" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-white/60 font-accent mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" className="input-glass pl-11 pr-11 w-full" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <p className="text-xs text-white/30">By creating an account, you agree to our Terms & Privacy Policy</p>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : <><Sparkles size={16} /> Create Account</>}
            </motion.button>
          </form>

          <div className="text-center mt-6">
            <p className="text-white/40 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Sign In</Link>
            </p>
          </div>
        </div>

        {/* Coupon callout */}
        <div className="mt-4 glass rounded-2xl p-4 text-center">
          <p className="text-sm text-white/60">🎁 New members get <span className="text-purple-400 font-semibold">20% off</span> with code <span className="badge-purple text-xs">WELCOME20</span></p>
        </div>
      </motion.div>
    </div>
  );
}
