import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

export default function ReturnsPolicy() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-4 prose prose-invert prose-purple">
          <h1 className="font-display text-4xl font-bold text-white mb-8">Return & Refund Policy</h1>
          <p className="text-white/60 mb-6">Last updated: {new Date().toLocaleDateString('en-IN')}</p>
          
          <div className="space-y-6 text-white/80 leading-relaxed">
            <h2 className="text-xl font-bold text-white mt-8 mb-4">Returns</h2>
            <p>Our policy lasts 7 days. If 7 days have gone by since your purchase was delivered, unfortunately, we can’t offer you a refund or exchange.</p>
            <p>To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.</p>

            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl my-6">
              <h3 className="font-bold text-white mb-2">Non-returnable items:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Customized / Personalized products (e.g., items with specific names or photos)</li>
                <li>Earrings (for hygiene reasons)</li>
                <li>Items bought on sale or with a discount code</li>
              </ul>
            </div>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">Refunds (if applicable)</h2>
            <p>Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.</p>
            <p>If you are approved, then your refund will be processed, and a credit will automatically be applied to your original method of payment, within a certain amount of days.</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">Exchanges (if applicable)</h2>
            <p>We only replace items if they are defective or damaged from our end. If you need to exchange it for the same item, send us an email at <a href="mailto:hello@resinverse.in" className="text-purple-400 hover:underline">hello@resinverse.in</a>.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
