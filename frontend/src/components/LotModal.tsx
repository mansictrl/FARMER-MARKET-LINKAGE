import React, { useState } from 'react';
import { api } from '../services/api';
import { Commodity } from '../types';
import { Sprout, X, PlusCircle } from 'lucide-react';

interface LotModalProps {
  isOpen: boolean;
  onClose: () => void;
  commodities: Commodity[];
  onSuccess: () => void;
}

export const LotModal: React.FC<LotModalProps> = ({
  isOpen,
  onClose,
  commodities,
  onSuccess,
}) => {
  const [commodityId, setCommodityId] = useState<number>(commodities[0]?.id || 1);
  const [quantity, setQuantity] = useState<number>(100);
  const [variety, setVariety] = useState<string>('Standard Hybrid');
  const [storageType, setStorageType] = useState<string>('Farm Store');
  const [district, setDistrict] = useState<string>('Nashik');
  const [state, setState] = useState<string>('Maharashtra');
  const [createListingImmediately, setCreateListingImmediately] = useState<boolean>(true);
  const [askingPrice, setAskingPrice] = useState<number>(2400);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const lotRes = await api.createLot({
        commodity_id: Number(commodityId),
        quantity: Number(quantity),
        variety,
        storage_type: storageType,
        district,
        state,
      });

      if (createListingImmediately) {
        const selectedComm = commodities.find(c => c.id === Number(commodityId));
        await api.createListing({
          lot_id: lotRes.data.id,
          title: `Fresh Harvest ${selectedComm?.name || 'Produce'} (${variety})`,
          commodity_id: Number(commodityId),
          quantity_available: Number(quantity),
          min_order_quantity: Math.max(10, Math.floor(quantity * 0.1)),
          unit: 'Quintal',
          asking_price_per_unit: Number(askingPrice),
          quality_grade: 'Grade A',
          district,
          state,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register lot. Please check inputs.');
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
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Register Harvest Produce Lot</h3>
            <p className="text-xs text-slate-400">Add physical produce lot with origin and storage details</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Commodity</label>
              <select
                value={commodityId}
                onChange={(e) => setCommodityId(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {commodities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Harvest Quantity (Quintals)</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Crop Variety</label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. Sharbati, Pusa 1121"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Storage Type</label>
              <select
                value={storageType}
                onChange={(e) => setStorageType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Farm Store">Farm Store / Shed</option>
                <option value="Cold Storage">Certified Cold Storage</option>
                <option value="Warehouse">State / Central Warehouse</option>
                <option value="Silo">Grain Silo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Farm District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Toggle publish immediately */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="publishListing" className="text-xs font-medium text-slate-200 cursor-pointer">
                Publish Marketplace Listing Immediately
              </label>
              <input
                type="checkbox"
                id="publishListing"
                checked={createListingImmediately}
                onChange={(e) => setCreateListingImmediately(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
              />
            </div>

            {createListingImmediately && (
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Asking Price (₹/Quintal)</label>
                <input
                  type="number"
                  min={1}
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
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
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20"
            >
              {loading ? 'Creating...' : 'Register Produce Lot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
