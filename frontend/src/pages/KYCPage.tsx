import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { kycApi } from '../services/api';
import { KYCVerification } from '../types';
import StatusBadge from '../components/StatusBadge';
import KYCModal from '../components/KYCModal';
import { ShieldCheck, FileText, CheckCircle2, AlertTriangle, Clock, RefreshCw, Upload } from 'lucide-react';

const KYCPage: React.FC = () => {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<KYCVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Admins moderate KYC submissions from the Admin Dashboard, not their own
  if (user?.role?.toLowerCase() === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  const fetchKYC = async () => {
    setLoading(true);
    try {
      const res = await kycApi.getMyStatus();
      setKycStatus(res.data);
    } catch (err: any) {
      console.error('Failed to load KYC status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYC();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const isApproved = kycStatus?.status === 'APPROVED';
  const isPending = kycStatus?.status === 'PENDING';
  const isRejected = kycStatus?.status === 'REJECTED';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Trust & Identity Verification
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Know Your Customer (KYC)</h1>
          <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
            Compliant identification ensures authentic trade, prevents fraudulent crop listings, and authorizes escrow payouts.
          </p>
        </div>
      </div>

      {/* Main Status Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verification Status</span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-bold text-slate-900">
                {isApproved ? 'Identity Cleared & Verified' : isPending ? 'Under Review by Admin' : isRejected ? 'Verification Rejected' : 'Verification Required'}
              </h2>
              <StatusBadge status={kycStatus?.status || 'PENDING'} />
            </div>
          </div>

          {!isApproved && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-colors"
            >
              <Upload className="w-4 h-4" />
              {kycStatus ? 'Re-upload Document' : 'Submit KYC Document'}
            </button>
          )}
        </div>

        {/* Detailed Status Body */}
        <div className="py-6">
          {isApproved ? (
            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-emerald-900 text-base">Your account has full trading clearance</h3>
                <p className="text-xs text-emerald-800/80">
                  You can freely list bulk lots, accept escrow deposits, request logistics trucks, and participate in institutional contracts.
                </p>
                {kycStatus && (
                  <div className="mt-4 pt-4 border-t border-emerald-200/60 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-emerald-700 font-medium">Document Type:</span>{' '}
                      <span className="font-semibold text-emerald-900">{kycStatus.document_type}</span>
                    </div>
                    <div>
                      <span className="text-emerald-700 font-medium">Identifier Hash:</span>{' '}
                      <span className="font-mono font-semibold text-emerald-900">{kycStatus.document_number}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : isPending ? (
            <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-amber-900 text-base">Verification in progress</h3>
                <p className="text-xs text-amber-800/80">
                  Our compliance team is verifying your submitted document against government registries. Turnaround is typically within 2-4 hours.
                </p>
                {kycStatus && (
                  <div className="mt-4 pt-4 border-t border-amber-200/60 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-amber-700 font-medium">Document Type:</span>{' '}
                      <span className="font-semibold text-amber-900">{kycStatus.document_type}</span>
                    </div>
                    <div>
                      <span className="text-amber-700 font-medium">Identifier:</span>{' '}
                      <span className="font-mono font-semibold text-amber-900">{kycStatus.document_number}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : isRejected ? (
            <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-rose-900 text-base">Verification was not successful</h3>
                <p className="text-xs text-rose-800/80">
                  Remarks: {kycStatus?.admin_notes || 'Document unreadable or identifier does not match registration records. Please re-upload a clear copy.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-1" />
              <h3 className="font-bold text-slate-800 text-base">No identity document on file</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Submit an Aadhaar Card, PAN Card, GSTIN certificate, or FPO registration certificate to activate your trading rights.
              </p>
            </div>
          )}
        </div>
      </div>

      <KYCModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        role={(user?.role as string)?.toLowerCase() || 'farmer'}
        onSuccess={() => {
          fetchKYC();
        }}
      />
    </div>
  );
};

export default KYCPage;
