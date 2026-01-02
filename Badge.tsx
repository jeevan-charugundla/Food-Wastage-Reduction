import React from 'react';
import { FoodStatus, PickupStatus } from '../types';

interface BadgeProps {
  status: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';

  switch (status) {
    case FoodStatus.AVAILABLE:
      colorClass = 'bg-green-100 text-green-800 border-green-200';
      break;
    case FoodStatus.ACCEPTED:
      colorClass = 'bg-orange-100 text-orange-800 border-orange-200';
      break;
    case FoodStatus.EXPIRED:
      colorClass = 'bg-red-100 text-red-800 border-red-200';
      break;
    case PickupStatus.PICKED:
      colorClass = 'bg-blue-100 text-blue-800 border-blue-200';
      break;
    case PickupStatus.DELIVERED:
      colorClass = 'bg-green-100 text-green-800 border-green-200';
      break;
    case PickupStatus.PENDING:
      colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      break;
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
};