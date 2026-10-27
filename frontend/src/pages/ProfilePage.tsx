import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { 
  Building2, ShieldCheck, Clock, MapPin, 
  Truck, CheckCircle2, AlertCircle, Save 
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshCurrentUser } = useAuth();

  const [description, setDescription] = useState(user?.profile?.description || '');
  const [operatingHours, setOperatingHours] = useState(user?.profile?.operating_hours || '08:00 - 21:00');
  const [contactPerson, setContactPerson] = useState(user?.profile?.contact_person || '');
  const [vehicleTypes, setVehicleTypes] = useState(user?.profile?.vehicle_types || 'Van, Cargo Bike');
  
  // Storage & capacity
  const [storageRef, setStorageRef] = useState(user?.profile?.storage_refrigerated_kg || 50);
  const [storageDry, setStorageDry] = useState(user?.profile?.storage_dry_kg || 100);
  const [servingCapacity, setServingCapacity] = useState(user?.profile?.serving_capacity_meals || 150);

  // Receiver preferences
  const [maxDistance, setMaxDistance] = useState(user?.preferences?.max_pickup_distance_km || 15);
  const [dailyCapacity, setDailyCapacity] = useState(user?.preferences?.daily_capacity_kg || 150);
  const [allergensExclude, setAllergensExclude] = useState(user?.preferences?.allergens_to_exclude || '');
  const [vegOnly, setVegOnly] = useState(user?.preferences?.dietary_vegetarian_only || false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);
    try {
      await apiClient.patch('/auth/profile/', {
        description,
        operating_hours: operatingHours,
        contact_person: contactPerson,
        vehicle_types: vehicleTypes,
        storage_refrigerated_kg: Number(storageRef),
        storage_dry_kg: Number(storageDry),
        serving_capacity_meals: Number(servingCapacity),
      });

      if (user?.role === 'RECEIVER') {
        await apiClient.patch('/auth/preferences/', {
          max_pickup_distance_km: Number(maxDistance),
          daily_capacity_kg: Number(dailyCapacity),
          allergens_to_exclude: allergensExclude,
          dietary_vegetarian_only: vegOnly,
        });
      }

      await refreshCurrentUser();
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (e) {
      alert('Failed to save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-forest-700 tracking-wider bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
            Organization Profile
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
            {user?.organization_name || user?.email}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Role: <strong className="text-forest-700">{user?.role}</strong> &bull; {user?.city}
          </p>
        </div>

        {user?.is_verified ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified Safe Organization
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold">
            Verification Pending Review
          </span>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Organization settings saved successfully!</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6 text-xs">
        <h2 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
          General Organization Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Organization Mission & Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell other network participants about your enterprise and food safety operations..."
              className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-forest-600 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Operating / Pickup Hours</label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                placeholder="e.g. 08:00 - 22:00"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Key Contact Person / Coordinator</label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Chef Marco / Shelter Manager Sarah"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Storage and Logistics */}
        <h2 className="text-sm font-bold text-gray-900 pt-4 pb-2 border-b border-gray-100">
          Storage Capacities & Transport
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Refrigerated Storage (kg)</label>
            <input
              type="number"
              value={storageRef}
              onChange={(e) => setStorageRef(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Dry / Ambient Storage (kg)</label>
            <input
              type="number"
              value={storageDry}
              onChange={(e) => setStorageDry(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Daily Meal Capacity</label>
            <input
              type="number"
              value={servingCapacity}
              onChange={(e) => setServingCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-gray-700 mb-1">Dedicated Transit Vehicles</label>
          <input
            type="text"
            value={vehicleTypes}
            onChange={(e) => setVehicleTypes(e.target.value)}
            placeholder="e.g. Temperature-Controlled Van, Cargo E-Bike"
            className="w-full px-3 py-2 border rounded-xl"
          />
        </div>

        {/* Receiver Specific Preferences */}
        {user?.role === 'RECEIVER' && (
          <>
            <h2 className="text-sm font-bold text-gray-900 pt-4 pb-2 border-b border-gray-100">
              Recipient Matching Criteria
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Max Pickup Radius (km)</label>
                <input
                  type="number"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Daily Intake Capacity (kg)</label>
                <input
                  type="number"
                  value={dailyCapacity}
                  onChange={(e) => setDailyCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Allergens to Strictly Avoid (Comma Separated)
              </label>
              <input
                type="text"
                value={allergensExclude}
                onChange={(e) => setAllergensExclude(e.target.value)}
                placeholder="e.g. Peanuts, Shellfish (AI matching will exclude matches with these)"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={vegOnly}
                onChange={(e) => setVegOnly(e.target.checked)}
                className="rounded text-forest-700 w-4 h-4"
              />
              <span className="font-semibold text-gray-800">
                Vegetarian Only (Do not recommend meat or poultry surplus)
              </span>
            </label>
          </>
        )}

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

