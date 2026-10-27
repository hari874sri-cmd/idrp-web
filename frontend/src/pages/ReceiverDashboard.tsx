import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { FoodDonation } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { 
  ShoppingBag, Sparkles, Truck, CheckCircle2, 
  MapPin, Clock, Key, ArrowRight, ShieldCheck, HeartHandshake 
} from 'lucide-react';

export const ReceiverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [claimedDonations, setClaimedDonations] = useState<FoodDonation[]>([]);
  const [availableFeed, setAvailableFeed] = useState<FoodDonation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [myRes, marketplaceRes] = await Promise.all([
        apiClient.get('/donations/listings/?my_listings=true'),
        apiClient.get('/donations/listings/marketplace/'),
      ]);
      setClaimedDonations(myRes.data.results || myRes.data || []);
      setAvailableFeed((marketplaceRes.data.results || marketplaceRes.data || []).slice(0, 4));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeClaims = claimedDonations.filter((d) => 
    ['REQUESTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'PICKED_UP'].includes(d.status)
  );
  const completedClaims = claimedDonations.filter((d) => d.status === 'COMPLETED');

  const claimedKgToday = claimedDonations.reduce((acc, d) => acc + (d.quantity || 0), 0);
  const dailyCapacityKg = user?.preferences?.daily_capacity_kg || 250;
  const capacityPct = Math.min(100, Math.round((claimedKgToday / dailyCapacityKg) * 100));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Receiver Logistics Desk
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            {user?.organization_name || 'Community Receiver Hub'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Monitor incoming pickups, view verification OTP keys, and claim fresh surplus meals.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/matching"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-forest-200 text-forest-800 hover:bg-forest-50 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Recipient Matches</span>
          </Link>
          <Link
            to="/marketplace"
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Food Marketplace</span>
          </Link>
        </div>
      </div>

      {/* Daily Capacity Progress & Verification Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Capacity Bar Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-900">Today's Redistribution Intake</p>
              <p className="text-[11px] text-gray-500">Based on your shelter kitchen daily intake capacity</p>
            </div>
            <span className="text-xs font-extrabold text-forest-700">
              {claimedKgToday.toFixed(1)} / {dailyCapacityKg} kg ({capacityPct}%)
            </span>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-forest-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${capacityPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>0 kg</span>
            <span>Recommended safe storage threshold</span>
            <span>{dailyCapacityKg} kg Max</span>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-forest-600" />
              <p className="text-xs font-bold text-gray-900">Verification & Safety</p>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Status: <span className="font-semibold text-emerald-700">Certified Community Receiver</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              FSSAI / Reg: {user?.fssai_or_reg_number || 'NGO-501C3-Verified'}
            </p>
          </div>

          <span className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-100 block">
            Operating: {user?.profile?.operating_hours || '09:00 - 21:00'}
          </span>
        </div>
      </div>

      {/* Prominent Active Pickups & Verification Codes Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-forest-700" />
            <h2 className="text-sm font-bold text-gray-900">
              Active Claimed Donations & Pickup OTP Codes ({activeClaims.length})
            </h2>
          </div>
          <span className="text-xs text-gray-400">Present OTP to donor kitchen upon arrival</span>
        </div>

        {activeClaims.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400 bg-[#f8faf9] rounded-2xl border border-gray-100">
            No active claims in progress. Browse the marketplace to claim available food batches.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeClaims.map((item) => (
              <div
                key={item.id}
                className="bg-[#f8faf9] p-4 rounded-2xl border border-gray-200/80 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-gray-900 line-clamp-1">{item.title}</h3>
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                  <p className="text-xs font-medium text-gray-600 mt-1">
                    Donor: {item.donor.organization_name || item.donor.email}
                  </p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span>{item.pickup_address}</span>
                  </p>
                </div>

                {/* OTP Pass Card */}
                {item.claim && (
                  <div className="p-3 bg-white rounded-xl border border-forest-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Driver Pickup OTP
                      </span>
                      <p className="font-mono text-lg font-black tracking-widest text-forest-800">
                        {item.claim.pickup_verification_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">Pickup Deadline</span>
                      <span className="text-xs font-bold text-gray-800">
                        {new Date(item.pickup_window_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800">
                    {item.quantity} {item.quantity_unit} (~{item.estimated_meals} meals)
                  </span>
                  <Link
                    to={`/donations/${item.id}`}
                    className="text-xs text-forest-700 hover:text-forest-900 font-semibold"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fresh Nearby Food Feed */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-forest-700" />
            <h2 className="text-sm font-bold text-gray-900">Available Nearby Food Ready for Claim</h2>
          </div>
          <Link to="/marketplace" className="text-xs text-forest-700 font-semibold hover:underline">
            View All ({availableFeed.length}+) &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableFeed.map((item) => (
            <Link
              key={item.id}
              to={`/donations/${item.id}`}
              className="bg-[#f8faf9] hover:bg-forest-50/40 p-4 rounded-2xl border border-gray-100 hover:border-forest-200 transition-all flex flex-col justify-between group"
            >
              <div>
                <span className="text-[10px] font-bold text-forest-700 uppercase bg-forest-100/80 px-1.5 py-0.5 rounded">
                  {item.category.name}
                </span>
                <h3 className="font-bold text-gray-900 text-xs mt-2 line-clamp-2 group-hover:text-forest-800 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                  {item.donor.organization_name}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs font-semibold">
                <span className="text-gray-900">{item.quantity} {item.quantity_unit}</span>
                <span className="text-forest-700 group-hover:translate-x-0.5 transition-transform">
                  Claim &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

