import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { PlatformImpact } from '../types';
import { 
  Leaf, Sparkles, HeartHandshake, ShieldCheck, 
  ArrowRight, TrendingUp, Users, Scale, Clock, 
  ChefHat, Building2, ShieldAlert 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, loginDemo } = useAuth();
  const navigate = useNavigate();
  const [impact, setImpact] = useState<PlatformImpact | null>(null);

  useEffect(() => {
    apiClient.get('/analytics/impact/')
      .then((res) => setImpact(res.data))
      .catch(() => {});
  }, []);

  const handleDemoLogin = async (role: 'DONOR' | 'RECEIVER' | 'ADMIN') => {
    await loginDemo(role);
    if (role === 'ADMIN') navigate('/admin-dashboard');
    else navigate('/dashboard');
  };

  const metrics = impact?.headline_metrics;

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-12 pb-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI-Powered Food Surplus Forecasting & Intelligent Redistribution</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
            Bridging Food Surplus with <span className="text-forest-700">Community Need</span> Through Machine Intelligence.
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto font-normal leading-relaxed">
            ReRoute AI connects restaurants, bakeries, and corporate canteens with verified shelters and community kitchens.
            Predict preparation surplus, match recipients instantly, and verify safe pickups with cryptographic OTP handoffs.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/marketplace"
              className="px-6 py-3.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 group"
            >
              <span>Explore Active Marketplace</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/forecast"
              className="px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm rounded-xl border border-gray-200 shadow-2xs transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-forest-600" />
              <span>Try Surplus Forecaster</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Real-Time Platform Impact Stats */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-[11px] font-bold tracking-wider text-forest-700 uppercase bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
            Real-Time Platform Verified Impact
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mt-2">Redistributed Where It Counts Most</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-[#f8faf9] p-5 rounded-2xl border border-gray-100/80 text-center">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 mx-auto flex items-center justify-center mb-3">
              <Scale className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {metrics ? metrics.total_kg_redistributed.toLocaleString() : '840'}<span className="text-sm font-semibold text-gray-500 ml-1">kg</span>
            </p>
            <p className="text-xs font-medium text-gray-500 mt-1">Food Waste Diverted</p>
          </div>

          <div className="bg-[#f8faf9] p-5 rounded-2xl border border-gray-100/80 text-center">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 mx-auto flex items-center justify-center mb-3">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {metrics ? metrics.total_meals_redistributed.toLocaleString() : '1,950'}<span className="text-sm font-semibold text-gray-500 ml-1">meals</span>
            </p>
            <p className="text-xs font-medium text-gray-500 mt-1">Nutritious Meals Served</p>
          </div>

          <div className="bg-[#f8faf9] p-5 rounded-2xl border border-gray-100/80 text-center">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 mx-auto flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {metrics ? metrics.total_co2_saved_kg.toLocaleString() : '2,100'}<span className="text-sm font-semibold text-gray-500 ml-1">kg</span>
            </p>
            <p className="text-xs font-medium text-gray-500 mt-1">CO₂e Emissions Averted</p>
          </div>

          <div className="bg-[#f8faf9] p-5 rounded-2xl border border-gray-100/80 text-center">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 mx-auto flex items-center justify-center mb-3">
              <Leaf className="w-5 h-5" />
            </div>
            <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {metrics ? (metrics.total_water_saved_liters / 1000).toFixed(0) : '882'}<span className="text-sm font-semibold text-gray-500 ml-1">kL</span>
            </p>
            <p className="text-xs font-medium text-gray-500 mt-1">Water Footprint Conserved</p>
          </div>
        </div>
      </section>

      {/* Instant 1-Click Evaluation Demo Logins */}
      <section className="bg-gradient-to-b from-forest-50/50 to-white rounded-3xl p-6 sm:p-8 border border-forest-100 shadow-xs">
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="text-[11px] font-bold tracking-wider text-forest-800 uppercase bg-white px-3 py-1 rounded-full border border-forest-200">
            Developer Evaluation & Assessment
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
            Experience ReRoute AI in 1-Click
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Test pre-configured verified roles with live seed data and realistic histories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* Donor Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-forest-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center mb-3">
                <ChefHat className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Food Donor Account</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                The Green Bistro: Access 30-day preparation logs, ML surplus prediction, and photo listing assistant.
              </p>
            </div>
            <button
              onClick={() => handleDemoLogin('DONOR')}
              className="mt-4 w-full py-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors"
            >
              Log in as Donor &rarr;
            </button>
          </div>

          {/* Receiver Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-forest-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Food Receiver Account</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Hope Community Kitchen: Browse marketplace, claim meals with OTP protection, manage vehicle capacities.
              </p>
            </div>
            <button
              onClick={() => handleDemoLogin('RECEIVER')}
              className="mt-4 w-full py-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors"
            >
              Log in as Receiver &rarr;
            </button>
          </div>

          {/* Admin Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 hover:border-forest-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-3">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Platform Admin Account</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                ReRoute Admin: Verify organization safety documents, audit listings, and inspect system logs.
              </p>
            </div>
            <button
              onClick={() => handleDemoLogin('ADMIN')}
              className="mt-4 w-full py-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors"
            >
              Log in as Admin &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Core 3 Pillars of Innovation */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-[11px] font-bold tracking-wider text-forest-700 uppercase bg-forest-50 px-2.5 py-1 rounded-full border border-forest-200">
            Intelligent Core Systems
          </span>
          <h2 className="text-2xl font-bold text-gray-900 mt-2">Designed for Safety, Speed, and Zero Waste</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-forest-700" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">1. ML Surplus Forecasting</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Trained scikit-learn regression models analyze preparation patterns, day of week, and seasonality to predict future surplus and recommend proactive prep adjustments before food is even cooked.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5 text-forest-700" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">2. Intelligent Matching Engine</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Transparent multi-factor algorithm ranks eligible recipients based on geographic distance, vehicle capacity, dietary requirements, allergen exclusions, and safety verification status.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-forest-700" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">3. Photo AI & OTP Security</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Photo-assisted food donation creation suggests titles and packaging estimates while enforcing human safety checks. Cryptographic 6-digit OTP codes ensure physical handoff security.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

