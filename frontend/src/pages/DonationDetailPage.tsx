import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FoodDonation, RecipientRecommendation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MapComponent } from '../components/MapComponent';
import { 
  Clock, MapPin, ShieldCheck, AlertTriangle, 
  Sparkles, Truck, CheckCircle2, User, Key, Star, MessageSquare 
} from 'lucide-react';

export const DonationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [donation, setDonation] = useState<FoodDonation | null>(null);
  const [recommendations, setRecommendations] = useState<RecipientRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimNotes, setClaimNotes] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Feedback state
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackDone, setFeedbackDone] = useState(false);

  useEffect(() => {
    loadDonation();
  }, [id]);

  const loadDonation = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get(`/donations/listings/${id}/`);
      setDonation(res.data);

      // If user is donor or admin, load intelligent matching recommendations
      if (res.data.status === 'AVAILABLE') {
        try {
          const matchRes = await apiClient.get(`/matching/recommendations/?donation_id=${id}`);
          setRecommendations(matchRes.data.recommendations || []);
        } catch (e) {}
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to load donation details.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaiming(true);
    setErrorMessage(null);
    try {
      await apiClient.post(`/donations/listings/${id}/claim/`, {
        receiver_notes: claimNotes,
      });
      setShowClaimModal(false);
      await loadDonation();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to claim donation.');
    } finally {
      setClaiming(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string, otp?: string) => {
    setStatusUpdating(true);
    setErrorMessage(null);
    try {
      await apiClient.post(`/donations/listings/${id}/update_status/`, {
        status: newStatus,
        verification_code: otp,
      });
      await loadDonation();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to update donation status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    try {
      await apiClient.post(`/donations/listings/${id}/feedback/`, {
        rating,
        food_condition_rating: rating,
        punctuality_rating: rating,
        comment: feedbackComment,
      });
      setFeedbackDone(true);
      await loadDonation();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center text-xs text-gray-400">Loading donation details...</div>;
  }

  if (!donation) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-xs text-rose-600 font-semibold">{errorMessage || 'Donation not found.'}</p>
        <Link to="/marketplace" className="text-xs text-forest-700 underline">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const isDonor = user?.id === donation.donor.id;
  const isClaimReceiver = donation.claim && donation.claim.receiver.id === user?.id;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <Link to="/marketplace" className="hover:text-forest-700 font-medium">
          &larr; Back to Marketplace
        </Link>
        <span className="text-[11px] text-gray-400">Donation #{donation.id}</span>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Detail Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-forest-800 uppercase bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                {donation.category.name}
              </span>
              <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                Dietary: {donation.dietary_type}
              </span>
              <StatusBadge status={donation.status} size="sm" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
              {donation.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Prepared by <span className="font-semibold text-gray-800">{donation.donor.organization_name}</span> &bull; Listed {new Date(donation.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Quick Action Button */}
          <div>
            {donation.status === 'AVAILABLE' && user?.role === 'RECEIVER' && (
              <button
                onClick={() => setShowClaimModal(true)}
                className="px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Claim This Donation
              </button>
            )}

            {donation.status === 'AVAILABLE' && !isAuthenticated && (
              <Link
                to="/login"
                className="px-6 py-3 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors block text-center"
              >
                Log In to Claim
              </Link>
            )}
          </div>
        </div>

        {/* Core Specs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#f8faf9] rounded-2xl border border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400">Total Quantity</span>
            <p className="text-xl font-extrabold text-gray-900 mt-0.5">
              {donation.quantity} <span className="text-xs font-semibold text-gray-500">{donation.quantity_unit}</span>
            </p>
            <span className="text-[10px] text-forest-700 font-semibold block mt-0.5">
              ~{donation.estimated_meals} portions
            </span>
          </div>

          <div className="p-4 bg-[#f8faf9] rounded-2xl border border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400">Storage Condition</span>
            <p className="text-base font-bold text-gray-900 mt-1 uppercase">
              {donation.storage_condition}
            </p>
            {donation.storage_temperature_celsius !== undefined && (
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Held at: {donation.storage_temperature_celsius}°C
              </span>
            )}
          </div>

          <div className="p-4 bg-[#f8faf9] rounded-2xl border border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400">Pickup Window</span>
            <p className="text-xs font-bold text-gray-900 mt-1">
              {new Date(donation.pickup_window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &ndash;{' '}
              {new Date(donation.pickup_window_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <span className="text-[10px] text-gray-400 block mt-0.5">Strict safety window</span>
          </div>

          <div className="p-4 bg-[#f8faf9] rounded-2xl border border-gray-100">
            <span className="text-[10px] uppercase font-bold text-gray-400">Expiry Deadline</span>
            <p className="text-xs font-bold text-rose-700 mt-1">
              {new Date(donation.expiry_time).toLocaleDateString([], { month: 'short', day: 'numeric' })},{' '}
              {new Date(donation.expiry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <span className="text-[10px] text-gray-400 block mt-0.5">Safe consumption limit</span>
          </div>
        </div>

        {/* Description & Allergen Disclosures */}
        <div className="space-y-4 pt-2">
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
              Listing Description & Packaging Details
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
              {donation.description || 'No additional description provided.'}
            </p>
            {donation.packaging_details && (
              <p className="text-xs text-gray-500 mt-2">
                <span className="font-semibold text-gray-700">Packaging:</span> {donation.packaging_details}
              </p>
            )}
          </div>

          {donation.allergens && (
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Declared Allergens Warning:
              </span>
              <p className="font-medium text-amber-800">{donation.allergens}</p>
            </div>
          )}
        </div>

        {/* Pickup Location & Address */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-forest-700" />
            <h3 className="text-xs font-bold text-gray-900">Pickup Location</h3>
          </div>
          <p className="text-xs text-gray-600">{donation.pickup_address}</p>
          {donation.special_instructions && (
            <p className="text-[11px] text-gray-500 italic">
              Instructions: "{donation.special_instructions}"
            </p>
          )}

          {/* Embedded Leaflet Map */}
          {donation.latitude && donation.longitude && (
            <div className="h-64 w-full rounded-2xl overflow-hidden mt-3">
              <MapComponent
                donations={[donation]}
                center={[donation.latitude, donation.longitude]}
                zoom={14}
                selectedDonationId={donation.id}
              />
            </div>
          )}
        </div>
      </div>

      {/* Active Claim Handoff & OTP Details (Visible to Donor and Claiming Receiver) */}
      {donation.claim && (isDonor || isClaimReceiver || isAdmin) && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-indigo-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-700" />
              <h2 className="text-base font-bold text-gray-900">
                Redistribution Claim & Transit Progress
              </h2>
            </div>
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Claim #{donation.claim.id} &bull; {donation.claim.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
              <span className="text-[10px] uppercase font-bold text-indigo-600">Assigned Recipient</span>
              <p className="text-xs font-bold text-gray-900 mt-1">
                {donation.claim.receiver.organization_name || donation.claim.receiver.email}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">Phone: {donation.claim.receiver.phone}</p>
            </div>

            {/* OTP Code Card */}
            <div className="p-4 bg-forest-50/60 rounded-2xl border border-forest-100">
              <span className="text-[10px] uppercase font-bold text-forest-700">Pickup OTP Verification Code</span>
              <p className="text-2xl font-mono font-black tracking-widest text-forest-900 mt-1">
                {donation.claim.pickup_verification_code}
              </p>
              <span className="text-[10px] text-forest-700 block mt-0.5">
                {donation.claim.is_code_verified ? 'Verified on handoff' : 'Provide upon arrival'}
              </span>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] uppercase font-bold text-gray-500">Receiver Transit Notes</span>
              <p className="text-xs text-gray-700 mt-1">
                {donation.claim.receiver_notes || 'Standard transport dispatched.'}
              </p>
            </div>
          </div>

          {/* Donor Status Controls */}
          {isDonor && (
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
              {donation.status === 'REQUESTED' && (
                <button
                  onClick={() => handleUpdateStatus('ACCEPTED')}
                  disabled={statusUpdating}
                  className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl"
                >
                  Accept Recipient Claim
                </button>
              )}

              {donation.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleUpdateStatus('READY_FOR_PICKUP')}
                  disabled={statusUpdating}
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs rounded-xl"
                >
                  Mark Packages Ready for Pickup
                </button>
              )}

              {donation.status === 'READY_FOR_PICKUP' && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter Receiver OTP"
                    value={otpCodeInput}
                    onChange={(e) => setOtpCodeInput(e.target.value)}
                    className="w-36 px-3 py-2 text-xs font-mono font-bold tracking-widest text-center border rounded-xl"
                  />
                  <button
                    onClick={() => handleUpdateStatus('PICKED_UP', otpCodeInput)}
                    disabled={statusUpdating || !otpCodeInput}
                    className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl disabled:opacity-50"
                  >
                    Verify & Confirm Handoff
                  </button>
                </div>
              )}

              {donation.status === 'PICKED_UP' && (
                <button
                  onClick={() => handleUpdateStatus('COMPLETED')}
                  disabled={statusUpdating}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl"
                >
                  Confirm Redistribution Completed
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Intelligent Recipient Recommendations (Visible to Donor when Available) */}
      {donation.status === 'AVAILABLE' && (isDonor || isAdmin) && recommendations.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-900">
              AI Recipient Recommendations for this Batch
            </h2>
          </div>
          <p className="text-xs text-gray-500">
            Ranked by proximity distance, storage capacity, category compatibility, and allergen safety.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {recommendations.map((rec) => (
              <div
                key={rec.receiver_id}
                className="p-4 rounded-2xl bg-[#f8faf9] border border-gray-100 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{rec.organization_name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-forest-100 text-forest-800">
                      Score: {rec.overall_score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {rec.distance_km} km away &bull; Est. transit: {rec.estimated_transit_minutes} mins
                  </p>
                  <p className="text-xs text-gray-700 mt-2 italic bg-white p-2.5 rounded-xl border border-gray-100">
                    "{rec.generated_explanation}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mutual Feedback Section (When Completed) */}
      {donation.status === 'COMPLETED' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-900">Partnership Feedback & Ratings</h2>
          </div>

          {/* List Existing Feedbacks */}
          {donation.feedbacks && donation.feedbacks.length > 0 && (
            <div className="space-y-3">
              {donation.feedbacks.map((f) => (
                <div key={f.id} className="p-4 bg-gray-50 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{f.reviewer_name}</span>
                    <div className="flex text-amber-500 font-bold">
                      {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                    </div>
                  </div>
                  <p className="text-gray-600 mt-1">"{f.comment}"</p>
                </div>
              ))}
            </div>
          )}

          {/* Submit New Feedback */}
          {!feedbackDone && (
            <form onSubmit={handleFeedbackSubmit} className="pt-3 border-t border-gray-100 space-y-3 text-xs">
              <h4 className="font-bold text-gray-800">Submit Your Experience Rating</h4>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-600">Overall Rating:</span>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="px-2 py-1 border rounded-lg bg-white"
                >
                  <option value={5}>5 Stars - Outstanding</option>
                  <option value={4}>4 Stars - Very Good</option>
                  <option value={3}>3 Stars - Satisfactory</option>
                  <option value={2}>2 Stars - Needs Improvement</option>
                  <option value={1}>1 Star - Unsatisfactory</option>
                </select>
              </div>

              <textarea
                rows={2}
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                placeholder="Share feedback on food condition, packaging, and handoff punctuality..."
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-forest-600 text-xs"
              />

              <button
                type="submit"
                disabled={feedbackSubmitting}
                className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl text-xs"
              >
                {feedbackSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Claim Modal for Receivers */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">
              Claim "{donation.title}"
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Confirm your shelter will dispatch transport to pick up {donation.quantity}{donation.quantity_unit} before the deadline at{' '}
              {new Date(donation.pickup_window_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
            </p>

            <form onSubmit={handleClaimSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Driver / Vehicle Details (Optional)
                </label>
                <input
                  type="text"
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="e.g. Driver Alex in White Transit Van, arriving 14:30"
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-forest-600 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={claiming}
                  className="px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {claiming ? 'Reserving...' : 'Confirm Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

