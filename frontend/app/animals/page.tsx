'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { PawPrint, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function AnimalsPage() {
  const { hasRole } = useAuth();
  const [animals, setAnimals] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [areaList, setAreaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    animal_name: '',
    species_id: '',
    area_id: '',
    gender: 'Male',
    age_years: '',
    health_status: 'Healthy',
    microchip_id: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [animData, spData, arData] = await Promise.all([
        apiRequest<any[]>('/animals').catch(() => []),
        apiRequest<any[]>('/species').catch(() => []),
        apiRequest<any[]>('/areas').catch((err) => {
    console.error("Protected Areas Error:", err);
    return [];
}),
      ]);
      setAnimals(Array.isArray(animData) ? animData : []);
      setSpeciesList(Array.isArray(spData) ? spData : []);
      setAreaList(Array.isArray(arData) ? arData : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch animal records');
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
      animal_name: '',
      species_id: speciesList[0]?.species_id ? String(speciesList[0].species_id) : '',
      area_id: areaList[0]?.area_id ? String(areaList[0].area_id) : '',
      gender: 'Male',
      age_years: '',
      health_status: 'Healthy',
      microchip_id: `RFID-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (a: any) => {
    setEditingId(a.animal_id);
    setFormData({
      animal_name: a.animal_name || '',
      species_id: a.species_id ? String(a.species_id) : '',
      area_id: a.area_id ? String(a.area_id) : '',
      gender: a.gender || 'Unknown',
      age_years: a.age_years !== null ? String(a.age_years) : '',
      health_status: a.health_status || 'Healthy',
      microchip_id: a.microchip_id || '',
      notes: a.notes || '',
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
        species_id: parseInt(formData.species_id),
        area_id: parseInt(formData.area_id),
        age_years: formData.age_years ? parseFloat(formData.age_years) : null,
      };

      if (editingId) {
        await apiRequest(`/animals/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Animal "${formData.animal_name}" updated successfully.`);
      } else {
        await apiRequest('/animals', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Animal "${formData.animal_name}" registered with automated DB trigger.`);
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
    if (!confirm(`Are you sure you want to delete animal "${name}"? The DBMS Trigger will archive it to deleted_animals_log.`)) {
      return;
    }
    try {
      await apiRequest(`/animals/${id}`, { method: 'DELETE' });
      setSuccessMsg(`Animal "${name}" deleted and archived.`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredAnimals = animals.filter((a) => {
    const matchesSearch =
      (a.animal_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.species_name || a.common_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.microchip_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || a.health_status === statusFilter;
    const matchesArea = areaFilter === 'All' || String(a.area_id) === areaFilter;
    return matchesSearch && matchesStatus && matchesArea;
  });

  const canManage = hasRole('Admin', 'Forest Officer');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Individual Animal Management"
        subtitle="Telemetry Tagging, Biometrics, Health Tracking, and Area Assignment"
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
                placeholder="Search by animal name, species, or RFID..."
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
              <option value="All">All Health Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Injured">Injured</option>
              <option value="Sick">Sick</option>
              <option value="Under Treatment">Under Treatment</option>
              <option value="Recovering">Recovering</option>
            </select>

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              <option value="All">All Protected Areas</option>
              {areaList.map((area) => (
                <option key={area.area_id} value={String(area.area_id)}>
                  {area.area_name}
                </option>
              ))}
            </select>
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center space-x-2 bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Register Animal</span>
            </button>
          )}
        </div>

        {/* Animals Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Animal Name</th>
                  <th className="py-3 px-5">Species</th>
                  <th className="py-3 px-5">Protected Area</th>
                  <th className="py-3 px-5">Gender</th>
                  <th className="py-3 px-5">Age</th>
                  <th className="py-3 px-5">Health Status</th>
                  <th className="py-3 px-5">Microchip / RFID</th>
                  {canManage && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Loading animal registry...
                    </td>
                  </tr>
                ) : filteredAnimals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No animal records found.
                    </td>
                  </tr>
                ) : (
                  filteredAnimals.map((a) => (
                    <tr key={a.animal_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900">
                        {a.animal_name}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-forest-700">
                        {a.species_name || a.common_name || `Species #${a.species_id}`}
                      </td>
                      <td className="py-3.5 px-5 text-gray-700">
                        {a.area_name || `Area #${a.area_id}`}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">
                        {a.gender}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">
                        {a.age_years !== null ? `${a.age_years} yrs` : '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge status={a.health_status} />
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-gray-500">
                        {a.microchip_id || 'None'}
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(a)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Animal"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.animal_id, a.animal_name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Animal"
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

        {/* Modal Form */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit Animal Record' : 'Register Individual Animal'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Save Changes' : 'Register Record'}
          isSubmitting={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Animal Tag/Name *
              </label>
              <input
                type="text"
                required
                value={formData.animal_name}
                onChange={(e) => setFormData({ ...formData, animal_name: e.target.value })}
                placeholder="e.g. Maya (T-15)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Species *
              </label>
              <select
                required
                value={formData.species_id}
                onChange={(e) => setFormData({ ...formData, species_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">Select Species</option>
                {speciesList.map((sp) => (
                  <option key={sp.species_id} value={sp.species_id}>
                    {sp.common_name} ({sp.category})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Protected Area Reserve *
              </label>
              <select
                required
                value={formData.area_id}
                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">Select Protected Area</option>
                {areaList.map((area) => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.area_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Estimated Age (Years)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.age_years}
                onChange={(e) => setFormData({ ...formData, age_years: e.target.value })}
                placeholder="e.g. 5.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Health Status *
              </label>
              <select
                value={formData.health_status}
                onChange={(e) => setFormData({ ...formData, health_status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Healthy">Healthy</option>
                <option value="Injured">Injured</option>
                <option value="Sick">Sick</option>
                <option value="Under Treatment">Under Treatment</option>
                <option value="Recovering">Recovering</option>
                <option value="Deceased">Deceased</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Microchip / Telemetry RFID
              </label>
              <input
                type="text"
                value={formData.microchip_id}
                onChange={(e) => setFormData({ ...formData, microchip_id: e.target.value })}
                placeholder="e.g. RFID-982144"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Field Notes & Markings
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Distinguishing stripe pattern, ear notch, GPS collar model..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
