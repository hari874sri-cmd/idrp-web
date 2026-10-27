import React from 'react';
import { Leaf, Heart, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 text-xs text-gray-500 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-forest-600" />
          <span className="font-semibold text-gray-700">ReRoute AI</span>
          <span>&mdash; Smart Food Surplus Prediction & Safe Redistribution</span>
        </div>
        <div className="flex items-center gap-6 text-gray-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-600" /> Safe Food Transit Protocols
          </span>
          <span>OpenStreetMap & Leaflet</span>
          <span>&copy; {new Date().getFullYear()} ReRoute AI</span>
        </div>
      </div>
    </footer>
  );
};

