'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { HeartHandshake, Plus, Search, Edit2, Trash2, Mail, Phone } from 'lucide-react';

export default function VolunteersPage() {
  const { hasRole } = useAuth();
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    area_id: '',
    role: 'Patrol Assistant',
    join_date: new Date().toISOString().substring(0, 10),
    status: 'Active',
    skills: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vData, arData] = await Promise.all([
        apiRequest<any[]>('/volunteers').catch(() => []),
        apiRequest<any[]>('/protected-areas').catch(() => []),
      ]);
      setVolunteers(Array.isArray(vData) ? vData : []);
      setAreas(Array.isArray(arData) ? arData : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch volunteer roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      area_id: areas[0]?.area_id ? String(areas[0].area_id) : '',
      role: 'Patrol Assistant',
      join_date: new Date().toISOString().substring(0, 10),
      status: 'Active',
      skills: 'GPS Navigation, First Aid, Wildlife Photography',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (v: any) => {
    setEditingId(v.volunteer_id);
    setFormData({
      first_name: v.first_name || '',
      last_name: v.last_name || '',
      email: v.email || '',
      phone: v.phone || '',
      area_id: v.area_id ? String(v.area_id) : '',
      role: v.role || 'General Volunteer',
      join_date: v.join_date ? String(v.join_date).substring(0, 10) : '',
      status: v.status || 'Active',
      skills: v.skills || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        ...formData,
        area_id: formData.area_id ? parseInt(formData.area_id) : null,
      };

      if (editingId) {
        await apiRequest(`/volunteers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Volunteer ${formData.first_name} ${formData.last_name} updated.`);
      } else {
        await apiRequest('/volunteers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Volunteer ${formData.first_name} ${formData.last_name} inducted.`);
      }
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove volunteer "${name}"?`)) return;
    try {
      await apiRequest(`/volunteers/${id}`, { method: 'DELETE' });
      setSuccessMsg('Volunteer record removed.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = volunteers.filter((v) => {
    const q = searchTerm.toLowerCase();
    const fullName = `${v.first_name} ${v.last_name}`.toLowerCase();
    const matchesSearch =
      fullName.includes(q) ||
      (v.email || '').toLowerCase().includes(q) ||
      (v.role || '').toLowerCase().includes(q) ||
      (v.skills || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canManage = hasRole('Admin', 'Forest Officer');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Volunteer Corps & Community Engagement"
        subtitle="Citizen Science, Eco-Watch Volunteers, Reserve Assignments, and Skill Profiles"
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
          <div className="flex-1 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search volunteer name, email, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              <option value="All">All Volunteer Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center space-x-2 bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Volunteer</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Volunteer Name</th>
                  <th className="py-3 px-5">Designated Role</th>
                  <th className="py-3 px-5">Assigned Sanctuary</th>
                  <th className="py-3 px-5">Email</th>
                  <th className="py-3 px-5">Specialized Skills</th>
                  <th className="py-3 px-5">Status</th>
                  {canManage && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Loading volunteer corps...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No volunteers found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => (
                    <tr key={v.volunteer_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900">
                        {v.first_name} {v.last_name}
                      </td>
                      <td className="py-3.5 px-5 text-forest-700 font-medium">
                        {v.role}
                      </td>
                      <td className="py-3.5 px-5 text-gray-700">
                        {v.area_name || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">
                        <span className="flex items-center space-x-1.5 text-xs text-gray-700">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{v.email}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 max-w-xs truncate" title={v.skills}>
                        {v.skills || 'General duties'}
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge status={v.status} />
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Volunteer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.volunteer_id, `${v.first_name} ${v.last_name}`)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove Volunteer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
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
          title={editingId ? 'Edit Volunteer Assignment' : 'Enroll Conservation Volunteer'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Save Changes' : 'Enroll Volunteer'}
          isSubmitting={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="e.g. Ananya"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="e.g. Hegde"
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
                placeholder="e.g. ananya.hegde@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 99801 54321"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Reserve</label>
              <select
                value={formData.area_id}
                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">Unassigned</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Designated Role *</label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. Patrol Assistant, Bird Census Lead"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Skills & Certifications</label>
              <textarea
                rows={2}
                value={formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                placeholder="Wilderness First Responder, Photography, GIS mapping..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
