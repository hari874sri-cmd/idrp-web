import React from 'react';
import { DonationStatus } from '../types';
import { 
  CheckCircle2, Clock, AlertCircle, PackageCheck, 
  Truck, CheckCheck, XCircle, AlertTriangle 
} from 'lucide-react';

interface StatusBadgeProps {
  status: DonationStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  const config = {
    AVAILABLE: {
      label: 'Available',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      icon: CheckCircle2,
    },
    REQUESTED: {
      label: 'Claim Requested',
      bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
      icon: Clock,
    },
    ACCEPTED: {
      label: 'Claim Accepted',
      bg: 'bg-blue-50 text-blue-700 border-blue-200/80',
      icon: PackageCheck,
    },
    READY_FOR_PICKUP: {
      label: 'Ready for Pickup',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      icon: Truck,
    },
    PICKED_UP: {
      label: 'In Transit / Picked Up',
      bg: 'bg-purple-50 text-purple-700 border-purple-200/80',
      icon: Truck,
    },
    COMPLETED: {
      label: 'Completed & Delivered',
      bg: 'bg-forest-50 text-forest-800 border-forest-200/80',
      icon: CheckCheck,
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
      icon: XCircle,
    },
    EXPIRED: {
      label: 'Expired',
      bg: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: AlertTriangle,
    },
  }[status] || {
    label: status,
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: AlertCircle,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${config.bg} ${sizeClasses[size]}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};

