import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Commodity, MarketPrice } from '../types';
import { RecommendationModal } from '../components/RecommendationModal';
import {
  Sprout,
  TrendingUp,
  ShieldCheck,
  Store,
  Warehouse,
  Truck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Users,
  Building2,
  DollarSign
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [topPrices, setTopPrices] = useState<MarketPrice[]>([]);
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);

  useEffect(() => {
    api.getCommodities().then(res => setCommodities(res.data)).catch(() => {});
    api.getMarketPrices({ page_size: 6 }).then(res => setTopPrices(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Direct Farm-to-Buyer Disintermediation & e-NAM Mandi Integration</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Empowering Farmers With <span className="text-emerald-400">Fair Mandi Prices</span> & Direct Market Linkages
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Connect directly with verified agribusiness buyers, compare APMC mandi rates in real-time, get algorithmic selling recommendations, and execute deals with bank-grade escrow security.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                to="/marketplace"
                className="px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/25 flex items-center gap-2"
              >
                <Store className="w-4 h-4" />
                <span>Explore Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsRecModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition border border-slate-700/80 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>AI Price Recommendation</span>
              </button>
            </div>

            {/* Feature Pills */}
            <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>0% Commission</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Escrow Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>APMC Verified Rates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>FPO Produce Pooling</span>
              </div>
            </div>
          </div>

          {/* Right Live Card Widget */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">Today's Mandi Price Benchmark</h3>
                    <p className="text-[11px] text-slate-400">Verified official APMC rates</p>
                  </div>
                </div>
                <Link to="/price-discovery" className="text-xs text-emerald-400 hover:underline font-medium">
                  View All Mandis
                </Link>
              </div>

              {/* Price items */}
              <div className="space-y-3">
                {topPrices.slice(0, 4).map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between hover:border-emerald-500/30 transition">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-200">{p.commodity_name}</h4>
                      <p className="text-[11px] text-slate-400">{p.market_name}, {p.state}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-extrabold text-emerald-400">₹{p.modal_price}/Q</div>
                      <div className="text-[10px] text-slate-500">Min: ₹{p.min_price} • Max: ₹{p.max_price}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Core Platform Pillars</h2>
          <h3 className="text-3xl font-extrabold text-white">Engineered For Agricultural Disintermediation</h3>
          <p className="text-sm text-slate-400 mt-2">Eliminating opaque price discovery and delayed payments in traditional agricultural trading.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/30 transition group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Mandi Price Discovery</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track 30-day historical modal prices, minimum/maximum spreads, and arrival pressures across top Indian mandis with CSV upload support.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/30 transition group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Explainable AI Recommendations</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent selling strategy engine factoring mandi distance, freight logistics cost per quintal, arrival trends, and storage options.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/30 transition group">
            <div className="w-12 h-12 rounded-xl bg-harvest-500/10 border border-harvest-500/20 text-harvest-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Escrow Protected Payments</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrated Razorpay test sandbox. Funds locked safely in platform escrow upon deal acceptance and released when shipment is verified.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl hover:border-emerald-500/30 transition group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Building2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">FPO Collective Aggregation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enables Farmer Producer Organisations to pool produce from smallholders into bulk commercial lots with individual farmer traceability.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 lg:p-12">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Simple 4-Step Process</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">How The Platform Connects The Value Chain</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center mx-auto mb-3">1</div>
              <h4 className="font-bold text-sm text-slate-200 mb-1">Lot Registration & KYC</h4>
              <p className="text-xs text-slate-400">Farmers enter commodity, harvest quantity, quality grade, and upload KCC/Aadhaar verification.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center mx-auto mb-3">2</div>
              <h4 className="font-bold text-sm text-slate-200 mb-1">Price Discovery & Offer</h4>
              <p className="text-xs text-slate-400">Check APMC modal rates, consult AI recommendation, and buyers submit formal binding offers.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center mx-auto mb-3">3</div>
              <h4 className="font-bold text-sm text-slate-200 mb-1">Escrow Payment Locked</h4>
              <p className="text-xs text-slate-400">Upon offer acceptance, buyer deposits funds into secure platform escrow via Razorpay.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-sm flex items-center justify-center mx-auto mb-3">4</div>
              <h4 className="font-bold text-sm text-slate-200 mb-1">Fulfillment & Release</h4>
              <p className="text-xs text-slate-400">Produce is dispatched with logistics tracking. Once delivery is confirmed, escrow releases to farmer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Recommendation Modal */}
      <RecommendationModal
        isOpen={isRecModalOpen}
        onClose={() => setIsRecModalOpen(false)}
        commodities={commodities}
      />
    </div>
  );
};
