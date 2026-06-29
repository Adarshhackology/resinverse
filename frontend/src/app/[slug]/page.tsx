'use client';

import { useQuery } from '@tanstack/react-query';
import { pagesAPI } from '@/lib/api';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { notFound } from 'next/navigation';

export default function DynamicPage({ params }: { params: { slug: string } }) {
  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['page', params.slug],
    queryFn: async () => {
      try {
        const res = await pagesAPI.get(params.slug);
        return res.data.page;
      } catch (e: any) {
        if (e.response?.status === 404) return null;
        throw e;
      }
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-32 pb-20 flex justify-center">
          <Loader2 className="animate-spin text-purple-400" size={32} />
        </main>
        <Footer />
      </>
    );
  }

  if (isError || !page) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto glass-card rounded-3xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-8 gradient-text w-fit">
            {page.title}
          </h1>
          
          <div className="prose prose-invert prose-purple max-w-none prose-headings:font-display prose-a:text-purple-400 hover:prose-a:text-pink-400 prose-img:rounded-xl">
            <ReactMarkdown>{page.content}</ReactMarkdown>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
