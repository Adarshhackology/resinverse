'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { useState } from 'react';

export function GoogleAuthButton() {
  const router = useRouter();
  const { setUser } = useStore();
  const [loading, setLoading] = useState(false);

  return (
    <div className="w-full flex justify-center mb-4">
      {loading ? (
        <div className="w-full bg-white/10 text-white py-2.5 rounded-xl text-center text-sm font-medium animate-pulse">
          Connecting to Google...
        </div>
      ) : (
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            setLoading(true);
            try {
              if (!credentialResponse.credential) throw new Error('No credential received');
              
              const res = await authAPI.googleLogin(credentialResponse.credential);
              setUser(res.data.user, res.data.token);
              toast.success(`Welcome, ${res.data.user.name}! 💜`);
              router.push('/');
            } catch (err: any) {
              console.error(err);
              toast.error(err.response?.data?.error || 'Google Login failed');
              setLoading(false);
            }
          }}
          onError={() => {
            toast.error('Google Login Failed');
          }}
          useOneTap
          theme="filled_black"
          shape="pill"
          width="100%"
        />
      )}
    </div>
  );
}
