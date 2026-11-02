'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { Bug, Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';

export default function SpeciesPage() {
  const { hasRole } = useAuth();
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    common_name: '',
    scientific_name: '',
    category: 'Mammal',
    conservation_status: 'Endangered',
    population_trend: 'Decreasing',
    habitat_description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchSpecies = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>('/species');
      setSpeciesList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch species list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecies();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      common_name: '',
      scientific_name: '',
      category: 'Mammal',
      conservation_status: 'Endangered',
      population_trend: 'Decreasing',
      habitat_description: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (sp: any) => {
    setEditingId(sp.species_id);
    setFormData({
      common_name: sp.common_name,
      scientific_name: sp.scientific_name,
      category: sp.category,
      conservation_status: sp.conservation_status,
      population_trend: sp.population_trend || 'Unknown',
      habitat_description: sp.habitat_description || '',
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
        await apiRequest(`/species/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setSuccessMsg(`Species "${formData.common_name}" updated successfully.`);
      } else {
        await apiRequest('/species', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setSuccessMsg(`New species "${formData.common_name}" created.`);
      }
      setIsModalOpen(false);
      fetchSpecies();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete species "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiRequest(`/species/${id}`, { method: 'DELETE' });
      setSuccessMsg(`Species "${name}" deleted.`);
      fetchSpecies();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredSpecies = speciesList.filter((sp) => {
    const matchesSearch =
      sp.common_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sp.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || sp.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || sp.conservation_status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const canManage = hasRole('Admin', 'Researcher');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Species Management"
        subtitle="Biological Taxonomy, IUCN Conservation Status, and Population Trends"
      />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Alerts */}
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

        {/* Action Header & Search */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search common or scientific name..."
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
              <option value="All">All Categories</option>
              <option value="Mammal">Mammal</option>
              <option value="Bird">Bird</option>
              <option value="Reptile">Reptile</option>
              <option value="Amphibian">Amphibian</option>
              <option value="Fish">Fish</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              <option value="All">All Conservation Statuses</option>
              <option value="Critically Endangered">Critically Endangered</option>
              <option value="Endangered">Endangered</option>
              <option value="Vulnerable">Vulnerable</option>
              <option value="Near Threatened">Near Threatened</option>
              <option value="Least Concern">Least Concern</option>
            </select>
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center space-x-2 bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Species</span>
            </button>
          )}
        </div>

        {/* Species Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Common Name</th>
                  <th className="py-3 px-5">Scientific Name</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">IUCN Status</th>
                  <th className="py-3 px-5">Population Trend</th>
                  <th className="py-3 px-5">Habitat</th>
                  {canManage && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Loading species records...
                    </td>
                  </tr>
                ) : filteredSpecies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No species found matching query criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSpecies.map((sp) => (
                    <tr key={sp.species_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900">
                        {sp.common_name}
                      </td>
                      <td className="py-3.5 px-5 italic text-gray-600">
                        {sp.scientific_name}
                      </td>
                      <td className="py-3.5 px-5 text-gray-700">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">
                          {sp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge status={sp.conservation_status} />
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-600 font-medium">
                        {sp.population_trend || 'Unknown'}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 max-w-xs truncate" title={sp.habitat_description}>
                        {sp.habitat_description || '—'}
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(sp)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Species"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sp.species_id, sp.common_name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Species"
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

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit Species Record' : 'Register New Wildlife Species'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Save Changes' : 'Create Species'}
          isSubmitting={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Common Name *
              </label>
              <input
                type="text"
                required
                value={formData.common_name}
                onChange={(e) => setFormData({ ...formData, common_name: e.target.value })}
                placeholder="e.g. Bengal Tiger"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Scientific Name *
              </label>
              <input
                type="text"
                required
                value={formData.scientific_name}
                onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                placeholder="e.g. Panthera tigris tigris"
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
                <option value="Mammal">Mammal</option>
                <option value="Bird">Bird</option>
                <option value="Reptile">Reptile</option>
                <option value="Amphibian">Amphibian</option>
                <option value="Fish">Fish</option>
                <option value="Invertebrate">Invertebrate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Conservation Status *
              </label>
              <select
                value={formData.conservation_status}
                onChange={(e) => setFormData({ ...formData, conservation_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Critically Endangered">Critically Endangered</option>
                <option value="Endangered">Endangered</option>
                <option value="Vulnerable">Vulnerable</option>
                <option value="Near Threatened">Near Threatened</option>
                <option value="Least Concern">Least Concern</option>
                <option value="Extinct in the Wild">Extinct in the Wild</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Population Trend
              </label>
              <select
                value={formData.population_trend}
                onChange={(e) => setFormData({ ...formData, population_trend: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Increasing">Increasing</option>
                <option value="Decreasing">Decreasing</option>
                <option value="Stable">Stable</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Habitat & Ecological Description
              </label>
              <textarea
                rows={3}
                value={formData.habitat_description}
                onChange={(e) => setFormData({ ...formData, habitat_description: e.target.value })}
                placeholder="Describe native biome, tropical deciduous forests, wetlands, elevation..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
