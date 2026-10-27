import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { AdminSummary, User } from '../types';
import { 
  ShieldAlert, Users, CheckCircle, XCircle, 
  ShoppingBag, Clock, FileCheck, AlertCircle 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [sumRes, usersRes] = await Promise.all([
        apiClient.get('/analytics/admin-summary/'),
        apiClient.get('/auth/admin/users/'),
      ]);
      setSummary(sumRes.data);
      setUsers(usersRes.data.results || usersRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerify = async (userId: number) => {
    setVerifyingId(userId);
    try {
      const res = await apiClient.post(`/auth/admin/users/${userId}/verify/`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_verified: res.data.is_verified } : u))
      );
    } catch (e) {
      alert('Failed to update verification status.');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2">
        <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
          Supervisory Management
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Platform Administration & Moderation Console
        </h1>
        <p className="text-xs text-gray-500">
          Moderate organization safety credentials, monitor marketplace transactions, and inspect platform health.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-gray-400">Loading admin oversight metrics...</div>
      ) : (
        <>
          {/* Key KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
              <p className="text-xs font-semibold text-gray-500">Total Registered Orgs</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{summary?.users.total_users || 0}</p>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                {summary?.users.donors} Donors &bull; {summary?.users.receivers} Receivers
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
              <p className="text-xs font-semibold text-gray-500">Active Listings</p>
              <p className="text-2xl font-black text-forest-700 mt-1">{summary?.donations.available || 0}</p>
              <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Open on Market</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
              <p className="text-xs font-semibold text-gray-500">In Progress / Claims</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{summary?.donations.in_progress || 0}</p>
              <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">Active Transport</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
              <p className="text-xs font-semibold text-gray-500">Completed Deliveries</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{summary?.donations.completed || 0}</p>
              <span className="text-[10px] text-forest-700 font-semibold mt-0.5 block">100% Diverted</span>
            </div>
          </div>

          {/* User Verification Moderation Table */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Organization Verification & Safety Approvals
                </h2>
                <p className="text-[11px] text-gray-400">
                  Verify commercial kitchens and registered NGOs before matching
                </p>
              </div>
              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-xl">
                {users.length} Organizations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8faf9] text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Organization Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Safety / Reg ID</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900">{u.organization_name || u.email}</p>
                        <span className="text-[10px] text-gray-400">{u.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-700 uppercase text-[10px] bg-gray-100 px-2 py-0.5 rounded">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-600">
                        {u.fssai_or_reg_number || 'Pending Submission'}
                      </td>
                      <td className="py-3 px-4">
                        {u.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Verified Safe
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleVerify(u.id)}
                          disabled={verifyingId === u.id}
                          className={`px-3 py-1 text-xs font-semibold rounded-xl transition-colors ${
                            u.is_verified
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-forest-700 text-white hover:bg-forest-800'
                          }`}
                        >
                          {verifyingId === u.id
                            ? 'Updating...'
                            : u.is_verified
                            ? 'Revoke Badge'
                            : 'Approve & Verify'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Claims Audit Log */}
          {summary?.recent_claims && summary.recent_claims.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-gray-900">Recent Platform Claims Audit Trail</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8faf9] text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                      <th className="py-3 px-4">Listing Title</th>
                      <th className="py-3 px-4">Donor Kitchen</th>
                      <th className="py-3 px-4">Claiming Recipient</th>
                      <th className="py-3 px-4">Claim Status</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.recent_claims.map((rc) => (
                      <tr key={rc.id} className="hover:bg-gray-50/60">
                        <td className="py-3 px-4 font-bold text-gray-900">{rc.donation_title}</td>
                        <td className="py-3 px-4 text-gray-600">{rc.donor}</td>
                        <td className="py-3 px-4 text-gray-800 font-medium">{rc.receiver}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-xs text-forest-800 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
                            {rc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-[11px]">
                          {new Date(rc.claimed_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

