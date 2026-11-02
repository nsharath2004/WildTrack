'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { Binoculars, Plus, Search, Edit2, Trash2, Calendar, MapPin } from 'lucide-react';

export default function SightingsPage() {
  const { hasRole, user } = useAuth();
  const [sightings, setSightings] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    animal_id: '',
    area_id: '',
    sighting_date: new Date().toISOString().substring(0, 10),
    sighting_time: new Date().toTimeString().substring(0, 5),
    latitude: '',
    longitude: '',
    location_description: '',
    observer_name: '',
    behavior_notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
     
const [sData, aData, arData] = await Promise.all([
  apiRequest<any[]>('/sightings').catch((err) => {
    console.error("Sightings API error:", err);
    return [];
  }),

  apiRequest<any[]>('/animals').catch((err) => {
    console.error("Animals API error:", err);
    return [];
  }),

  apiRequest<any[]>('/areas').catch((err) => {
    console.error("Protected Areas API error:", err);
    return [];
  }),
]);

setSightings(Array.isArray(sData) ? sData : []);
setAnimals(Array.isArray(aData) ? aData : []);
setAreas(Array.isArray(arData) ? arData : []);

      setSightings(Array.isArray(sData) ? sData : []);
      setAnimals(Array.isArray(aData) ? aData : []);
      setAreas(Array.isArray(arData) ? arData : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch sightings data');
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
      animal_id: animals[0]?.animal_id ? String(animals[0].animal_id) : '',
      area_id: areas[0]?.area_id ? String(areas[0].area_id) : '',
      sighting_date: new Date().toISOString().substring(0, 10),
      sighting_time: new Date().toTimeString().substring(0, 5),
      latitude: '11.6664',
      longitude: '76.6291',
      location_description: '',
      observer_name: user?.full_name || 'Forest Field Patrol',
      behavior_notes: 'Normal foraging behavior, healthy appearance.',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: any) => {
    setEditingId(s.sighting_id);
    setFormData({
      animal_id: s.animal_id ? String(s.animal_id) : '',
      area_id: s.area_id ? String(s.area_id) : '',
      sighting_date: s.sighting_date ? String(s.sighting_date).substring(0, 10) : '',
      sighting_time: s.sighting_time ? String(s.sighting_time).substring(0, 5) : '',
      latitude: s.latitude !== null ? String(s.latitude) : '',
      longitude: s.longitude !== null ? String(s.longitude) : '',
      location_description: s.location_description || '',
      observer_name: s.observer_name || '',
      behavior_notes: s.behavior_notes || '',
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
        animal_id: parseInt(formData.animal_id),
        area_id: parseInt(formData.area_id),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      if (editingId) {
        await apiRequest(`/sightings/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('Sighting record updated.');
      } else {
        await apiRequest('/sightings', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('New wildlife sighting recorded.');
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

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sighting record?')) return;
    try {
      await apiRequest(`/sightings/${id}`, { method: 'DELETE' });
      setSuccessMsg('Sighting removed.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = sightings.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (s.animal_name || '').toLowerCase().includes(q) ||
      (s.species_name || '').toLowerCase().includes(q) ||
      (s.observer_name || '').toLowerCase().includes(q) ||
      (s.location_description || '').toLowerCase().includes(q);
    const matchesArea = areaFilter === 'All' || String(s.area_id) === areaFilter;
    return matchesSearch && matchesArea;
  });

  const canManage = hasRole('Admin', 'Forest Officer', 'Researcher');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Wildlife Sightings & GPS Telemetry"
        subtitle="Field Observations, Spatial Coordinates, and Animal Behavioral Logs"
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
                placeholder="Search by animal, species, observer or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              <option value="All">All Protected Areas</option>
              {areas.map((a) => (
                <option key={a.area_id} value={String(a.area_id)}>
                  {a.area_name}
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
              <span>Record Sighting</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Animal</th>
                  <th className="py-3 px-5">Species</th>
                  <th className="py-3 px-5">Protected Area</th>
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5">GPS Coordinates</th>
                  <th className="py-3 px-5">Observer</th>
                  <th className="py-3 px-5">Behavior Notes</th>
                  {canManage && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Loading sightings...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No wildlife sightings found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.sighting_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900">
                        {s.animal_name || `Animal #${s.animal_id}`}
                      </td>
                      <td className="py-3.5 px-5 text-forest-700 font-medium">
                        {s.species_name || '—'}
                      </td>
                      <td className="py-3.5 px-5 text-gray-700">
                        {s.area_name || `Area #${s.area_id}`}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-600 font-mono">
                        {s.sighting_date ? String(s.sighting_date).substring(0, 10) : ''} {s.sighting_time || ''}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 font-mono">
                        {s.latitude && s.longitude ? `${s.latitude}, ${s.longitude}` : 'Manual Spot'}
                      </td>
                      <td className="py-3.5 px-5 text-gray-700 text-xs font-semibold">
                        {s.observer_name || 'Ranger'}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 max-w-xs truncate" title={s.behavior_notes}>
                        {s.behavior_notes || '—'}
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Sighting"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.sighting_id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Sighting"
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
          title={editingId ? 'Edit Sighting Observation' : 'Log Wildlife Sighting'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Save Changes' : 'Record Sighting'}
          isSubmitting={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Animal *</label>
              <select
                required
                value={formData.animal_id}
                onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">Select Tracked Animal</option>
                {animals.map((a) => (
                  <option key={a.animal_id} value={a.animal_id}>
                    {a.animal_name} ({a.species_name || 'Animal'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Protected Area *</label>
              <select
                required
                value={formData.area_id}
                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">Select Area</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sighting Date *</label>
              <input
                type="date"
                required
                value={formData.sighting_date}
                onChange={(e) => setFormData({ ...formData, sighting_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sighting Time</label>
              <input
                type="time"
                value={formData.sighting_time}
                onChange={(e) => setFormData({ ...formData, sighting_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">GPS Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g. 11.6664"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">GPS Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g. 76.6291"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Observer Name *</label>
              <input
                type="text"
                required
                value={formData.observer_name}
                onChange={(e) => setFormData({ ...formData, observer_name: e.target.value })}
                placeholder="e.g. Ranger Ramesh K."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Location Landmark</label>
              <input
                type="text"
                value={formData.location_description}
                onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                placeholder="e.g. Near Moyar River waterhole, Zone 2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Behavior & Health Notes</label>
              <textarea
                rows={2}
                value={formData.behavior_notes}
                onChange={(e) => setFormData({ ...formData, behavior_notes: e.target.value })}
                placeholder="Animal active, drinking water, no visible limp or injury..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
