import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Offer, Transaction, BuyerRequirement, Commodity } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  ShoppingCart,
  Store,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  DollarSign,
  PlusCircle,
  Clock,
  CheckCircle,
  Truck
} from 'lucide-react';

export const BuyerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [sentOffers, setSentOffers] = useState<Offer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [requirements, setRequirements] = useState<BuyerRequirement[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);

  // Post Requirement Form
  const [isReqOpen, setIsReqOpen] = useState(false);
  const [reqCommodityId, setReqCommodityId] = useState<number>(1);
  const [reqQty, setReqQty] = useState<number>(500);
  const [reqPrice, setReqPrice] = useState<number>(2400);
  const [reqNotes, setReqNotes] = useState<string>('');
  const [banner, setBanner] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      const [offRes, txnRes, reqRes, commRes] = await Promise.all([
        api.getSentOffers(),
        api.getTransactions(),
        api.getBuyerRequirements(),
        api.getCommodities(),
      ]);
      setSentOffers(offRes.data);
      setTransactions(txnRes.data);
      setRequirements(reqRes.data);
      setCommodities(commRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handlePostRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBuyerRequirement({
        commodity_id: Number(reqCommodityId),
        target_quantity: Number(reqQty),
        unit: 'Quintal',
        target_price_per_unit: Number(reqPrice),
        delivery_state: user?.buyer_profile?.state || 'Maharashtra',
        delivery_district: user?.buyer_profile?.district || 'Navi Mumbai',
        delivery_address: user?.buyer_profile?.delivery_address || 'Agri Logistics Hub',
        notes: reqNotes,
      });
      setIsReqOpen(false);
      setBanner('Purchase requirement posted to verified farmer & FPO network.');
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to post requirement.');
    }
  };

  const handlePayEscrow = async (txnId: number) => {
    try {
      // 1. Initiate Razorpay order
      const initRes = await api.initiatePayment(txnId);
      // 2. Simulate cryptographic signature verification in test mode
      await api.verifyPayment({
        payment_id: initRes.data.id,
        razorpay_order_id: initRes.data.payment_gateway_order_id || 'order_mock',
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'test_sig_mock_signature',
      });
      setBanner(`Payment of ₹${initRes.data.amount} locked into platform escrow. Seller notified to dispatch.`);
      refreshData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Escrow funding failed.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Institutional Buyer Portal</span>
            {user?.is_verified && (
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3" />
                <span>GSTIN Verified Buyer</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white">{user?.buyer_profile?.company_name || user?.full_name}</h1>
          <p className="text-xs text-slate-400">
            GSTIN: {user?.buyer_profile?.gst_number || '27AAACI1681G1Z0'} • Delivery Hub: {user?.buyer_profile?.district || 'Navi Mumbai'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/marketplace"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-lg shadow-blue-500/20"
          >
            <Store className="w-4 h-4" />
            <span>Search Marketplace</span>
          </Link>
          <button
            onClick={() => setIsReqOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Post Requirement</span>
          </button>
        </div>
      </div>

      {banner && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center justify-between">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Submitted Offers</span>
          <div className="text-2xl font-extrabold text-white mt-1">{sentOffers.length}</div>
          <span className="text-[10px] text-slate-500">Across verified listings</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pending Acceptance</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {sentOffers.filter(o => o.status === 'PENDING').length}
          </div>
          <span className="text-[10px] text-slate-500">Waiting for seller review</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Escrow Funded Deals</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {transactions.filter(t => t.payment_status === 'ESCROW_FUNDED').length}
          </div>
          <span className="text-[10px] text-slate-500">Locked in secure escrow</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Consignments In Transit</span>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">
            {transactions.filter(t => t.fulfillment_status === 'IN_TRANSIT').length}
          </div>
          <span className="text-[10px] text-slate-500">En route to your hub</span>
        </div>
      </div>

      {/* Active Deals Requiring Escrow Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-base text-white">Active Procurement Transactions</h3>
            <p className="text-xs text-slate-400">Accepted deals requiring payment funding or delivery confirmation</p>
          </div>
          <Link to="/transactions" className="text-xs text-blue-400 hover:underline font-semibold">
            Manage All Deals →
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">No active transactions. Submit offers on the marketplace to procure.</div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {transactions.map((t) => (
              <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-200">{t.transaction_code}</span>
                    <StatusBadge status={t.payment_status} />
                    <StatusBadge status={t.fulfillment_status || 'ORDER_PLACED'} />
                  </div>
                  <h4 className="text-sm font-bold text-white">{t.listing_title}</h4>
                  <p className="text-xs text-slate-400">
                    Seller: <strong className="text-slate-200">{t.seller_name}</strong> • Agreed Qty: <strong className="text-slate-200">{t.agreed_quantity} Q</strong> @ ₹{t.agreed_price_per_unit}/Q
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-emerald-400">₹{Number(t.total_amount).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">Escrow Total</div>
                  </div>

                  {t.payment_status === 'PENDING' ? (
                    <button
                      onClick={() => handlePayEscrow(Number(t.id))}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                    >
                      Fund Escrow (Razorpay)
                    </button>
                  ) : (
                    <Link
                      to="/transactions"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700"
                    >
                      Track Shipment
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Offers Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-white">Submitted Purchase Offers</h3>
          <p className="text-xs text-slate-400">Offers sent to farmers and FPOs</p>
        </div>

        {sentOffers.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No offers sent yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Produce Listing</th>
                  <th className="py-3 px-4">Offered Quantity</th>
                  <th className="py-3 px-4">Offered Rate</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sentOffers.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">{o.listing_title}</td>
                    <td className="py-3.5 px-4 text-slate-300">{o.offered_quantity} Q</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">₹{o.offered_price_per_unit}/Q</td>
                    <td className="py-3.5 px-4 font-bold text-white">₹{Number(o.total_amount).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Post Requirement Modal */}
      {isReqOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-white mb-1">Post Wholesale Purchase Requirement</h3>
            <p className="text-xs text-slate-400 mb-4">Notify regional farmers and FPOs of your commodity demand.</p>

            <form onSubmit={handlePostRequirement} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Crop / Commodity</label>
                <select
                  value={reqCommodityId}
                  onChange={(e) => setReqCommodityId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                >
                  {commodities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Quantity (Q)</label>
                  <input
                    type="number"
                    value={reqQty}
                    onChange={(e) => setReqQty(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Rate (₹/Q)</label>
                  <input
                    type="number"
                    value={reqPrice}
                    onChange={(e) => setReqPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Specifications</label>
                <textarea
                  rows={2}
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  placeholder="e.g. Export quality Grade A, moisture under 10%"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReqOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs"
                >
                  Post Demand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
