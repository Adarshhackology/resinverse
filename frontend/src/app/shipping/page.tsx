import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function ShippingPolicy() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 pb-24">
        <div className="max-w-3xl mx-auto px-4 prose prose-invert prose-purple">
          <h1 className="font-display text-4xl font-bold text-white mb-8">Shipping Policy</h1>
          <p className="text-white/60 mb-6">Last updated: {new Date().toLocaleDateString('en-IN')}</p>
          
          <div className="space-y-6 text-white/80 leading-relaxed">
            <h2 className="text-xl font-bold text-white mt-8 mb-4">Processing Time</h2>
            <p>Because every ResinVerse item is handcrafted to order and resin requires 24-48 hours to fully cure, our standard processing time is <strong>3 to 5 business days</strong> before your order ships.</p>
            <p>For custom orders (like photo lockets or name tags), processing time may take up to <strong>7 business days</strong>.</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">Shipping Rates & Delivery Estimates</h2>
            <p>We currently ship Pan-India. Shipping charges for your order will be calculated and displayed at checkout.</p>
            <ul className="list-disc pl-5 space-y-2 mt-4">
              <li><strong>Standard Shipping:</strong> 4-7 business days (₹50, Free on orders over ₹999)</li>
              <li><strong>Express Shipping:</strong> 2-3 business days (₹120)</li>
            </ul>
            <p>Delivery delays can occasionally occur due to high volume, bad weather, or public holidays.</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">Shipment Confirmation & Order Tracking</h2>
            <p>You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.</p>

            <h2 className="text-xl font-bold text-white mt-8 mb-4">Damages</h2>
            <p>ResinVerse is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim. Please save all packaging materials and damaged goods before filing a claim.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
