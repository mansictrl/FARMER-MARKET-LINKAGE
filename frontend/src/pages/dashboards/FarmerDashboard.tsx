import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Listing, Offer, Transaction, Recommendation, Commodity, WeatherData } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LotModal } from '../../components/LotModal';
import { RecommendationModal } from '../../components/RecommendationModal';
import {
  Sprout,
  Store,
  ShoppingBag,
  TrendingUp,
  Sparkles,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [latestRec, setLatestRec] = useState<Recommendation | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [isLotModalOpen, setIsLotModalOpen] = useState(false);
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const fetchWeather = async (district?: string, state?: string) => {
    setWeatherLoading(true);
    try {
      const targetDistrict = district || user?.farmer_profile?.district || 'Nashik';
      const targetState = state || user?.farmer_profile?.state || 'Maharashtra';
      const res = await api.getWeather(targetDistrict, targetState);
      setWeather(res.data);
    } catch (err) {
      console.error('Failed to load weather:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      const [listRes, offRes, txnRes, commRes] = await Promise.all([
        api.getMyListings(),
        api.getReceivedOffers(),
        api.getTransactions(),
        api.getCommodities(),
      ]);
      setMyListings(listRes.data);
      setReceivedOffers(offRes.data);
      setTransactions(txnRes.data);
      setCommodities(commRes.data);

      fetchWeather();

      if (commRes.data.length > 0) {
        api.getRecommendation({
          commodity_id: commRes.data[0].id,
          quantity: 100,
          farmer_district: user?.farmer_profile?.district || 'Nashik',
          storage_available: true
        }).then(res => setLatestRec(res.data)).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOfferResponse = async (offerId: number, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await api.respondToOffer(offerId, { status, seller_notes: `Offer ${status.toLowerCase()} by farmer.` });
      setBanner(`Offer successfully marked as ${status}.`);
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update offer response.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Farmer Command Center</span>
            {user?.is_verified && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>Kisan KYC Verified</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white">Welcome, {user?.full_name}</h1>
          <p className="text-xs text-slate-400">
            Farm Location: {user?.farmer_profile?.farm_location || 'Village Niphad'}, {user?.farmer_profile?.district || 'Nashik'} ({user?.farmer_profile?.land_area_acres || 12} Acres)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRecModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Price Recommendation</span>
          </button>
          <button
            onClick={() => setIsLotModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Produce Listing</span>
          </button>
        </div>
      </div>

      {banner && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Listings</span>
            <Store className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1">{myListings.length}</div>
          <span className="text-[10px] text-slate-500">Live on marketplace</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pending Offers</span>
            <ShoppingBag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {receivedOffers.filter(o => o.status === 'PENDING').length}
          </div>
          <span className="text-[10px] text-slate-500">Awaiting your response</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Deals</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">
            {transactions.filter(t => t.fulfillment_status !== 'COMPLETED').length}
          </div>
          <span className="text-[10px] text-slate-500">Under escrow / fulfillment</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Completed Escrow</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            ₹{transactions.filter(t => t.payment_status === 'RELEASED').reduce((acc, t) => acc + Number(t.total_amount), 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Realized funds</span>
        </div>
      </div>

      {/* Live Agro-Weather & Advisory Card (Powered by Open-Meteo) */}
      {weather && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                {weather.rainfall_forecast_mm > 0.5 ? (
                  <CloudRain className="w-6 h-6 text-sky-400 animate-bounce" />
                ) : weather.weather_code <= 2 ? (
                  <Sun className="w-6 h-6 text-amber-400" />
                ) : (
                  <Cloud className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-white text-base">Agro-Meteorological Advisory</h3>
                  <span className="inline-flex items-center gap-1.5 text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Open-Meteo API
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {weather.district}, {weather.state} ({weather.latitude.toFixed(2)}°N, {weather.longitude.toFixed(2)}°E)
                  </span>
                  <button
                    onClick={() => fetchWeather()}
                    disabled={weatherLoading}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition ml-1"
                    title="Refresh Weather Forecast"
                  >
                    <RefreshCw className={`w-3 h-3 ${weatherLoading ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Agro-Advisory Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <div className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                weather.harvest_suitability.includes('UNFAVORABLE')
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : weather.harvest_suitability.includes('MODERATE')
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                <Sprout className="w-3.5 h-3.5" />
                <span>Harvest: {weather.harvest_suitability}</span>
              </div>

              <div className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border ${
                weather.storage_humidity_risk === 'HIGH'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : weather.storage_humidity_risk === 'MODERATE'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                <Droplets className="w-3.5 h-3.5" />
                <span>Storage Spoilage Risk: {weather.storage_humidity_risk}</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Temperature</span>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-black text-white mt-1">
                {weather.temperature_celsius}°C
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {weather.condition} (↓{weather.temp_min_celsius}° ↑{weather.temp_max_celsius}°)
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Relative Humidity</span>
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-xl font-black text-white mt-1">
                {weather.humidity_percentage}%
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {weather.humidity_percentage > 70 ? 'High moisture risk' : 'Optimal drying rate'}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Rainfall Outlook</span>
                <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xl font-black text-white mt-1">
                {weather.rainfall_forecast_mm} mm
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {weather.rainfall_forecast_mm > 0 ? 'Precipitation ahead' : 'Dry conditions expected'}
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Wind Speed</span>
                <Wind className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-xl font-black text-white mt-1">
                {weather.wind_speed_kmh} km/h
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {weather.wind_speed_kmh > 25 ? 'High breeze (check spray)' : 'Calm breeze'}
              </div>
            </div>
          </div>

          {/* 5-Day Daily Mini Strip */}
          {weather.forecast && weather.forecast.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                5-Day Mandi Harvest & Drying Window
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {weather.forecast.map((day, idx) => (
                  <div key={day.date || idx} className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-2.5 text-center">
                    <div className="text-[11px] font-bold text-slate-300">
                      {idx === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate font-medium">
                      {day.condition}
                    </div>
                    <div className="text-xs font-extrabold text-white mt-1">
                      {Math.round(day.max_temp)}° <span className="text-slate-500 font-normal">/ {Math.round(day.min_temp)}°</span>
                    </div>
                    {day.precipitation_mm > 0 ? (
                      <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded font-bold">
                        {day.precipitation_mm}mm rain
                      </span>
                    ) : (
                      <span className="inline-block mt-1 text-[9px] text-emerald-400/80 font-medium">
                        Dry
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Recommendation Alert Card */}
      {latestRec && (
        <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Recommended Selling Strategy</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold">
                  {latestRec.suggested_action.replace(/_/g, ' ')}
                </span>
              </div>
              <h3 className="font-bold text-white text-base mt-1">
                Divert {latestRec.commodity_name} to {latestRec.suggested_market_name} (₹{latestRec.modal_price}/Q)
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {latestRec.explanation}
              </p>
              {latestRec.reasoning_factors?.weather_condition && (
                <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-300/90 font-medium">
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    Open-Meteo Input: {latestRec.reasoning_factors.weather_condition} ({latestRec.reasoning_factors.rain_risk_forecast_mm}mm rain forecasted) • Harvest Suitability: {latestRec.reasoning_factors.harvest_suitability}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsRecModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 transition"
          >
            Configure Strategy
          </button>
        </div>
      )}

      {/* Received Offers Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white">Incoming Buyer Purchase Offers</h3>
            <p className="text-xs text-slate-400">Review binding offers from agribusiness buyers</p>
          </div>
          <span className="text-xs text-slate-400 font-medium">{receivedOffers.length} total offers</span>
        </div>

        {receivedOffers.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">No offers received yet. Publish more listings to attract buyers.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Buyer Company</th>
                  <th className="py-3 px-4">Produce Listing</th>
                  <th className="py-3 px-4">Offered Qty</th>
                  <th className="py-3 px-4">Offered Rate</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {receivedOffers.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-200">{o.buyer_company_name || 'Agri Buyer'}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">{o.listing_title}</td>
                    <td className="py-3.5 px-4 text-slate-300">{o.offered_quantity} Q</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">₹{o.offered_price_per_unit}/Q</td>
                    <td className="py-3.5 px-4 font-bold text-white">₹{Number(o.total_amount).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {o.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOfferResponse(o.id, 'ACCEPTED')}
                            className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 font-bold rounded-lg border border-emerald-500/30 transition text-[11px]"
                          >
                            Accept & Lock Escrow
                          </button>
                          <button
                            onClick={() => handleOfferResponse(o.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition text-[11px]"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Active Listings */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white">My Active Marketplace Listings</h3>
            <p className="text-xs text-slate-400">Lots currently open for buyer purchase</p>
          </div>
          <button
            onClick={() => setIsLotModalOpen(true)}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            + Create New Lot
          </button>
        </div>

        {myListings.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">No active listings yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myListings.map((l) => (
              <div key={l.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{l.commodity_name}</span>
                  <StatusBadge status={l.status} />
                </div>
                <h4 className="font-bold text-sm text-slate-200">{l.title}</h4>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Available: <strong className="text-white">{l.quantity_available} Q</strong></span>
                  <span className="text-emerald-400 font-extrabold text-sm">₹{l.asking_price_per_unit}/Q</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <LotModal
        isOpen={isLotModalOpen}
        onClose={() => setIsLotModalOpen(false)}
        commodities={commodities}
        onSuccess={() => {
          setBanner('New produce lot created and listed on marketplace.');
          refreshData();
        }}
      />

      <RecommendationModal
        isOpen={isRecModalOpen}
        onClose={() => setIsRecModalOpen(false)}
        commodities={commodities}
      />
    </div>
  );
};
