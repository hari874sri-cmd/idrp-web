import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { CategoryForecast, FoodCategory, DailyForecast } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { 
  Sparkles, TrendingUp, AlertCircle, PlusCircle, 
  CheckCircle2, Lightbulb, BarChart2, ShieldCheck, ChevronRight 
} from 'lucide-react';

export const ForecastingPage: React.FC = () => {
  const [forecasts, setForecasts] = useState<CategoryForecast[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [disclaimer, setDisclaimer] = useState<string>('');

  // Log new record modal
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDate, setLogDate] = useState(new Date().toISOString().slice(0, 10));
  const [logPrepared, setLogPrepared] = useState<number>(120);
  const [logServed, setLogServed] = useState<number>(105);
  const [logSurplusKg, setLogSurplusKg] = useState<number>(6.5);
  const [logNotes, setLogNotes] = useState('Dinner shift buffet surplus');
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/forecasting/predict/?days=7');
      const data = res.data.forecasts || [];
      setForecasts(data);
      setDisclaimer(res.data.disclaimer || '');
      if (data.length > 0 && selectedCatId === null) {
        setSelectedCatId(data[0].category_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogSubmitting(true);
    try {
      await apiClient.post('/forecasting/records/', {
        category: selectedCatId || 1,
        date: logDate,
        meals_prepared: Number(logPrepared),
        meals_served: Number(logServed),
        surplus_quantity: Number(logSurplusKg),
        surplus_portions: Math.max(1, Number(logPrepared) - Number(logServed)),
        notes: logNotes,
      });
      setShowLogModal(false);
      setLogSuccess(true);
      setTimeout(() => setLogSuccess(false), 4000);
      await loadForecasts();
    } catch (err: any) {
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save record.');
    } finally {
      setLogSubmitting(false);
    }
  };

  const currentForecast = forecasts.find((f) => f.category_id === selectedCatId) || forecasts[0];

  // Prepare chart data with uncertainty upper and lower bands
  const chartData = currentForecast
    ? currentForecast.daily_forecasts.map((d) => ({
        day: d.day_name.slice(0, 3) + ' ' + d.date.slice(5),
        predicted_kg: d.predicted_surplus_kg,
        lower_bound: d.uncertainty_lower_kg,
        upper_bound: d.uncertainty_upper_kg,
        confidence: d.confidence * 100,
      }))
    : [];

  // Top contributing factors
  const topFactors = currentForecast && currentForecast.daily_forecasts.length > 0
    ? Object.entries(currentForecast.daily_forecasts[0].top_factors || {}).map(([key, val]) => ({
        factor: key === 'is_weekend' ? 'Weekend Surge' : key === 'meals_prepared' ? 'Batch Volume' : key === 'day_of_week' ? 'Day of Week' : key,
        weight: Math.round(Number(val) * 100),
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-forest-700 tracking-wider bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
            Predictive Analytics & Prevention
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            AI Food Surplus Forecasting Engine
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Machine learning regression models project kitchen surplus 7 days in advance to optimize batch cooking.
          </p>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log Daily Kitchen Prep Record</span>
        </button>
      </div>

      {logSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Kitchen preparation record logged successfully! Model updated.</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-xs text-gray-400">Loading AI surplus projections...</div>
      ) : forecasts.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 p-8 space-y-3">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No category forecast data available</h3>
          <p className="text-xs text-gray-500">Log at least one food preparation entry to initialize models.</p>
        </div>
      ) : (
        <>
          {/* Category Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {forecasts.map((f) => (
              <button
                key={f.category_id}
                onClick={() => setSelectedCatId(f.category_id)}
                className={`px-4 py-2 rounded-2xl font-semibold shrink-0 transition-all flex items-center gap-2 ${
                  f.category_id === currentForecast?.category_id
                    ? 'bg-forest-700 text-white shadow-xs'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/80'
                }`}
              >
                <span>{f.category_name}</span>
                {f.is_ml_trained ? (
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold ${
                    f.category_id === currentForecast?.category_id ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    ML Trained
                  </span>
                ) : (
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold ${
                    f.category_id === currentForecast?.category_id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Baseline
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Model Status Badge Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-forest-600" />
              <div>
                <span className="font-bold text-gray-900">Current Forecasting Model: </span>
                <span className="text-forest-700 font-semibold">
                  {currentForecast.is_ml_trained
                    ? 'Scikit-Learn Random Forest Regressor (Trained ML)'
                    : 'Baseline Heuristic (Insufficient Historical Samples)'}
                </span>
              </div>
            </div>
            <span className="text-[11px] text-gray-500 font-medium">
              Training Samples: <strong className="text-gray-900">{currentForecast.sample_count} records</strong> (Min 8 required for ML)
            </span>
          </div>

          {/* Forecast Chart & Factors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 7-Day Area Chart */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    7-Day Projected Surplus Curve ({currentForecast.category_name})
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    Expected surplus quantity in kg with 95% confidence uncertainty band
                  </p>
                </div>
                <span className="text-xs font-bold text-forest-700 bg-forest-50 px-2.5 py-1 rounded-xl border border-forest-100">
                  Avg: {(chartData.reduce((acc, c) => acc + c.predicted_kg, 0) / (chartData.length || 1)).toFixed(1)} kg/day
                </span>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="predictedSurplus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#15803d" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="uncertaintyBand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#86efac" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#86efac" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit=" kg" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="upper_bound"
                      stroke="#86efac"
                      strokeDasharray="4 4"
                      fillOpacity={1}
                      fill="url(#uncertaintyBand)"
                      name="Upper Uncertainty Band (kg)"
                    />
                    <Area
                      type="monotone"
                      dataKey="predicted_kg"
                      stroke="#15803d"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#predictedSurplus)"
                      name="Projected Surplus (kg)"
                    />
                    <Area
                      type="monotone"
                      dataKey="lower_bound"
                      stroke="#86efac"
                      strokeDasharray="4 4"
                      fillOpacity={0}
                      name="Lower Uncertainty Band (kg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-forest-700 inline-block" /> Mean Predicted Surplus
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-forest-300 border-dashed inline-block" /> 95% Confidence Bounds
                </span>
              </div>
            </div>

            {/* Feature Importance & Contributing Factors */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Contributing Forecast Factors</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Feature importances extracted from the regression model
                </p>

                <div className="space-y-3.5 mt-4">
                  {topFactors.map((f) => (
                    <div key={f.factor} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                        <span>{f.factor}</span>
                        <span>{f.weight}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-forest-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${f.weight}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Suggestions */}
              <div className="p-4 bg-forest-50/70 border border-forest-100 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-forest-900">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Actionable Waste-Reduction Suggestions</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1.5 pl-1">
                  {currentForecast.waste_reduction_tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 leading-snug">
                      <span className="text-forest-700 font-bold shrink-0">&bull;</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Log Kitchen Preparation Record Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Log Daily Kitchen Food Preparation</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Feeding daily preparation and surplus records improves the scikit-learn ML forecasting accuracy.
            </p>

            <form onSubmit={handleLogRecord} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Meals Prepared</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={logPrepared}
                    onChange={(e) => setLogPrepared(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Meals Consumed/Sold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={logServed}
                    onChange={(e) => setLogServed(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Surplus Quantity (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  value={logSurplusKg}
                  onChange={(e) => setLogSurplusKg(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Shift Notes</label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="e.g. Rainy day lunch buffet, slightly lower foot traffic"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={logSubmitting}
                  className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl shadow-xs"
                >
                  {logSubmitting ? 'Saving...' : 'Save Record & Retrain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

