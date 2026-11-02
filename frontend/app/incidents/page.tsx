'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { Siren, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function IncidentsPage() {
  const { hasRole, user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [threats, setThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    incident_type: 'Poaching Attempt',
    threat_id: '',
    animal_id: '',
    area_id: '',
    incident_date: new Date().toISOString().substring(0, 10),
    status: 'Open',
    reported_by: '',
    action_taken: '',
    resolution_notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [iData, arData, anData, thData] = await Promise.all([
        apiRequest<any[]>('/incidents').catch(() => []),
        apiRequest<any[]>('/protected-areas').catch(() => []),
        apiRequest<any[]>('/animals').catch(() => []),
        apiRequest<any[]>('/threats').catch(() => []),
      ]);
      setIncidents(Array.isArray(iData) ? iData : []);
      setAreas(Array.isArray(arData) ? arData : []);
      setAnimals(Array.isArray(anData) ? anData : []);
      setThreats(Array.isArray(thData) ? thData : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch incident reports');
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
      incident_type: 'Poaching Attempt',
      threat_id: '',
      animal_id: '',
      area_id: areas[0]?.area_id ? String(areas[0].area_id) : '',
      incident_date: new Date().toISOString().substring(0, 10),
      status: 'Open',
      reported_by: user?.full_name || 'Forest Field Warden',
      action_taken: '',
      resolution_notes: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (inc: any) => {
    setEditingId(inc.incident_id);
    setFormData({
      incident_type: inc.incident_type || 'Other',
      threat_id: inc.threat_id ? String(inc.threat_id) : '',
      animal_id: inc.animal_id ? String(inc.animal_id) : '',
      area_id: inc.area_id ? String(inc.area_id) : '',
      incident_date: inc.incident_date ? String(inc.incident_date).substring(0, 10) : '',
      status: inc.status || 'Open',
      reported_by: inc.reported_by || '',
      action_taken: inc.action_taken || '',
      resolution_notes: inc.resolution_notes || '',
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
        area_id: parseInt(formData.area_id),
        threat_id: formData.threat_id ? parseInt(formData.threat_id) : null,
        animal_id: formData.animal_id ? parseInt(formData.animal_id) : null,
      };

      if (editingId) {
        await apiRequest(`/incidents/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Incident #${editingId} status updated.`);
      } else {
        await apiRequest('/incidents', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('New incident file opened.');
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
    if (!confirm('Are you sure you want to delete this incident dossier?')) return;
    try {
      await apiRequest(`/incidents/${id}`, { method: 'DELETE' });
      setSuccessMsg('Incident record removed.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = incidents.filter((i) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (i.incident_type || '').toLowerCase().includes(q) ||
      (i.reported_by || '').toLowerCase().includes(q) ||
      (i.action_taken || '').toLowerCase().includes(q) ||
      (i.area_name || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
    const matchesType = typeFilter === 'All' || i.incident_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const canManage = hasRole('Admin', 'Forest Officer');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Incident Response & Investigation"
        subtitle="Enforcement Actions, Wildlife Casualties, Forest Fire Outbreaks, and Resolution Logs"
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
                placeholder="Search incident type, reported by, or action..."
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
              <option value="All">All Incident Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              <option value="All">All Incident Types</option>
              <option value="Poaching Attempt">Poaching Attempt</option>
              <option value="Animal Injury">Animal Injury</option>
              <option value="Animal Mortality">Animal Mortality</option>
              <option value="Human Casualty">Human Casualty</option>
              <option value="Crop Raiding">Crop Raiding</option>
              <option value="Wildfire">Wildfire</option>
              <option value="Encroachment">Encroachment</option>
            </select>
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center space-x-2 bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Log Incident</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Incident Type</th>
                  <th className="py-3 px-5">Protected Area</th>
                  <th className="py-3 px-5">Involved Animal</th>
                  <th className="py-3 px-5">Incident Date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Reported By</th>
                  <th className="py-3 px-5">Action Taken</th>
                  {canManage && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Loading incident dossiers...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No incidents matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((i) => (
                    <tr key={i.incident_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900">
                        {i.incident_type}
                      </td>
                      <td className="py-3.5 px-5 text-gray-700">
                        {i.area_name || `Area #${i.area_id}`}
                      </td>
                      <td className="py-3.5 px-5 text-forest-700 font-medium">
                        {i.animal_name || 'N/A'}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-600 font-mono">
                        {i.incident_date ? String(i.incident_date).substring(0, 10) : '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge status={i.status} />
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-700 font-semibold">
                        {i.reported_by}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 max-w-xs truncate" title={i.action_taken}>
                        {i.action_taken || 'Under assessment'}
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(i)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Update Investigation"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(i.incident_id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Dossier"
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
          title={editingId ? 'Update Incident Investigation' : 'Log New Wildlife Incident'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Save Investigation' : 'Submit Incident Report'}
          isSubmitting={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Incident Classification *</label>
              <select
                required
                value={formData.incident_type}
                onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Poaching Attempt">Poaching Attempt</option>
                <option value="Animal Injury">Animal Injury</option>
                <option value="Animal Mortality">Animal Mortality</option>
                <option value="Human Casualty">Human Casualty</option>
                <option value="Crop Raiding">Crop Raiding</option>
                <option value="Wildfire">Wildfire</option>
                <option value="Encroachment">Encroachment</option>
                <option value="Other">Other</option>
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
                <option value="">Select Reserve Location</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Involved Animal (if applicable)</label>
              <select
                value={formData.animal_id}
                onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">None / Not an individual animal</option>
                {animals.map((a) => (
                  <option key={a.animal_id} value={a.animal_id}>
                    {a.animal_name} ({a.species_name || 'Animal'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Linked Threat Record</label>
              <select
                value={formData.threat_id}
                onChange={(e) => setFormData({ ...formData, threat_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">None / Independent Incident</option>
                {threats.map((t) => (
                  <option key={t.threat_id} value={t.threat_id}>
                    #{t.threat_id} - {t.threat_type} ({t.severity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Occurrence *</label>
              <input
                type="date"
                required
                value={formData.incident_date}
                onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Case Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Open">Open</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reported By *</label>
              <input
                type="text"
                required
                value={formData.reported_by}
                onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                placeholder="e.g. Special Tiger Protection Force (STPF) Unit B"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Intervention / Action Taken</label>
              <textarea
                rows={2}
                value={formData.action_taken}
                onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                placeholder="Patrol dispatched, perimeter secured, snare dismantled..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Resolution & Case Closeout Notes</label>
              <textarea
                rows={2}
                value={formData.resolution_notes}
                onChange={(e) => setFormData({ ...formData, resolution_notes: e.target.value })}
                placeholder="Perpetrators apprehended, animal relocated to transit sanctuary..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
