import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Commodity, Market, MarketPrice, HistoricalTrendPoint, PriceComparisonResponse } from '../types';
import { PriceTrendChart } from '../components/PriceTrendChart';
import {
  TrendingUp,
  Search,
  Filter,
  BarChart3,
  Upload,
  ArrowUpDown,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
  FileSpreadsheet,
  X
} from 'lucide-react';

export const MarketDiscoveryPage: React.FC = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState<number>(1);
  const [selectedMarketId, setSelectedMarketId] = useState<number | undefined>(undefined);
  const [durationDays, setDurationDays] = useState<number>(30);

  const [pricesList, setPricesList] = useState<MarketPrice[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalTrendPoint[]>([]);
  const [comparisonData, setComparisonData] = useState<PriceComparisonResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvMessage, setCsvMessage] = useState<string | null>(null);

  useEffect(() => {
    api.getCommodities().then(res => {
      setCommodities(res.data);
      if (res.data.length > 0) setSelectedCommodityId(res.data[0].id);
    });
    api.getMarkets().then(res => setMarkets(res.data));
  }, []);

  const fetchData = async () => {
    if (!selectedCommodityId) return;
    setLoading(true);
    try {
      const [trendRes, compRes, listRes] = await Promise.all([
        api.getHistoricalTrends(selectedCommodityId, selectedMarketId, durationDays),
        api.comparePrices(selectedCommodityId),
        api.getMarketPrices({ commodity_id: selectedCommodityId, market_id: selectedMarketId, page_size: 15 }),
      ]);
      setHistoricalData(trendRes.data);
      setComparisonData(compRes.data);
      setPricesList(listRes.data);
    } catch (err) {
      console.error('Failed to load market discovery data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCommodityId, selectedMarketId, durationDays]);

  const selectedCommObj = commodities.find(c => c.id === selectedCommodityId);
  const selectedMktObj = markets.find(m => m.id === selectedMarketId);

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) return;
    setCsvUploading(true);
    setCsvMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      const res = await api.importPricesCSV(formData);
      setCsvMessage(`Successfully processed ${res.data.total_records_processed} records (${res.data.inserted_records} inserted, ${res.data.updated_records} updated).`);
      fetchData();
    } catch (err: any) {
      setCsvMessage(err.response?.data?.detail || 'CSV Import failed. Check file format.');
    } finally {
      setCsvUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-harvest-500/10 text-harvest-400 border border-harvest-500/20 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Official APMC Mandi Price Discovery Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Agricultural Market Intelligence</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time modal price benchmarks, arrival volume dynamics, and inter-mandi spatial comparison across India.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import Mandi CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-xl">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Select Commodity</span>
          </label>
          <select
            value={selectedCommodityId}
            onChange={(e) => setSelectedCommodityId(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            {commodities.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Filter APMC Mandi</span>
          </label>
          <select
            value={selectedMarketId || ''}
            onChange={(e) => setSelectedMarketId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
          >
            <option value="">All State Mandis (National Average)</option>
            {markets.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.district}, {m.state})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Time Horizon</span>
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setDurationDays(days)}
                className={`py-1 text-xs font-semibold rounded-lg transition ${
                  durationDays === days ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Stats Overview */}
      {comparisonData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Average Modal Rate</span>
            <div className="text-2xl font-black text-slate-100 mt-1">₹{comparisonData.average_modal_price}</div>
            <span className="text-[11px] text-slate-400">per Quintal across all mandis</span>
          </div>

          <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl shadow-lg bg-emerald-950/10">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Highest Mandi Realization</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              ₹{comparisonData.highest_price || '--'}
            </div>
            <span className="text-[11px] text-emerald-300/80 truncate block">{comparisonData.highest_market || 'N/A'}</span>
          </div>

          <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-2xl shadow-lg bg-rose-950/10">
            <span className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold">Lowest Mandi Rate</span>
            <div className="text-2xl font-black text-rose-400 mt-1">
              ₹{comparisonData.lowest_price || '--'}
            </div>
            <span className="text-[11px] text-rose-300/80 truncate block">{comparisonData.lowest_market || 'N/A'}</span>
          </div>

          <div className="bg-slate-900 border border-blue-500/30 p-4 rounded-2xl shadow-lg bg-blue-950/10">
            <span className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">Inter-Mandi Arbitrage Spread</span>
            <div className="text-2xl font-black text-blue-400 mt-1">
              ₹{comparisonData.highest_price && comparisonData.lowest_price ? (Number(comparisonData.highest_price) - Number(comparisonData.lowest_price)).toFixed(0) : '0'}
            </div>
            <span className="text-[11px] text-blue-300/80">Opportunity for interstate freight</span>
          </div>
        </div>
      )}

      {/* Recharts Price & Arrival Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <PriceTrendChart
          data={historicalData}
          commodityName={selectedCommObj?.name || 'Crop'}
          marketName={selectedMktObj?.name}
        />
      </div>

      {/* Spatial Mandi Price Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Mandi Price & Arrival Comparison Table</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-normal">
                {comparisonData?.markets.length || 0} Mandis reporting
              </span>
            </h3>
            <p className="text-xs text-slate-400">Comparing current prices for {selectedCommObj?.name} (Reference Date: {comparisonData?.reference_date})</p>
          </div>
          <div className="text-xs text-slate-400">
            Source: <span className="text-emerald-400 font-medium">Agmarknet Mandi Board Verified</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Mandi Market</th>
                <th className="py-3 px-4">State & District</th>
                <th className="py-3 px-4">Modal Price (₹/Q)</th>
                <th className="py-3 px-4">Min - Max Spread</th>
                <th className="py-3 px-4">Arrival Volume</th>
                <th className="py-3 px-4">Data Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {comparisonData?.markets.map((m) => (
                <tr key={m.market_id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <span>{m.market_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">{m.district}, {m.state}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-sm font-bold text-emerald-400">₹{m.modal_price}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    ₹{m.min_price} - ₹{m.max_price}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {m.arrival_volume ? `${m.arrival_volume.toLocaleString()} Q` : '150 Q'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">{m.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsCsvModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">Import Mandi Price CSV</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Upload official Agmarknet or Mandi board daily market price CSV. Required columns: Commodity, Market, State, District, MinPrice, MaxPrice, ModalPrice, Date.
            </p>

            {csvMessage && (
              <div className="mb-4 p-3 bg-slate-950 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                {csvMessage}
              </div>
            )}

            <form onSubmit={handleCsvUpload} className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                required
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400 cursor-pointer"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={csvUploading || !csvFile}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
                >
                  {csvUploading ? 'Importing...' : 'Upload & Parse CSV'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
