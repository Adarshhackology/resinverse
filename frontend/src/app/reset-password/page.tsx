'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetForm = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, newPassword: data.password });
      setSuccess(true);
      toast.success('Password reset successful!');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Password Updated!</h3>
        <p className="text-white/60 text-sm mb-6">Your password has been successfully changed.</p>
        <p className="text-purple-400 text-sm animate-pulse">Redirecting to login...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center py-6">
        <h3 className="text-xl font-semibold text-white mb-2">Invalid Link</h3>
        <p className="text-white/60 text-sm mb-6">This password reset link is invalid or has expired.</p>
        <Link href="/forgot-password" className="text-purple-400 hover:text-purple-300 font-semibold">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm text-white/60 font-accent mb-1.5 block">New Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
          <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" className="input-glass pl-11 pr-11 w-full" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="text-sm text-white/60 font-accent mb-1.5 block">Confirm Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
          <input {...register('confirmPassword')} type={showPassword ? 'text' : 'password'} placeholder="Type it again" className="input-glass pl-11 pr-11 w-full" />
        </div>
        {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={loading}
        className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
      >
        {loading ? 'Updating...' : <><Sparkles size={16} /> Update Password</>}
      </motion.button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-resin-hero flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white mt-4">Create New Password</h1>
          <p className="text-white/40 mt-2">Almost there! Type your new password below.</p>
        </div>

        <div className="glass-card rounded-3xl p-8">
          <Suspense fallback={<div className="text-center text-white/40">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
