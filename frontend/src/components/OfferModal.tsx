import React, { useState } from 'react';
import { api } from '../services/api';
import { Listing } from '../types';
import { ShoppingBag, X, Check, Calculator, Calendar } from 'lucide-react';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
  onSuccess: () => void;
}

export const OfferModal: React.FC<OfferModalProps> = ({
  isOpen,
  onClose,
  listing,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState<number>(listing.min_order_quantity);
  const [pricePerUnit, setPricePerUnit] = useState<number>(listing.asking_price_per_unit);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = (quantity * pricePerUnit).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createOffer({
        listing_id: listing.id,
        offered_quantity: Number(quantity),
        offered_price_per_unit: Number(pricePerUnit),
        proposed_delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : undefined,
        notes,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit offer. Ensure you are signed in as a Buyer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Submit Purchase Offer</h3>
            <p className="text-xs text-slate-400">To Seller: {listing.seller_name} • {listing.title}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Asking Price:</span>
              <span className="font-bold text-emerald-400 ml-1.5">₹{listing.asking_price_per_unit}/Q</span>
            </div>
            <div>
              <span className="text-slate-400">Available:</span>
              <span className="font-bold text-slate-200 ml-1.5">{listing.quantity_available} Q</span>
            </div>
            <div>
              <span className="text-slate-400">Min Order:</span>
              <span className="font-bold text-slate-200 ml-1.5">{listing.min_order_quantity} Q</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Quantity ({listing.unit})</label>
              <input
                type="number"
                min={listing.min_order_quantity}
                max={listing.quantity_available}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Proposed Price (₹/{listing.unit})</label>
              <input
                type="number"
                step="0.5"
                min={1}
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(Number(e.target.value))}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Delivery Date</label>
            <div className="relative">
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Special Packaging / Logistics Instructions</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Standard 50kg bags required, delivery to ITC Warehouse Turbhe"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-300 text-xs">
              <Calculator className="w-4 h-4" />
              <span>Calculated Total Amount:</span>
            </div>
            <span className="text-lg font-bold text-white">₹{Number(totalAmount).toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Submitting Offer...' : 'Send Formal Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
