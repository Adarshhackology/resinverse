'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Only show on desktop devices (non-touch)
    if (window.matchMedia('(pointer: fine)').matches) {
      setIsDesktop(true);
    }

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  if (!isDesktop) return null;

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 border border-purple-400/50 rounded-full pointer-events-none z-[9999] mix-blend-screen"
        animate={{
          x: mousePosition.x - 16,
          y: mousePosition.y - 16,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.5 }}
      />
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-pink-400 rounded-full pointer-events-none z-[9999]"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
        }}
        transition={{ type: 'spring', damping: 50, stiffness: 1000, mass: 0.1 }}
      />
      {/* Background glow orb that loosely follows mouse */}
      <motion.div
        className="fixed top-0 left-0 w-[40vw] h-[40vw] rounded-full pointer-events-none -z-10 mix-blend-screen blur-[100px] opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(236,72,153,0) 70%)',
        }}
        animate={{
          x: mousePosition.x - window.innerWidth * 0.2,
          y: mousePosition.y - window.innerWidth * 0.2,
        }}
        transition={{ type: 'tween', ease: 'linear', duration: 0.5 }}
      />
    </>
  );
}
