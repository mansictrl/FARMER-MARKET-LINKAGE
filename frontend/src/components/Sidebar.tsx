import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Sprout,
  Store,
  ShoppingBag,
  TrendingUp,
  FileCheck,
  Warehouse,
  Truck,
  ArrowUpRight,
  Users,
  Layers,
  ShieldCheck,
  CheckSquare,
  BarChart3,
  Sliders
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = (user.role as string)?.toLowerCase();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
      isActive
        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
    }`;

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between hidden md:flex">
      <div className="space-y-6">
        {/* User Card */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md">
            {user.full_name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-white truncate">{user.full_name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">{user.role}</span>
              {user.is_verified && (
                <span className="text-[9px] bg-emerald-500/10 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/30">
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Main Menu
          </div>

          {/* Farmer Links */}
          {role === 'farmer' && (
            <>
              <NavLink to="/dashboard/farmer" className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Farmer Dashboard</span>
              </NavLink>
              <NavLink to="/marketplace" className={linkClass}>
                <Store className="w-4 h-4" />
                <span>Browse Marketplace</span>
              </NavLink>
              <NavLink to="/price-discovery" className={linkClass}>
                <TrendingUp className="w-4 h-4" />
                <span>Price Discovery</span>
              </NavLink>
              <NavLink to="/transactions" className={linkClass}>
                <ArrowUpRight className="w-4 h-4" />
                <span>Deals & Transactions</span>
              </NavLink>
              <NavLink to="/storage-logistics" className={linkClass}>
                <Warehouse className="w-4 h-4" />
                <span>Storage & Logistics</span>
              </NavLink>
              <NavLink to="/kyc" className={linkClass}>
                <FileCheck className="w-4 h-4" />
                <span>Kisan KYC Verification</span>
              </NavLink>
            </>
          )}

          {/* Buyer Links */}
          {role === 'buyer' && (
            <>
              <NavLink to="/dashboard/buyer" className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Buyer Dashboard</span>
              </NavLink>
              <NavLink to="/marketplace" className={linkClass}>
                <Store className="w-4 h-4" />
                <span>Procure Produce</span>
              </NavLink>
              <NavLink to="/price-discovery" className={linkClass}>
                <TrendingUp className="w-4 h-4" />
                <span>Mandi Rates & Trends</span>
              </NavLink>
              <NavLink to="/transactions" className={linkClass}>
                <ArrowUpRight className="w-4 h-4" />
                <span>Transactions & Escrow</span>
              </NavLink>
              <NavLink to="/storage-logistics" className={linkClass}>
                <Truck className="w-4 h-4" />
                <span>Logistics & Freight</span>
              </NavLink>
              <NavLink to="/kyc" className={linkClass}>
                <FileCheck className="w-4 h-4" />
                <span>GSTIN / Corporate KYC</span>
              </NavLink>
            </>
          )}

          {/* FPO Links */}
          {role === 'fpo' && (
            <>
              <NavLink to="/dashboard/fpo" className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>FPO Dashboard</span>
              </NavLink>
              <NavLink to="/marketplace" className={linkClass}>
                <Store className="w-4 h-4" />
                <span>Collective Listings</span>
              </NavLink>
              <NavLink to="/price-discovery" className={linkClass}>
                <TrendingUp className="w-4 h-4" />
                <span>Price Discovery</span>
              </NavLink>
              <NavLink to="/transactions" className={linkClass}>
                <ArrowUpRight className="w-4 h-4" />
                <span>Bulk Deals & Escrow</span>
              </NavLink>
              <NavLink to="/storage-logistics" className={linkClass}>
                <Warehouse className="w-4 h-4" />
                <span>Storage & Logistics</span>
              </NavLink>
              <NavLink to="/kyc" className={linkClass}>
                <FileCheck className="w-4 h-4" />
                <span>FPO Registration KYC</span>
              </NavLink>
            </>
          )}

          {/* Admin Links */}
          {role === 'admin' && (
            <>
              <NavLink to="/dashboard/admin" className={linkClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Admin Operations</span>
              </NavLink>
              <NavLink to="/marketplace" className={linkClass}>
                <Store className="w-4 h-4" />
                <span>Moderate Listings</span>
              </NavLink>
              <NavLink to="/price-discovery" className={linkClass}>
                <BarChart3 className="w-4 h-4" />
                <span>Mandi Data & CSV</span>
              </NavLink>
              <NavLink to="/transactions" className={linkClass}>
                <ArrowUpRight className="w-4 h-4" />
                <span>Transactions & Disputes</span>
              </NavLink>
              <NavLink to="/dashboard/admin" className={linkClass}>
                <ShieldCheck className="w-4 h-4" />
                <span>KYC Approval Queue</span>
              </NavLink>
            </>
          )}
        </div>
      </div>

      <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-[11px] text-slate-400">
        <div className="font-semibold text-slate-300">Govt APMC Mandi Linkage</div>
        <p className="mt-1 text-slate-500 text-[10px]">Direct MSP & Modal price discovery engine</p>
      </div>
    </aside>
  );
};
