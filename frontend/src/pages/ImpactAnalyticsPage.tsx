import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { PlatformImpact } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { 
  TrendingUp, Leaf, HeartHandshake, Scale, 
  Droplet, Car, ShieldCheck, Award 
} from 'lucide-react';

export const ImpactAnalyticsPage: React.FC = () => {
  const [impact, setImpact] = useState<PlatformImpact | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadImpact();
  }, []);

  const loadImpact = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics/impact/');
      setImpact(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const metrics = impact?.headline_metrics;
  const trend = impact?.monthly_trend || [];
  const catDistribution = impact?.category_distribution || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
        <span className="text-[10px] uppercase font-bold text-forest-700 tracking-wider bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
          Sustainability & Community Value
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Environmental & Social Impact Analytics
        </h1>
        <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
          Transparent metrics calculating verifiable food waste diversion, greenhouse gas emissions avoided, and embedded water conserved across our donation network.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-gray-400">Loading platform impact aggregates...</div>
      ) : (
        <>
          {/* Key 4 Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center mb-2">
                <Scale className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-gray-500">Food Diverted</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {metrics ? metrics.total_kg_redistributed.toLocaleString() : '0'}{' '}
                <span className="text-xs font-semibold text-gray-500">kg</span>
              </p>
              <span className="text-[10px] text-forest-700 font-semibold block mt-1">
                Zero Landfill Waste
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-gray-500">Meals Served</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {metrics ? metrics.total_meals_redistributed.toLocaleString() : '0'}{' '}
                <span className="text-xs font-semibold text-gray-500">portions</span>
              </p>
              <span className="text-[10px] text-amber-700 font-semibold block mt-1">
                Delivered to Shelters
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-gray-500">CO₂e GHG Averted</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {metrics ? metrics.total_co2_saved_kg.toLocaleString() : '0'}{' '}
                <span className="text-xs font-semibold text-gray-500">kg</span>
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                ~2.5kg CO₂e per kg food
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-2">
                <Droplet className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-gray-500">Virtual Water Saved</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {metrics ? (metrics.total_water_saved_liters / 1000).toFixed(0) : '0'}{' '}
                <span className="text-xs font-semibold text-gray-500">kL</span>
              </p>
              <span className="text-[10px] text-blue-700 font-semibold block mt-1">
                Preserved Resource Footprint
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend Area Chart */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-gray-900">
                Monthly Food Redistribution Volume (kg)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="kgTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#15803d" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" kg" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="kg_redistributed"
                      stroke="#15803d"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#kgTrend)"
                      name="Kilograms Diverted"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown Bar Chart */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-gray-900">
                Redistribution by Food Category (kg)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={catDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" kg" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="total_kg" fill="#2d6a4f" radius={[6, 6, 0, 0]} name="Total Kilograms" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Environmental Equivalencies Card */}
          <div className="bg-forest-900 text-white p-6 sm:p-8 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm">Environmental Equivalence Equivalents</h3>
            </div>
            <p className="text-xs text-forest-100 max-w-xl">
              By rescuing surplus meals before they decompose in landfills, our donor network actively curtails methane emissions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                <Car className="w-5 h-5 text-amber-300 mb-2" />
                <p className="text-lg font-bold">~5,200 km</p>
                <p className="text-[11px] text-forest-200 mt-0.5">Passenger vehicle kilometers offset</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                <Leaf className="w-5 h-5 text-emerald-300 mb-2" />
                <p className="text-lg font-bold">96 Urban Trees</p>
                <p className="text-[11px] text-forest-200 mt-0.5">Annual carbon absorption equivalence</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
                <Droplet className="w-5 h-5 text-blue-300 mb-2" />
                <p className="text-lg font-bold">~14,000 Showers</p>
                <p className="text-[11px] text-forest-200 mt-0.5">Agricultural water footprint conserved</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

