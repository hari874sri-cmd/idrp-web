import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { FoodDonation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  PlusCircle, Sparkles, AlertCircle, Clock, 
  CheckCircle2, PackageCheck, Truck, ArrowRight, ShieldCheck 
} from 'lucide-react';

export const DonorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<FoodDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState<{ [id: number]: string }>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadMyDonations();
  }, []);

  const loadMyDonations = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/donations/listings/?my_listings=true');
      setDonations(res.data.results || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (donationId: number, newStatus: string, otp?: string) => {
    setActionLoading(donationId);
    setActionMessage(null);
    try {
      await apiClient.post(`/donations/listings/${donationId}/update_status/`, {
        status: newStatus,
        verification_code: otp,
      });
      setActionMessage(`Updated donation status to ${newStatus}.`);
      await loadMyDonations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingClaims = donations.filter((d) => d.status === 'REQUESTED');
  const readyForPickup = donations.filter((d) => d.status === 'READY_FOR_PICKUP');
  const activeAvailable = donations.filter((d) => d.status === 'AVAILABLE');
  const completed = donations.filter((d) => d.status === 'COMPLETED');

  const totalKg = donations.reduce((sum, d) => sum + (d.quantity || 0), 0);
  const totalMeals = donations.reduce((sum, d) => sum + (d.estimated_meals || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-forest-700 tracking-wider bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
            Donor Operations Hub
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            {user?.organization_name || 'Kitchen Dashboard'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage preparation surplus, review incoming shelter claims, and track pickups.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/forecast"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-forest-200 text-forest-800 hover:bg-forest-50 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Surplus Forecaster</span>
          </Link>
          <Link
            to="/create-donation"
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List Food Donation</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
          <p className="text-xs font-medium text-gray-500">Active Listings</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{activeAvailable.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Marketplace Live</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
          <p className="text-xs font-medium text-gray-500">Pending Requests</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingClaims.length}</p>
          <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">Needs Approval</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
          <p className="text-xs font-medium text-gray-500">Total Weight Diverted</p>
          <p className="text-2xl font-extrabold text-forest-700 mt-1">
            {totalKg.toFixed(1)} <span className="text-xs font-semibold text-gray-500">kg</span>
          </p>
          <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">All Time</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
          <p className="text-xs font-medium text-gray-500">Meals Donated</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {totalMeals} <span className="text-xs font-semibold text-gray-500">portions</span>
          </p>
          <span className="text-[10px] text-forest-600 font-semibold mt-0.5 block">Community Impact</span>
        </div>
      </div>

      {/* Urgent Claims Awaiting Donor Approval */}
      {pendingClaims.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="text-sm font-bold text-gray-900">
                Action Required: Incoming Claim Requests ({pendingClaims.length})
              </h2>
            </div>
            <span className="text-[11px] text-amber-700 font-medium">Review and approve to reserve items</span>
          </div>

          <div className="space-y-3">
            {pendingClaims.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-amber-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{item.title}</span>
                    <span className="text-xs text-gray-500 font-medium">({item.quantity} {item.quantity_unit})</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Claimed by: <span className="font-semibold text-gray-800">{item.active_claim?.receiver_name || 'Verified Shelter'}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Pickup Deadline: {new Date(item.pickup_window_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'ACCEPTED')}
                    disabled={actionLoading === item.id}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors"
                  >
                    Accept Claim
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'CANCELLED')}
                    disabled={actionLoading === item.id}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ready for Pickup & Physical OTP Verification Handoff */}
      {readyForPickup.length > 0 && (
        <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-700" />
            <h2 className="text-sm font-bold text-gray-900">
              Ready for Physical Pickup — OTP Verification Handoff
            </h2>
          </div>

          <div className="space-y-3">
            {readyForPickup.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs"
              >
                <div>
                  <h3 className="text-xs font-bold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Assigned Receiver: <span className="font-semibold text-gray-800">{item.active_claim?.receiver_name}</span>
                  </p>
                  <span className="text-[10px] text-gray-400 block mt-1">
                    Ask the driver for their 6-digit confirmation OTP code before handing over packages.
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otpInput[item.id] || ''}
                    onChange={(e) => setOtpInput({ ...otpInput, [item.id]: e.target.value })}
                    className="w-36 px-3 py-2 text-xs text-center tracking-widest font-mono font-bold rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    onClick={() => handleUpdateStatus(item.id, 'PICKED_UP', otpInput[item.id])}
                    disabled={actionLoading === item.id || !otpInput[item.id]}
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors disabled:opacity-50"
                  >
                    Confirm Handoff
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Listings Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">All Kitchen Donations & Listings</h2>
          <span className="text-xs text-gray-400">{donations.length} records</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading donation records...</div>
        ) : donations.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-xs text-gray-500">You haven't listed any food donations yet.</p>
            <Link
              to="/create-donation"
              className="inline-flex items-center gap-2 px-4 py-2 bg-forest-700 text-white text-xs font-semibold rounded-xl"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Your First Donation</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8faf9] text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Title & Category</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Pickup Window</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {donations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900 line-clamp-1">{d.title}</p>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">{d.category.name}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-800">
                      {d.quantity} {d.quantity_unit} (~{d.estimated_meals} meals)
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(d.pickup_window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &ndash;{' '}
                      {new Date(d.pickup_window_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {d.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleUpdateStatus(d.id, 'READY_FOR_PICKUP')}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-[11px]"
                          >
                            Mark Ready
                          </button>
                        )}
                        <Link
                          to={`/donations/${d.id}`}
                          className="px-2.5 py-1 text-forest-700 hover:text-forest-900 hover:bg-forest-50 font-semibold rounded-lg text-[11px]"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

