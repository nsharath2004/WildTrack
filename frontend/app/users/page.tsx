'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { ShieldCheck, Plus, Search, Edit2, Trash2, ShieldAlert } from 'lucide-react';

export default function UsersPage() {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'Forest Officer',
    badge_number: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/auth/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasRole('Admin')) {
      fetchUsers();
    }
  }, [user]);

  if (!hasRole('Admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar title="User Access Control" subtitle="Role-Based Security" />
        <main className="flex-1 p-12 max-w-xl mx-auto flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Restricted Security Console</h2>
          <p className="text-sm text-gray-600 mb-4">
            User management and authentication credentials are reserved exclusively for accounts with the{' '}
            <strong className="text-forest-800">Admin</strong> role.
          </p>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-forest-700 text-white rounded-lg text-sm font-semibold hover:bg-forest-800 transition"
          >
            Return to Dashboard
          </a>
        </main>
      </div>
    );
  }

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      email: '',
      role: 'Forest Officer',
      badge_number: `FO-${Math.floor(1000 + Math.random() * 9000)}`,
      is_active: true,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setEditingId(u.user_id);
    setFormData({
      username: u.username || '',
      password: '',
      full_name: u.full_name || '',
      email: u.email || '',
      role: u.role || 'Forest Officer',
      badge_number: u.badge_number || '',
      is_active: !!u.is_active,
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (editingId) {
        await apiRequest(`/auth/users/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setSuccessMsg(`User account "${formData.username}" updated.`);
      } else {
        await apiRequest('/auth/users', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setSuccessMsg(`User account "${formData.username}" created with scrypt hashed credentials.`);
      }
      setIsModalOpen(false);
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, uname: string) => {
    if (uname === user?.username) {
      alert('Security violation: You cannot delete your own active administrator account.');
      return;
    }
    if (!confirm(`Are you sure you want to delete user account "${uname}"?`)) return;
    try {
      await apiRequest(`/auth/users/${id}`, { method: 'DELETE' });
      setSuccessMsg(`User "${uname}" removed.`);
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      (u.username || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.badge_number || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="User Access Control & Identity Management"
        subtitle="Role-Based Access Control (Admin, Researcher, Forest Officer) and Cryptographic JWT Sessions"
      />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium">
            {errorMsg}
          </div>
        )}

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search username, full name, or badge..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center space-x-2 bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Provision User Account</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Username</th>
                  <th className="py-3 px-5">Full Name</th>
                  <th className="py-3 px-5">Email</th>
                  <th className="py-3 px-5">System Role</th>
                  <th className="py-3 px-5">Badge / Credentials</th>
                  <th className="py-3 px-5">Account Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Loading user accounts...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.user_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold font-mono text-xs text-gray-900">
                        {u.username}
                      </td>
                      <td className="py-3.5 px-5 text-gray-800 font-medium">
                        {u.full_name}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-600 font-mono">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'Admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'Researcher'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 font-mono">
                        {u.badge_number || 'None'}
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge status={u.is_active ? 'Active' : 'Inactive'} />
                      </td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.user_id, u.username)}
                          disabled={u.username === user?.username}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit User Credentials & Roles' : 'Provision User Account'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Update Account' : 'Provision User'}
          isSubmitting={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                required
                disabled={!!editingId}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. officer_raj"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {editingId ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                type="password"
                required={!editingId}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="e.g. Officer Rajesh K."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. rajesh@wildtrack.org"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">System Role *</label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Forest Officer">Forest Officer (Field reports, Sightings, Incidents)</option>
                <option value="Researcher">Researcher (Wildlife census, Research projects, Observations)</option>
                <option value="Admin">Admin (Full administrative & schema privilege)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Badge / Officer ID</label>
              <input
                type="text"
                value={formData.badge_number}
                onChange={(e) => setFormData({ ...formData, badge_number: e.target.value })}
                placeholder="e.g. FO-4521"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
