import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Listing, Commodity } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { OfferModal } from '../components/OfferModal';
import { LotModal } from '../components/LotModal';
import { RecommendationModal } from '../components/RecommendationModal';
import {
  Store,
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Tag,
  CheckCircle,
  SlidersHorizontal,
} from 'lucide-react';

export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [commodityId, setCommodityId] = useState<string>('');
  const [qualityGrade, setQualityGrade] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [state, setState] = useState<string>('');

  const [loading, setLoading] = useState(false);

  // Modals
  const [selectedListingForOffer, setSelectedListingForOffer] = useState<Listing | null>(null);
  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    api.getCommodities().then(res => setCommodities(res.data)).catch(() => {});
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.getListings({
        search: search || undefined,
        commodity_id: commodityId ? Number(commodityId) : undefined,
        quality_grade: qualityGrade || undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        state: state || undefined,
      });
      setListings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [commodityId, qualityGrade, minPrice, maxPrice, state]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
            <Store className="w-3.5 h-3.5" />
            <span>Direct Farmer-to-Enterprise Agricultural Marketplace</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Agricultural Produce Exchange</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse verified commercial produce lots directly from farmers & certified FPO collective pools.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRecModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>AI Price Advisory</span>
          </button>

          {(user?.role === 'farmer' || user?.role === 'fpo' || user?.role === 'admin') && (
            <button
              onClick={() => setIsLotModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Produce for Sale</span>
            </button>
          )}
        </div>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-400 font-bold">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by crop, variety, title, or district..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Commodity</label>
            <select
              value={commodityId}
              onChange={(e) => setCommodityId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Commodities</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Quality Grade</label>
            <select
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Quality Grades</option>
              <option value="Grade A">Grade A (Premium)</option>
              <option value="Grade B">Grade B (Standard)</option>
              <option value="FAQ">FAQ (Fair Average Quality)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Min Price (₹/Q)</label>
            <input
              type="number"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Price (₹/Q)</label>
            <input
              type="number"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">State</label>
            <input
              type="text"
              placeholder="e.g. Maharashtra"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Produce Listings Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">Loading verified agricultural listings...</div>
      ) : listings.length === 0 ? (
        <div className="py-20 text-center text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
          <Store className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="font-bold text-base text-slate-300">No Listings Match Current Filters</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l) => (
            <div
              key={l.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition shadow-xl flex flex-col justify-between group"
            >
              <div>
                {/* Header row */}
                <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                    {l.commodity_name || 'Agri Produce'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={l.quality_grade} />
                    <StatusBadge status={l.status} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition leading-snug">
                    {l.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {l.description || 'Verified farm harvested commercial produce ready for procurement.'}
                  </p>

                  <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-slate-800/60">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Quantity</span>
                      <span className="font-bold text-slate-200">{l.quantity_available} {l.unit}</span>
                      <span className="text-[10px] text-slate-500 block">Min: {l.min_order_quantity} {l.unit}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Asking Price</span>
                      <span className="font-extrabold text-base text-emerald-400">₹{l.asking_price_per_unit}</span>
                      <span className="text-[10px] text-slate-500 block">per {l.unit}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{l.district}, {l.state}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Seller: <strong className="text-slate-200">{l.seller_name}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 bg-slate-950/60 border-t border-slate-800/80">
                {l.seller_id === user?.id ? (
                  <div className="w-full py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold text-center">
                    Your Active Produce Lot
                  </div>
                ) : user?.role === 'buyer' ? (
                  <button
                    onClick={() => setSelectedListingForOffer(l)}
                    className="w-full py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/20"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Submit Purchase Offer</span>
                  </button>
                ) : user?.role === 'farmer' || user?.role === 'fpo' ? (
                  <div className="w-full py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs font-medium text-center">
                    Producer Lot (Market View)
                  </div>
                ) : !user ? (
                  <Link
                    to="/login"
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Sign In to Procure</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => setSelectedListingForOffer(l)}
                    className="w-full py-2 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-medium"
                  >
                    Admin Audit Lot
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offer Modal */}
      {selectedListingForOffer && (
        <OfferModal
          isOpen={!!selectedListingForOffer}
          onClose={() => setSelectedListingForOffer(null)}
          listing={selectedListingForOffer}
          onSuccess={() => {
            setSuccessBanner(`Your offer for '${selectedListingForOffer.title}' was submitted successfully.`);
            fetchListings();
          }}
        />
      )}

      {/* Lot Creation Modal */}
      <LotModal
        isOpen={isLotModalOpen}
        onClose={() => setIsLotModalOpen(false)}
        commodities={commodities}
        onSuccess={() => {
          setSuccessBanner('Produce lot and marketplace listing created successfully.');
          fetchListings();
        }}
      />

      {/* Recommendation Engine Modal */}
      <RecommendationModal
        isOpen={isRecModalOpen}
        onClose={() => setIsRecModalOpen(false)}
        commodities={commodities}
      />
    </div>
  );
};
