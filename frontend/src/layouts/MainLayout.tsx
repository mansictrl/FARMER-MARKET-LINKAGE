import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sprout, ShieldCheck, HeartHandshake, PhoneCall } from 'lucide-react';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="font-bold text-white text-base">KisanSetu Platform</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering Indian farmers and Farmer Producer Organisations (FPOs) through transparent mandi price discovery, direct institutional buyer linkages, and escrow-secured transactions.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Platform Solutions</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/marketplace" className="hover:text-emerald-400 transition">Direct Produce Marketplace</Link></li>
              <li><Link to="/price-discovery" className="hover:text-emerald-400 transition">Mandi Price Comparison</Link></li>
              <li><Link to="/storage-logistics" className="hover:text-emerald-400 transition">Cold Storage Booking</Link></li>
              <li><Link to="/storage-logistics" className="hover:text-emerald-400 transition">Freight & Logistics Network</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Institutional Roles</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/login" className="hover:text-emerald-400 transition">Farmer Direct Selling</Link></li>
              <li><Link to="/login" className="hover:text-emerald-400 transition">Agribusiness Wholesale Buying</Link></li>
              <li><Link to="/login" className="hover:text-emerald-400 transition">FPO Collective Pooling</Link></li>
              <li><Link to="/login" className="hover:text-emerald-400 transition">Admin & Mandi Moderation</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">Trust & Security</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Escrow Secured Payments</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Verified APMC Mandi Rates</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-harvest-400 shrink-0" />
                <span>Kisan Toll-Free Support: 1800-180-1551</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 Farmer Market Linkage and Price Discovery System. All rights reserved.</p>
          <p>Compliant with e-NAM & APMC Model Act guidelines.</p>
        </div>
      </footer>
    </div>
  );
};
