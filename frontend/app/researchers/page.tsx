'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { Users2, Plus, Search, Edit2, Trash2, Mail, Phone, Building } from 'lucide-react';

export default function ResearchersPage() {
  const { hasRole } = useAuth();
  const [researchers, setResearchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    institution: '',
    specialization: 'Carnivore Ecology',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchResearchers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/researchers');
      setResearchers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch researchers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResearchers();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      institution: 'Wildlife Institute of India (WII)',
      specialization: 'Carnivore Ecology',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: any) => {
    setEditingId(r.researcher_id);
    setFormData({
      first_name: r.first_name || '',
      last_name: r.last_name || '',
      email: r.email || '',
      phone: r.phone || '',
      institution: r.institution || '',
      specialization: r.specialization || '',
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
        await apiRequest(`/researchers/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setSuccessMsg(`Researcher ${formData.first_name} ${formData.last_name} updated.`);
      } else {
        await apiRequest('/researchers', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setSuccessMsg(`Researcher ${formData.first_name} ${formData.last_name} added.`);
      }
      setIsModalOpen(false);
      fetchResearchers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete researcher "${name}"? Active research projects assigned to them may restrict deletion.`)) {
      return;
    }
    try {
      await apiRequest(`/researchers/${id}`, { method: 'DELETE' });
      setSuccessMsg(`Researcher "${name}" removed.`);
      fetchResearchers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = researchers.filter((r) => {
    const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
    const q = searchTerm.toLowerCase();
    return (
      fullName.includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.institution || '').toLowerCase().includes(q) ||
      (r.specialization || '').toLowerCase().includes(q)
    );
  });

  const canManage = hasRole('Admin', 'Researcher');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Wildlife Researchers & Scientists"
        subtitle="Principal Investigators, Wildlife Biologists, and Institutional Affiliations"
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
              placeholder="Search by researcher name, email, or institution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center space-x-2 bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Researcher</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Researcher Name</th>
                  <th className="py-3 px-5">Specialization</th>
                  <th className="py-3 px-5">Institution</th>
                  <th className="py-3 px-5">Email Address</th>
                  <th className="py-3 px-5">Contact Phone</th>
                  {canManage && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      Loading scientific researchers...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No researchers found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.researcher_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900">
                        {r.first_name} {r.last_name}
                      </td>
                      <td className="py-3.5 px-5 text-forest-700 font-medium">
                        {r.specialization}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">
                        {r.institution}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">
                        <span className="flex items-center space-x-1.5 text-xs text-gray-700">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{r.email}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 font-mono">
                        {r.phone || '—'}
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Record"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.researcher_id, `${r.first_name} ${r.last_name}`)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Record"
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
          title={editingId ? 'Edit Researcher Information' : 'Register New Research Scientist'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Save Changes' : 'Register Scientist'}
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
                placeholder="e.g. Rajesh"
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
                placeholder="e.g. Gopal"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. rgopal@wii.gov.in"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98450 12345"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Affiliated Institution *</label>
              <input
                type="text"
                required
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="e.g. Wildlife Institute of India"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scientific Specialization *</label>
              <input
                type="text"
                required
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Tiger Demography & GIS"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
