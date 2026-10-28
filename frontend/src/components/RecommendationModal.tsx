import React, { useState } from 'react';
import { api } from '../services/api';
import { Commodity, Recommendation } from '../types';
import { Sparkles, TrendingUp, X, MapPin, Warehouse, Truck, AlertCircle, ArrowUpRight, CloudRain } from 'lucide-react';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  commodities: Commodity[];
}

export const RecommendationModal: React.FC<RecommendationModalProps> = ({
  isOpen,
  onClose,
  commodities,
}) => {
  const [commodityId, setCommodityId] = useState<number>(commodities[0]?.id || 1);
  const [quantity, setQuantity] = useState<number>(100);
  const [district, setDistrict] = useState<string>('Nashik');
  const [storageAvailable, setStorageAvailable] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.getRecommendation({
        commodity_id: Number(commodityId),
        quantity: Number(quantity),
        farmer_district: district,
        farmer_state: 'Maharashtra',
        storage_available: storageAvailable,
      });
      setRecommendation(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'SELL_NOW':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'HOLD_FOR_BETTER_PRICE':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'DIVERT_TO_ANOTHER_MANDI':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-fade-in relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">AI Price & Mandi Recommendation Engine</h3>
            <p className="text-xs text-slate-400">Algorithmic selling advice factoring real-time APMC spreads & freight</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Select Crop / Commodity</label>
            <select
              value={commodityId}
              onChange={(e) => setCommodityId(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            >
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Farmer District (Origin)</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Nashik, Indore, Guntur"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="storageCheck"
              checked={storageAvailable}
              onChange={(e) => setStorageAvailable(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800 border-slate-700"
            />
            <label htmlFor="storageCheck" className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
              <Warehouse className="w-3.5 h-3.5 text-harvest-400" />
              <span>Certified Storage / Cold Store Available</span>
            </label>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <TrendingUp className="w-4 h-4" />
              {loading ? 'Evaluating Mandi Data...' : 'Generate Selling Strategy'}
            </button>
          </div>
        </form>

        {/* Results Display */}
        {recommendation && (
          <div className="mt-5 space-y-4 animate-fade-in">
            {/* Top Stat Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Recommended Mandi</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {recommendation.suggested_market_name}
                </span>
                <span className="text-[10px] text-slate-400">{recommendation.suggested_market_state}</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mandi Modal Rate</span>
                <span className="text-base font-bold text-slate-100 mt-0.5 block">
                  ₹{recommendation.modal_price}/Q
                </span>
                <span className="text-[10px] text-slate-400">Range: ₹{recommendation.min_expected_price} - ₹{recommendation.max_expected_price}</span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Road Freight Est.</span>
                <span className="text-base font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  -₹{recommendation.transport_cost_estimate}/Q
                </span>
                <span className="text-[10px] text-slate-400">From {district}</span>
              </div>

              <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/40">
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider block font-semibold">Net Realization</span>
                <span className="text-base font-extrabold text-emerald-400 mt-0.5 block">
                  ₹{recommendation.net_realization_estimate}/Q
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">Confidence: {Math.round(recommendation.confidence_score * 100)}%</span>
              </div>
            </div>

            {/* Action Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${getActionBadge(recommendation.suggested_action)}`}>
              <div className="p-2 rounded-lg bg-black/20">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm uppercase tracking-wide">
                    Suggested Action: {recommendation.suggested_action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs opacity-80">• Selling Window: {recommendation.suggested_selling_window}</span>
                </div>
                <p className="text-xs mt-1.5 leading-relaxed opacity-95">
                  {recommendation.explanation}
                </p>
              </div>
            </div>

            {recommendation.reasoning_factors?.weather_condition && (
              <div className="flex items-center gap-2 text-xs text-sky-300 bg-sky-950/30 border border-sky-500/30 rounded-xl px-3.5 py-2">
                <CloudRain className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  <strong>Open-Meteo Weather Signal:</strong> {recommendation.reasoning_factors.weather_condition} ({recommendation.reasoning_factors.rain_risk_forecast_mm}mm rain risk) • Harvest: {recommendation.reasoning_factors.harvest_suitability} • Spoilage Risk: {recommendation.reasoning_factors.storage_humidity_risk}
                </span>
              </div>
            )}

            <div className="text-[11px] text-slate-500 text-right">
              Data Grounding: {recommendation.data_source_info} • Generated at {new Date(recommendation.generated_at).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
