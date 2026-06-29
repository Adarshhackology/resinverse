import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TermsOfService() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-4 prose prose-invert prose-purple">
          <h1 className="font-display text-4xl font-bold text-white mb-8">Terms of Service</h1>
          <p className="text-white/60 mb-6">Last updated: {new Date().toLocaleDateString('en-IN')}</p>
          
          <div className="space-y-6 text-white/80 leading-relaxed">
            <p>Welcome to ResinVerse! These terms and conditions outline the rules and regulations for the use of our Website.</p>
            
            <h2 className="text-xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use ResinVerse if you do not agree to take all of the terms and conditions stated on this page.</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">2. Handmade Variations</h2>
            <p>Please note that all our products are handcrafted. Due to the nature of resin art, minor variations, micro-bubbles, or slight color differences may occur compared to the product images. These are not defects but rather proof of the handmade nature of the product.</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">3. Payment & Pricing</h2>
            <p>All prices are subject to change without notice. We reserve the right at any time to modify or discontinue the Service without notice at any time. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">4. Custom Orders</h2>
            <p>For custom orders (such as specific name tags, color requests, or embedded photos), once production has started, the order cannot be cancelled or modified. Ensure all spelling and details are correct before confirming your custom order.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
