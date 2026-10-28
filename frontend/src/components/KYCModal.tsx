import React, { useState } from 'react';
import { api } from '../services/api';
import { FileCheck, X, ShieldAlert } from 'lucide-react';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: string;
}

export const KYCModal: React.FC<KYCModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  role,
}) => {
  const defaultDocType = role === 'farmer' ? 'KISAN_CREDIT_CARD' : role === 'buyer' ? 'GSTIN' : 'FPO_REGISTRATION';
  const [docType, setDocType] = useState<string>(defaultDocType);
  const [docNumber, setDocNumber] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.submitKYC({
        document_type: docType,
        document_number: docNumber,
        document_url: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=600',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit KYC verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Submit KYC Verification</h3>
            <p className="text-xs text-slate-400">Role: <span className="capitalize text-emerald-400 font-semibold">{role}</span></p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            >
              {role === 'farmer' ? (
                <>
                  <option value="KISAN_CREDIT_CARD">Kisan Credit Card (KCC)</option>
                  <option value="AADHAAR">Aadhaar Card (UIDAI)</option>
                  <option value="LAND_7_12">7/12 Land Record Extract</option>
                </>
              ) : role === 'buyer' ? (
                <>
                  <option value="GSTIN">Goods & Services Tax (GSTIN)</option>
                  <option value="PAN">Corporate PAN Card</option>
                  <option value="TRADE_LICENSE">APMC Trader License</option>
                </>
              ) : (
                <>
                  <option value="FPO_REGISTRATION">FPO Certificate of Incorporation</option>
                  <option value="NABARD_REGISTER">NABARD / SFAC Recognition</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Document Identifier / Number</label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. 27AAACI1681G1Z0 or KCC-9021-MH"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>Documents are encrypted and audited by certified APMC marketplace administrators.</span>
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
              className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-purple-500/20"
            >
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KYCModal;
