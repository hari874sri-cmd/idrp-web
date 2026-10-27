import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole, OrganizationType } from '../types';
import { Leaf, AlertCircle, ChefHat, Building2, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('DONOR');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationType, setOrganizationType] = useState<OrganizationType>('RESTAURANT');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('San Francisco');
  const [regNumber, setRegNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await register({
        email,
        password,
        password_confirm: passwordConfirm,
        role,
        organization_name: organizationName,
        organization_type: organizationType,
        phone,
        address,
        city,
        fssai_or_reg_number: regNumber,
        latitude: 37.7749,
        longitude: -122.4194,
      });
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data
        ? Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ')
        : 'Registration failed. Please check inputs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-forest-700 text-white flex items-center justify-center mx-auto shadow-xs">
            <Leaf className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Join ReRoute AI Network</h2>
          <p className="text-xs text-gray-500">Register as a Food Donor or Authorized Recipient</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Select Organization Role</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setRole('DONOR');
                setOrganizationType('RESTAURANT');
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                role === 'DONOR'
                  ? 'border-forest-600 bg-forest-50/60 ring-2 ring-forest-600/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                role === 'DONOR' ? 'bg-forest-700 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <ChefHat className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Food Donor</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                  Restaurant, Bakery, Supermarket, Corporate Canteen
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole('RECEIVER');
                setOrganizationType('COMMUNITY_KITCHEN');
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                role === 'RECEIVER'
                  ? 'border-forest-600 bg-forest-50/60 ring-2 ring-forest-600/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                role === 'RECEIVER' ? 'bg-forest-700 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Food Receiver</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                  NGO, Community Kitchen, Welfare Shelter, Food Bank
                </p>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Organization Name</label>
              <input
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="e.g. Hope Community Kitchen"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Organization Category</label>
              <select
                value={organizationType}
                onChange={(e) => setOrganizationType(e.target.value as OrganizationType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white"
              >
                {role === 'DONOR' ? (
                  <>
                    <option value="RESTAURANT">Restaurant / Cafe</option>
                    <option value="BAKERY">Artisan Bakery</option>
                    <option value="GROCERY">Grocery / Supermarket</option>
                    <option value="CANTEEN">University / Corporate Canteen</option>
                    <option value="OTHER">Other Food Enterprise</option>
                  </>
                ) : (
                  <>
                    <option value="COMMUNITY_KITCHEN">Community Kitchen</option>
                    <option value="NGO">NGO / Non-Profit Pantry</option>
                    <option value="SHELTER">Homeless / Welfare Shelter</option>
                    <option value="OTHER">Other Relief Org</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="director@organization.org"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Physical Street Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Ocean Street, Suite 400"
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Food Safety / NGO Registration ID (Optional for Demo)
            </label>
            <input
              type="text"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              placeholder="e.g. FSSAI-2024-912 or 501(c)(3) ID"
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Organization Profile...' : 'Complete Registration'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-forest-700 font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

