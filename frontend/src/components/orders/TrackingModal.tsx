import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { trackingAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export function TrackingModal({ orderId, onClose }: { orderId: string, onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackingAPI.get(orderId).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(err => {
      toast.error('Could not fetch tracking data');
      setLoading(false);
    });
  }, [orderId]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[#140a1e] border border-purple-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Truck className="text-purple-400" /> Tracking Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60">
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white/60">Locating your package...</p>
            </div>
          ) : data && data.tracking ? (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                <p className="text-sm text-white/60">Courier: <strong className="text-white">{data.courier || 'Standard Shipping'}</strong></p>
                <p className="text-sm text-white/60">AWB: <strong className="text-white">{data.tracking.awb_code}</strong></p>
                <p className="text-sm text-white/60">Status: <strong className="text-purple-400">{data.tracking.current_status}</strong></p>
              </div>

              <div className="relative pl-6 space-y-6">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-white/10" />
                
                {data.tracking.shipment_track_activities?.map((act: any, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-6 w-3 h-3 rounded-full bg-purple-500 border-2 border-[#140a1e] shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                    <p className="text-sm font-semibold text-white">{act.activity}</p>
                    <p className="text-xs text-white/40">{act.location}</p>
                    <p className="text-xs text-purple-400/60 mt-1">{new Date(act.date).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Package size={48} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Tracking information is not available yet.</p>
              <p className="text-xs text-white/40 mt-2">It usually takes 24 hours for the courier to update their systems.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
