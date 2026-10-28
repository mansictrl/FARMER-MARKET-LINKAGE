import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { NotificationItem } from '../types';
import { Bell, CheckCheck, X, AlertCircle, ShoppingBag, Truck, FileCheck, DollarSign } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'OFFER_RECEIVED':
      case 'OFFER_ACCEPTED':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'PAYMENT_RECEIVED':
        return <DollarSign className="w-4 h-4 text-harvest-400" />;
      case 'DELIVERY_UPDATE':
        return <Truck className="w-4 h-4 text-blue-400" />;
      case 'KYC_APPROVED':
      case 'KYC_REJECTED':
        return <FileCheck className="w-4 h-4 text-purple-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-100">Notifications</h3>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500 text-slate-950">
                {notifications.filter(n => !n.is_read).length} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAll}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Bell className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`p-3 rounded-xl border transition cursor-pointer flex gap-3 ${
                  n.is_read
                    ? 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                    : 'bg-slate-800/60 border-emerald-500/30 text-slate-200'
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 self-start">
                  {getIcon(n.notification_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm text-slate-200">{n.title}</h4>
                    <span className="text-[10px] text-slate-500">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
