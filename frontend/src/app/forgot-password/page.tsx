'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Sparkles, ArrowLeft } from 'lucide-react';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const forgotSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(data);
      setSent(true);
      toast.success('Reset link sent to your email!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-resin-hero flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center text-white/60 hover:text-white mb-6 text-sm transition-colors">
            <ArrowLeft size={16} className="mr-2" /> Back to Login
          </Link>
          <h1 className="font-display text-3xl font-bold text-white mt-4">Reset Password</h1>
          <p className="text-white/40 mt-2">Enter your email and we'll send you a link.</p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                <Mail className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Check your email</h3>
              <p className="text-white/60 text-sm mb-6">We've sent a password reset link to your email. Click the link to choose a new password.</p>
              <button onClick={() => setSent(false)} className="text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors">
                Try another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm text-white/60 font-accent mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
                  <input {...register('email')} type="email" placeholder="your@email.com" className="input-glass pl-11 w-full" />
                </div>
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {loading ? 'Sending link...' : <><Sparkles size={16} /> Send Reset Link</>}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
