'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { TreePine, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function ProtectedAreasPage() {
  const { hasRole } = useAuth();
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    area_name: '',
    category: 'National Park',
    location: '',
    area_size_km2: '',
    established_year: '',
    contact_number: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/protected-areas');
      setAreas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch protected areas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      area_name: '',
      category: 'National Park',
      location: '',
      area_size_km2: '',
      established_year: '1974',
      contact_number: '',
      description: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (a: any) => {
    setEditingId(a.area_id);
    setFormData({
      area_name: a.area_name || '',
      category: a.category || 'National Park',
      location: a.location || '',
      area_size_km2: a.area_size_km2 !== null ? String(a.area_size_km2) : '',
      established_year: a.established_year ? String(a.established_year) : '',
      contact_number: a.contact_number || '',
      description: a.description || '',
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
        area_size_km2: parseFloat(formData.area_size_km2),
        established_year: formData.established_year ? parseInt(formData.established_year) : null,
      };

      if (editingId) {
        await apiRequest(`/protected-areas/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Protected Area "${formData.area_name}" updated.`);
      } else {
        await apiRequest('/protected-areas', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Protected Area "${formData.area_name}" registered.`);
      }
      setIsModalOpen(false);
      fetchAreas();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? If animals or sightings are linked, foreign key constraints will protect integrity.`)) {
      return;
    }
    try {
      await apiRequest(`/protected-areas/${id}`, { method: 'DELETE' });
      setSuccessMsg(`Protected Area "${name}" deleted.`);
      fetchAreas();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredAreas = areas.filter((a) => {
    const matchesSearch =
      (a.area_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const canManage = hasRole('Admin', 'Forest Officer');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Protected Area Management"
        subtitle="National Parks, Wildlife Sanctuaries, Tiger Reserves, and Biome Polygons"
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

        {/* Toolbar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search area name or state location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              <option value="All">All Area Categories</option>
              <option value="National Park">National Park</option>
              <option value="Wildlife Sanctuary">Wildlife Sanctuary</option>
              <option value="Tiger Reserve">Tiger Reserve</option>
              <option value="Biosphere Reserve">Biosphere Reserve</option>
              <option value="Elephant Reserve">Elephant Reserve</option>
            </select>
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center space-x-2 bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Protected Area</span>
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Area Name</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Location</th>
                  <th className="py-3 px-5">Size (sq km)</th>
                  <th className="py-3 px-5">Established</th>
                  <th className="py-3 px-5">Contact</th>
                  {canManage && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Loading protected areas...
                    </td>
                  </tr>
                ) : filteredAreas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No protected areas found.
                    </td>
                  </tr>
                ) : (
                  filteredAreas.map((a) => (
                    <tr key={a.area_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900">
                        {a.area_name}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-1 bg-forest-50 border border-forest-200 text-forest-800 rounded-md text-xs font-semibold">
                          {a.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-gray-700">
                        {a.location}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-gray-800">
                        {parseFloat(a.area_size_km2 || 0).toLocaleString()} km²
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">
                        {a.established_year || '—'}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 font-mono">
                        {a.contact_number || '—'}
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(a)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Area"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.area_id, a.area_name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Area"
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
          title={editingId ? 'Edit Protected Area' : 'Register New Protected Reserve'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Save Changes' : 'Register Reserve'}
          isSubmitting={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Protected Area Name *
              </label>
              <input
                type="text"
                required
                value={formData.area_name}
                onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                placeholder="e.g. Bandipur National Park"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="National Park">National Park</option>
                <option value="Wildlife Sanctuary">Wildlife Sanctuary</option>
                <option value="Tiger Reserve">Tiger Reserve</option>
                <option value="Biosphere Reserve">Biosphere Reserve</option>
                <option value="Elephant Reserve">Elephant Reserve</option>
                <option value="Conservation Reserve">Conservation Reserve</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Location (State / Region) *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Karnataka, India"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Area Size (km²) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={formData.area_size_km2}
                onChange={(e) => setFormData({ ...formData, area_size_km2: e.target.value })}
                placeholder="e.g. 874.20"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Established Year
              </label>
              <input
                type="number"
                min="1850"
                max="2030"
                value={formData.established_year}
                onChange={(e) => setFormData({ ...formData, established_year: e.target.value })}
                placeholder="e.g. 1974"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Contact Hotline / Warden Email
              </label>
              <input
                type="text"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                placeholder="e.g. +91 821 2480901"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reserve Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Part of Nilgiri Biosphere Reserve, rich dry deciduous forest with high tiger density..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
