import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fposApi, commoditiesApi } from '../../services/api';
import { FPO, Commodity } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import { Users, Package, ShoppingBag, Plus, RefreshCw, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';

const FPODashboard: React.FC = () => {
  const { user } = useAuth();
  const [fpo, setFpo] = useState<FPO | null>(null);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showAggregateModal, setShowAggregateModal] = useState(false);

  // Add Member Form State
  const [memberFarmerId, setMemberFarmerId] = useState('');
  const [memberNotes, setMemberNotes] = useState('');
  
  // Aggregate Form State
  const [aggCommodityId, setAggCommodityId] = useState('');
  const [aggGrade, setAggGrade] = useState('Grade A');
  const [aggQuantity, setAggQuantity] = useState('');
  const [aggPrice, setAggPrice] = useState('');
  const [aggPublish, setAggPublish] = useState(true);
  const [memberContributions, setMemberContributions] = useState<Array<{ farmer_id: string; quantity: string }>>([
    { farmer_id: '', quantity: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchFPOData = async () => {
    setLoading(true);
    try {
      const [fpoRes, commRes] = await Promise.all([
        fposApi.getMyFPO(),
        commoditiesApi.getAll(),
      ]);
      setFpo(fpoRes.data);
      setCommodities(commRes.data);
      if (commRes.data.length > 0) {
        setAggCommodityId(String(commRes.data[0].id));
      }
    } catch (err: any) {
      console.error('Failed to load FPO details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFPOData();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpo) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await fposApi.addMember(fpo.id, {
        farmer_id: memberFarmerId,
        notes: memberNotes,
      });
      setFeedback({ type: 'success', message: 'Farmer successfully added to FPO cluster!' });
      setShowMemberModal(false);
      setMemberFarmerId('');
      setMemberNotes('');
      fetchFPOData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to add member' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddContributionRow = () => {
    setMemberContributions([...memberContributions, { farmer_id: '', quantity: '' }]);
  };

  const handleUpdateContribution = (index: number, field: 'farmer_id' | 'quantity', val: string) => {
    const next = [...memberContributions];
    next[index][field] = val;
    setMemberContributions(next);
  };

  const handleRemoveContributionRow = (index: number) => {
    setMemberContributions(memberContributions.filter((_, i) => i !== index));
  };

  const handleAggregateProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpo) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const parsedContributions = memberContributions
        .filter(c => c.farmer_id && Number(c.quantity) > 0)
        .map(c => ({
          farmer_id: c.farmer_id,
          quantity: Number(c.quantity),
          harvest_date: new Date().toISOString().split('T')[0],
        }));

      await fposApi.aggregateProduce(fpo.id, {
        commodity_id: aggCommodityId,
        quality_grade: aggGrade,
        total_quantity: Number(aggQuantity),
        asking_price: Number(aggPrice),
        contributions: parsedContributions,
        publish_listing: aggPublish,
      });

      setFeedback({ type: 'success', message: 'Produce aggregated & pooled lot created with full smallholder farmer traceability!' });
      setShowAggregateModal(false);
      fetchFPOData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to aggregate produce' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-500/30">
              <Users className="w-3.5 h-3.5" /> FPO Institutional Hub
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{fpo ? fpo.name : 'Farmer Producer Organisation'}</h1>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
              {fpo?.district}, {fpo?.state} • CIN / Registration: <span className="font-mono text-emerald-300">{fpo?.registration_number}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowMemberModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all text-sm backdrop-blur-sm shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Member Farmer
            </button>
            <button
              onClick={() => setShowAggregateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold transition-all text-sm shadow-lg shadow-amber-500/20"
            >
              <Package className="w-4 h-4" /> Aggregate & Pool Produce
            </button>
          </div>
        </div>

        {feedback && (
          <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 text-sm ${feedback.type === 'success' ? 'bg-emerald-900/80 border border-emerald-400 text-emerald-100' : 'bg-rose-900/80 border border-rose-400 text-rose-100'}`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Member Farmers</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{fpo?.members?.length || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Verified local smallholders</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collective Lots</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{fpo?.collective_lots?.length || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Aggregated for institutional buyers</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Bulk Volume</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">
            {fpo?.collective_lots?.reduce((sum: number, lot: any) => sum + (lot.quantity || 0), 0).toLocaleString('en-IN') || 0}{' '}
            <span className="text-sm font-semibold text-slate-600">Quintals</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Direct institutional supply</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Market Negotiation</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-purple-600 mt-3">+14.2%</p>
          <p className="text-xs text-slate-500 mt-1">Average premium over spot mandi</p>
        </div>
      </div>

      {/* Main Sections: Collective Lots & Member Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Collective Lots Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Collective Lots & Traceability</h2>
              <p className="text-xs text-slate-500">Aggregated produce batches with smallholder farmer breakdown</p>
            </div>
            <button
              onClick={() => setShowAggregateModal(true)}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
            >
              + New Batch
            </button>
          </div>

          <div className="overflow-x-auto">
            {fpo?.collective_lots && fpo.collective_lots.length > 0 ? (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-6">Lot Code</th>
                    <th className="py-3 px-6">Commodity</th>
                    <th className="py-3 px-6">Quantity</th>
                    <th className="py-3 px-6">Grade</th>
                    <th className="py-3 px-6">Asking Price</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {fpo.collective_lots.map((lot: any) => (
                    <tr key={lot.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-slate-800">{lot.lot_code}</td>
                      <td className="py-4 px-6 text-slate-900 font-semibold">{lot.commodity?.name || 'Produce'}</td>
                      <td className="py-4 px-6">{lot.quantity} {lot.unit}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          {lot.quality_grade || 'Grade A'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {lot.asking_price ? `₹${lot.asking_price.toLocaleString('en-IN')}` : 'Market Price'}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={lot.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <Package className="w-12 h-12 mx-auto text-slate-300 mb-3 stroke-1" />
                <p className="text-base font-semibold text-slate-700">No collective lots created yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Pool small quantities from your registered member farmers into bulk lots to attract institutional FMCG buyers.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Member Farmers Directory */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Registered Members</h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {fpo?.members?.length || 0} Farmers
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Smallholder farmers affiliated with this FPO cluster.
            </p>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {fpo?.members && fpo.members.length > 0 ? (
                fpo.members.map((mem: any) => (
                  <div key={mem.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {mem.farmer?.user?.full_name || 'Member Farmer'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Land: {mem.farmer?.land_holding_acres ? `${mem.farmer.land_holding_acres} Acres` : 'Smallholder'} • Village: {mem.farmer?.village || 'Local'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-1" />
                  <p className="text-xs text-slate-500">No members linked yet</p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowMemberModal(true)}
            className="w-full mt-6 py-3 px-4 rounded-xl border border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold text-sm transition-colors text-center"
          >
            + Link Farmer Member
          </button>
        </div>
      </div>

      {/* Modal: Add Member Farmer */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Add Member Farmer</h3>
            <p className="text-xs text-slate-500 mb-5">Enter the Farmer Profile ID to link them to your FPO.</p>
            
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Farmer Profile ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7f8a3c4b-..."
                  value={memberFarmerId}
                  onChange={(e) => setMemberFarmerId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Available from farmer's profile or registration slip.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Affiliation Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Nashik Grape Cluster, Taluka Niphad"
                  value={memberNotes}
                  onChange={(e) => setMemberNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Linking...' : 'Confirm Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Aggregate & Pool Produce */}
      {showAggregateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Aggregate & Pool Produce</h3>
            <p className="text-xs text-slate-500 mb-5">Create a single bulk sale batch by aggregating produce from your member farmers.</p>

            <form onSubmit={handleAggregateProduce} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Commodity *</label>
                  <select
                    value={aggCommodityId}
                    onChange={(e) => setAggCommodityId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {commodities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.variety || 'Standard'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quality Grade *</label>
                  <select
                    value={aggGrade}
                    onChange={(e) => setAggGrade(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Grade A">Grade A (Premium / Export)</option>
                    <option value="Grade B">Grade B (Fair Average Quality - FAQ)</option>
                    <option value="Grade C">Grade C (Processing Quality)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Total Quantity (Quintals) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 500"
                    value={aggQuantity}
                    onChange={(e) => setAggQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Asking Price (₹ / Quintal) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 2450"
                    value={aggPrice}
                    onChange={(e) => setAggPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Farmer Traceability Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Smallholder Farmer Contributions (Traceability)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddContributionRow}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    + Add Farmer
                  </button>
                </div>
                <div className="space-y-2">
                  {memberContributions.map((c, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Farmer ID or Name"
                        value={c.farmer_id}
                        onChange={(e) => handleUpdateContribution(idx, 'farmer_id', e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <input
                        type="number"
                        placeholder="Qty (Qtl)"
                        value={c.quantity}
                        onChange={(e) => handleUpdateContribution(idx, 'quantity', e.target.value)}
                        className="w-24 px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      {memberContributions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveContributionRow(idx)}
                          className="text-slate-400 hover:text-rose-500 text-xs px-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={aggPublish}
                    onChange={(e) => setAggPublish(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Publish directly to institutional marketplace for bulk buyers
                </label>
              </div>

              <div className="flex gap-3 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAggregateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Aggregating...' : 'Create Collective Lot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FPODashboard;
