'use client';
import { Suspense } from 'react';
import AdminProductFormPage from '../new/page';

// /admin/products/edit?edit=<id>  uses same form component with edit mode
export default function AdminProductEditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="loader" /></div>}>
      <AdminProductFormPage />
    </Suspense>
  );
}
