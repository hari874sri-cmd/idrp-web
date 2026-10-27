import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-24 text-center max-w-md mx-auto space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center mx-auto shadow-xs">
        <Leaf className="w-6 h-6" />
      </div>
      <h1 className="text-4xl font-black text-gray-900 tracking-tight">404</h1>
      <h2 className="text-base font-bold text-gray-800">Page Not Found</h2>
      <p className="text-xs text-gray-500">
        The destination you are looking for does not exist or has been relocated within the network.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};

