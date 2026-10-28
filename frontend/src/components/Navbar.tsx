import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MarketPrice } from '../types';
import { NotificationDrawer } from './NotificationDrawer';
import {
  Sprout,
  TrendingUp,
  Store,
  Warehouse,
  Bell,
  User as UserIcon,
  LogIn,
  LayoutDashboard,
  ShieldCheck,
  ChevronDown,
  ArrowUpRight,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickerPrices, setTickerPrices] = useState<MarketPrice[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch latest market prices for ticker
    api.getMarketPrices({ page_size: 6 }).then((res) => {
      setTickerPrices(res.data);
    }).catch(() => {});

    if (user) {
      api.getNotifications().then((res) => {
        setUnreadCount(res.data.filter(n => !n.is_read).length);
      }).catch(() => {});
    }
  }, [user]);

  const getDashboardRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'farmer': return '/dashboard/farmer';
      case 'buyer': return '/dashboard/buyer';
      case 'fpo': return '/dashboard/fpo';
      case 'admin': return '/dashboard/admin';
      default: return '/dashboard';
    }
  };

  return (
    <>
      {/* Live Market Price Ticker */}
      <div className="bg-slate-950 border-b border-emerald-950/60 py-1.5 px-4 text-xs overflow-hidden flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-slate-800">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px]">
            Live APMC Mandi Ticker
          </span>
        </div>

        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap pl-4">
          {tickerPrices.length > 0 ? (
            tickerPrices.map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-300 font-medium">{p.commodity_name}:</span>
                <span className="text-emerald-400 font-bold">₹{p.modal_price}/Q</span>
                <span className="text-slate-500 text-[10px]">({p.market_name})</span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-6 text-[11px]">
              <span>Nashik Onion: <strong className="text-emerald-400">₹2,350/Q</strong></span>
              <span>Indore Wheat: <strong className="text-emerald-400">₹2,800/Q</strong></span>
              <span>Indore Soybean: <strong className="text-emerald-400">₹4,650/Q</strong></span>
              <span>Punjab Basmati: <strong className="text-emerald-400">₹4,250/Q</strong></span>
              <span>Guntur Red Chilli: <strong className="text-emerald-400">₹18,500/Q</strong></span>
            </div>
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0 pl-4 border-l border-slate-800 text-[11px] text-slate-400">
          <span>Source: Agmarknet APMC Direct</span>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to={user ? getDashboardRoute() : '/'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
              <Sprout className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1">
                Kisan<span className="text-emerald-400">Setu</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium tracking-wider uppercase">
                Market Linkage & Price Discovery
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {user ? (
              <>
                <Link
                  to={getDashboardRoute()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition flex items-center gap-1.5 border border-emerald-500/20"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="capitalize">{user.role} Dashboard</span>
                </Link>
                <Link
                  to="/marketplace"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Marketplace</span>
                </Link>
                <Link
                  to="/price-discovery"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mandi Prices</span>
                </Link>
                <Link
                  to="/transactions"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                  <span>My Deals</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/marketplace"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
                >
                  <Store className="w-4 h-4 text-emerald-400" />
                  <span>Produce Marketplace</span>
                </Link>
                <Link
                  to="/price-discovery"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
                >
                  <TrendingUp className="w-4 h-4 text-harvest-400" />
                  <span>Mandi Price Discovery</span>
                </Link>
                <Link
                  to="/storage-logistics"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
                >
                  <Warehouse className="w-4 h-4 text-blue-400" />
                  <span>Storage & Logistics</span>
                </Link>
              </>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Bell */}
                <button
                  onClick={() => setIsNotifOpen(true)}
                  className="p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-slate-300 hover:text-white hover:border-emerald-500/40 relative transition"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/40 transition text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs uppercase">
                      {user.full_name.charAt(0)}
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs font-semibold text-slate-200 leading-tight">{user.full_name}</div>
                      <div className="text-[10px] text-emerald-400 uppercase font-medium">{user.role}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in">
                      <div className="px-3 py-2 border-b border-slate-800">
                        <div className="text-xs font-bold text-slate-200">{user.full_name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                        <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {user.role} mode
                        </div>
                      </div>
                      <Link
                        to={getDashboardRoute()}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                        <span>My Dashboard</span>
                      </Link>
                      <Link
                        to="/transactions"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                        <span>My Deals & Escrow</span>
                      </Link>
                      {user.role !== 'admin' && (
                        <Link
                          to="/kyc"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                          <span>KYC Verification</span>
                        </Link>
                      )}
                      <div className="border-t border-slate-800 my-1"></div>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition font-medium"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition flex items-center gap-1.5 border border-slate-700/60"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-md shadow-emerald-500/20"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-over Notifications */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
};
