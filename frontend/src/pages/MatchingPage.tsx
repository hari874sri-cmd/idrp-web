import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { FoodDonation, RecipientRecommendation } from '../types';
import { 
  HeartHandshake, Sparkles, MapPin, Clock, 
  ShieldCheck, ArrowRight, AlertCircle, Info, Scale 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MatchingPage: React.FC = () => {
  const [activeDonations, setActiveDonations] = useState<FoodDonation[]>([]);
  const [selectedDonationId, setSelectedDonationId] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<RecipientRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingLoading, setMatchingLoading] = useState(false);

  useEffect(() => {
    loadActiveListings();
  }, []);

  const loadActiveListings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/donations/listings/marketplace/');
      const items: FoodDonation[] = res.data.results || res.data || [];
      setActiveDonations(items);
      if (items.length > 0) {
        setSelectedDonationId(items[0].id);
        fetchMatchesForDonation(items[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchesForDonation = async (dId: number) => {
    setMatchingLoading(true);
    try {
      const res = await apiClient.get(`/matching/recommendations/?donation_id=${dId}`);
      setRecommendations(res.data.recommendations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleSelectDonation = (id: number) => {
    setSelectedDonationId(id);
    fetchMatchesForDonation(id);
  };

  const currentDonation = activeDonations.find((d) => d.id === selectedDonationId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
        <span className="text-[10px] uppercase font-bold text-forest-700 tracking-wider bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
          Algorithmic Redistribution Matching
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Intelligent Recipient Recommendation Engine
        </h1>
        <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
          Matches food donations to recipient organizations by evaluating geographic distance, daily storage capacity, category compatibility, and strict allergen safety constraints.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-gray-400">Loading active food listings...</div>
      ) : activeDonations.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 p-8 space-y-3">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No active marketplace food donations</h3>
          <p className="text-xs text-gray-500">Create a donation listing first to view recipient matches.</p>
          <Link
            to="/create-donation"
            className="inline-block px-4 py-2 bg-forest-700 text-white font-semibold text-xs rounded-xl"
          >
            Create Food Listing &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Active Listing Selector */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900">1. Select Food Batch to Match</h2>
            <div className="space-y-2.5">
              {activeDonations.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleSelectDonation(d.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs flex flex-col justify-between ${
                    selectedDonationId === d.id
                      ? 'border-forest-600 bg-forest-50/70 ring-2 ring-forest-600/20'
                      : 'border-gray-200 hover:border-gray-300 bg-[#f8faf9]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-forest-800 uppercase bg-white px-1.5 py-0.5 rounded border border-forest-200">
                      {d.category.name}
                    </span>
                    <span className="font-extrabold text-gray-900">
                      {d.quantity} {d.quantity_unit}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 mt-2 line-clamp-1">{d.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">By {d.donor.organization_name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Matching Recommendations List */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  2. Top Recommended Recipients for "{currentDonation?.title}"
                </h2>
                <p className="text-[11px] text-gray-400">
                  Ranked by multi-factor weighted compatibility score (0-100)
                </p>
              </div>
              <span className="text-xs font-bold text-forest-700 bg-forest-50 px-2.5 py-1 rounded-xl border border-forest-100">
                {recommendations.length} Matches Found
              </span>
            </div>

            {matchingLoading ? (
              <div className="py-16 text-center text-xs text-gray-400">Computing compatibility scores...</div>
            ) : recommendations.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                No eligible recipient matches meet safety & distance parameters for this listing.
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <div
                    key={rec.receiver_id}
                    className="p-5 rounded-2xl bg-[#f8faf9] border border-gray-100 hover:border-forest-200/80 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-forest-700 text-white font-extrabold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-gray-900">{rec.organization_name}</h3>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold">
                            {rec.organization_type} &bull; {rec.distance_km} km away
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                          {rec.overall_score}% Compatibility Match
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Factors Pill Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] pt-1">
                      <div className="bg-white p-2 rounded-xl border border-gray-100 text-center">
                        <span className="text-gray-400 block">Distance Score</span>
                        <span className="font-bold text-gray-900">{rec.breakdown.distance_score}%</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-gray-100 text-center">
                        <span className="text-gray-400 block">Capacity Match</span>
                        <span className="font-bold text-gray-900">{rec.breakdown.capacity_score}%</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-gray-100 text-center">
                        <span className="text-gray-400 block">Category Fit</span>
                        <span className="font-bold text-gray-900">{rec.breakdown.compatibility_score}%</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-gray-100 text-center">
                        <span className="text-gray-400 block">Transit Time</span>
                        <span className="font-bold text-forest-700">~{rec.estimated_transit_minutes} mins</span>
                      </div>
                    </div>

                    {/* AI Generated Rationale */}
                    <div className="p-3 bg-white rounded-xl border border-gray-100 text-xs text-gray-600 italic">
                      "{rec.generated_explanation}"
                    </div>

                    {/* Action link */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[11px] text-gray-500 font-medium">
                        Phone: {rec.phone || '+1 (555) 019-3001'} &bull; {rec.address}
                      </span>
                      <Link
                        to={`/donations/${currentDonation?.id}`}
                        className="text-forest-700 hover:text-forest-900 font-bold flex items-center gap-1"
                      >
                        <span>Dispatch to this Shelter</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

