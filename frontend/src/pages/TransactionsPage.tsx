import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transactionsApi, reviewsApi } from '../services/api';
import { Transaction } from '../types';
import StatusBadge from '../components/StatusBadge';
import { 
  ArrowRight, CheckCircle2, ShieldCheck, Truck, Clock, AlertTriangle, 
  DollarSign, Star, RefreshCw, ChevronRight, FileText, Lock
} from 'lucide-react';

const STEPS = [
  { key: 'INITIATED', label: 'Offer Accepted' },
  { key: 'ESCROW_LOCKED', label: 'Escrow Secured' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'COMPLETED', label: 'Completed' },
];

const getStepIndex = (status: string) => {
  const map: Record<string, number> = {
    INITIATED: 0,
    ESCROW_LOCKED: 1,
    DISPATCHED: 2,
    IN_TRANSIT: 3,
    DELIVERED: 4,
    COMPLETED: 5,
    DISPUTED: -1,
  };
  return map[status] ?? 0;
};

const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
  // Payment State
  const [payingTxId, setPayingTxId] = useState<string | number | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  
  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState<Transaction | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Dispute Modal State
  const [showDisputeModal, setShowDisputeModal] = useState<Transaction | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await transactionsApi.getAll();
      setTransactions(res.data);
      if (res.data.length > 0 && !selectedTx) {
        setSelectedTx(res.data[0]);
      } else if (selectedTx) {
        const updated = res.data.find((t: Transaction) => t.id === selectedTx.id);
        if (updated) setSelectedTx(updated);
      }
    } catch (err: any) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleAdvanceStatus = async (txId: any, nextStatus: string) => {
    try {
      await transactionsApi.updateStatus(txId, nextStatus);
      setFeedback({ type: 'success', message: `Transaction status advanced to ${nextStatus}` });
      fetchTransactions();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to update transaction status' });
    }
  };

  const handleTestEscrowPayment = async (tx: Transaction) => {
    setPayingTxId(tx.id);
    setPaymentSuccessMsg(null);
    try {
      // Step 1: Initiate Razorpay Order on Backend
      const orderRes = await transactionsApi.initiatePayment(tx.id);
      const { razorpay_order_id, amount } = orderRes.data as any;

      // Simulate client-side Razorpay checkout interaction
      // Step 2: In test-mode simulation, generate test payment credentials and verify signature
      const mockPaymentId = `pay_mock_${Date.now()}`;
      const mockSignature = `sig_verified_${Date.now()}`;

      await transactionsApi.verifyPayment(tx.id, {
        razorpay_order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
      });

      setPaymentSuccessMsg(`₹${(amount / 100).toLocaleString('en-IN')} escrow payment verified! Funds held safely until inspection & delivery.`);
      fetchTransactions();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Payment verification failed' });
    } finally {
      setPayingTxId(null);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReviewModal) return;
    setSubmittingReview(true);
    try {
      const isBuyer = (user?.role as string)?.toUpperCase() === 'BUYER';
      const revieweeId = isBuyer
        ? (showReviewModal.farmer_id || showReviewModal.seller_id)
        : showReviewModal.buyer_id;

      await reviewsApi.create({
        transaction_id: showReviewModal.id,
        reviewee_id: revieweeId,
        rating: reviewRating,
        comment: reviewComment,
      });
      setFeedback({ type: 'success', message: 'Review and rating recorded successfully!' });
      setShowReviewModal(null);
      setReviewComment('');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to submit review' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDisputeModal) return;
    setSubmittingDispute(true);
    try {
      await transactionsApi.raiseDispute(showDisputeModal.id, {
        reason: disputeReason,
        description: 'Quality deviation or shipment delay reported',
      });
      setFeedback({ type: 'success', message: 'Dispute raised. Platform admin notified for escrow hold.' });
      setShowDisputeModal(null);
      setDisputeReason('');
      fetchTransactions();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Failed to raise dispute' });
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const currentStep = selectedTx ? getStepIndex(selectedTx.status || 'INITIATED') : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Escrow Secured Settlements
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Agricultural Trade Settlements</h1>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
              Track farm-to-warehouse deliveries, cryptographic escrow security, and transparent farmer payment releases.
            </p>
          </div>
          <button
            onClick={fetchTransactions}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium border border-white/20 transition-all text-sm backdrop-blur-sm shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Status
          </button>
        </div>

        {feedback && (
          <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 text-sm ${feedback.type === 'success' ? 'bg-emerald-900/80 border border-emerald-400 text-emerald-100' : 'bg-rose-900/80 border border-rose-400 text-rose-100'}`}>
            <span>{feedback.message}</span>
          </div>
        )}

        {paymentSuccessMsg && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-900/80 border border-emerald-400 text-emerald-100 flex items-center gap-3 text-sm">
            <Lock className="w-5 h-5 text-emerald-300 shrink-0" />
            <span>{paymentSuccessMsg}</span>
          </div>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center shadow-sm">
          <Truck className="w-16 h-16 mx-auto text-slate-300 mb-4 stroke-1" />
          <h2 className="text-xl font-bold text-slate-800">No Active Transactions</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Transactions are automatically spawned when an offer on a produce listing is accepted by the farmer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Transaction List */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 px-1">Active & Past Deals ({transactions.length})</h2>
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isSelected = selectedTx?.id === tx.id;
                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-semibold text-slate-500">{tx.transaction_number}</span>
                      <StatusBadge status={tx.status || 'INITIATED'} />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {tx.listing?.lot?.commodity?.name || 'Produce Lot'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {tx.agreed_quantity} Quintals • ₹{tx.agreed_price_per_unit}/Qtl
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900">
                          ₹{tx.total_amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 capitalize">
                          Pay: {tx.payment_status.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Tracker and Actions */}
          <div className="lg:col-span-7">
            {selectedTx ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-slate-900">
                        {selectedTx.listing?.lot?.commodity?.name || 'Commodity Deal'}
                      </h2>
                      <StatusBadge status={selectedTx.status || 'INITIATED'} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      Deal Ref: {selectedTx.transaction_number} • Created:{' '}
                      {new Date(selectedTx.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
                    <span className="text-xs text-slate-400 font-medium uppercase">Agreed Total</span>
                    <p className="text-2xl font-black text-emerald-700">
                      ₹{selectedTx.total_amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Trade Lifecycle & Milestones
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {STEPS.map((step, idx) => {
                      const isDone = currentStep >= idx && selectedTx.status !== 'DISPUTED';
                      const isCurrent = currentStep === idx && selectedTx.status !== 'DISPUTED';
                      return (
                        <div
                          key={step.key}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            isCurrent
                              ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-md'
                              : isDone
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="text-[10px] uppercase font-bold tracking-wider mb-1">
                            Step {idx + 1}
                          </div>
                          <div className="text-xs">{step.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Deal Participant & Quality Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2 text-xs">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">Stakeholders</span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Producer / Farmer:</span>
                      <span className="font-medium text-slate-800">{selectedTx.farmer?.user?.full_name || 'Ramesh Patil'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Institutional Buyer:</span>
                      <span className="font-medium text-slate-800">{selectedTx.buyer?.user?.full_name || 'Priya Sharma'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Delivery Address:</span>
                      <span className="font-medium text-slate-800">{selectedTx.delivery_address || 'Lasalgaon Mandi Warehouse'}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2 text-xs">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider">Lot Specifications</span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Volume:</span>
                      <span className="font-medium text-slate-800">{selectedTx.agreed_quantity} Quintals</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Quality Grade:</span>
                      <span className="font-medium text-slate-800">{selectedTx.listing?.lot?.quality_grade || 'Grade A (Export)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Status:</span>
                      <span className="font-semibold text-emerald-700">{selectedTx.payment_status}</span>
                    </div>
                  </div>
                </div>

                {/* Action Controls based on Role & State */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  {/* Buyer Payment Action */}
                  {(user?.role as string)?.toUpperCase() === 'BUYER' && selectedTx.payment_status === 'PENDING' && (
                    <button
                      onClick={() => handleTestEscrowPayment(selectedTx)}
                      disabled={payingTxId === selectedTx.id}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm shadow-md transition-colors disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      {payingTxId === selectedTx.id ? 'Securing Escrow...' : `Pay ₹${selectedTx.total_amount.toLocaleString('en-IN')} via Escrow`}
                    </button>
                  )}

                  {/* Advance Delivery Status */}
                  <div className="flex gap-2">
                    {selectedTx.status === 'ESCROW_LOCKED' && (
                      <button
                        onClick={() => handleAdvanceStatus(selectedTx.id, 'DISPATCHED')}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow transition-colors"
                      >
                        Mark as Dispatched
                      </button>
                    )}
                    {selectedTx.status === 'DISPATCHED' && (
                      <button
                        onClick={() => handleAdvanceStatus(selectedTx.id, 'IN_TRANSIT')}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow transition-colors"
                      >
                        Mark In Transit
                      </button>
                    )}
                    {selectedTx.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleAdvanceStatus(selectedTx.id, 'DELIVERED')}
                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow transition-colors"
                      >
                        Confirm Delivery
                      </button>
                    )}
                    {selectedTx.status === 'DELIVERED' && (
                      <button
                        onClick={() => handleAdvanceStatus(selectedTx.id, 'COMPLETED')}
                        className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow transition-colors"
                      >
                        Release Escrow & Complete
                      </button>
                    )}
                  </div>

                  {/* Dispute and Review Options */}
                  <div className="flex gap-2 ml-auto">
                    {selectedTx.status !== 'COMPLETED' && selectedTx.status !== 'DISPUTED' && (
                      <button
                        onClick={() => setShowDisputeModal(selectedTx)}
                        className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold text-xs transition-colors"
                      >
                        Raise Dispute
                      </button>
                    )}
                    {selectedTx.status === 'COMPLETED' && (
                      <button
                        onClick={() => setShowReviewModal(selectedTx)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-xs transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Review Partner
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400">
                Select a deal from the list to view its progression and escrow records.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Submit Trade Review</h3>
            <p className="text-xs text-slate-500 mb-5">Rate the quality, timeliness and cooperation of your trade partner.</p>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">Rating (1 to 5 Stars)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none"
                    >
                      <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Feedback Comments</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Excellent crop quality, moisture within limits, prompt dispatch!"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Raise Trade Dispute</h3>
            <p className="text-xs text-slate-500 mb-5">This will pause escrow settlement and escalate to platform arbitration.</p>
            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Reason for Dispute *</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="">Select Reason...</option>
                  <option value="Quality mismatch / Moisture exceeds agreed specification">Quality mismatch / Moisture exceeds specification</option>
                  <option value="Quantity shortage upon physical weighment">Quantity shortage upon physical weighment</option>
                  <option value="Severe transit delay or damaged produce">Severe transit delay or damaged produce</option>
                  <option value="Payment / Bank account discrepancy">Payment / Bank account discrepancy</option>
                </select>
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md transition-colors disabled:opacity-50"
                >
                  {submittingDispute ? 'Submitting...' : 'Confirm Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
