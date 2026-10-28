import React from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { UserRole } from '../types';
import { ShieldCheck, Sprout, ShoppingCart, Building2 } from 'lucide-react';

export const DemoCredentialsBar: React.FC = () => {
  const { user, loginAsDemo, loading } = useAuth();

  // When signed in as a particular user, never show other roles or demo role switcher
  if (user) {
    return null;
  }

  const roleIcons: Record<UserRole, React.ReactNode> = {
    farmer: <Sprout className="w-3.5 h-3.5 text-emerald-400" />,
    buyer: <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />,
    fpo: <Building2 className="w-3.5 h-3.5 text-amber-400" />,
    admin: <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />,
  };

  return (
    <aside aria-label="Demo role switcher" className="bg-slate-900/90 border-b border-emerald-500/20 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 backdrop-blur z-50">
      <div className="flex items-center gap-2 text-slate-300">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px]">Demo Role Switcher:</span>
        <span className="text-slate-400 hidden sm:inline">1-Click switch profiles with real pre-seeded backend data:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {(Object.keys(DEMO_ACCOUNTS) as UserRole[]).map((r) => {
          const account = DEMO_ACCOUNTS[r];
          return (
            <button
              key={r}
              onClick={() => loginAsDemo(r)}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60"
              title={`Login as ${account.label}`}
            >
              {roleIcons[r]}
              <span className="capitalize">{r}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
