import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStyle = (s: string) => {
    switch (s.toUpperCase()) {
      case 'ACTIVE':
      case 'ACCEPTED':
      case 'APPROVED':
      case 'SUCCESS':
      case 'COMPLETED':
      case 'PASSED':
      case 'RELEASED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'PENDING':
      case 'UNDER_NEGOTIATION':
      case 'UNDER_INVESTIGATION':
      case 'ORDER_PLACED':
      case 'PACKED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'ESCROW_FUNDED':
      case 'CONFIRMED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'IN_TRANSIT':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'DELIVERED':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
      case 'REJECTED':
      case 'FAILED':
      case 'DISPUTED':
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${getStyle(status)} ${pad}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;
