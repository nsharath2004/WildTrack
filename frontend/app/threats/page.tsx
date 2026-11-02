'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { AlertTriangle, Plus, Search, Edit2, Trash2, Zap } from 'lucide-react';

export default function ThreatsPage() {
  const { hasRole } = useAuth();
  const [threats, setThreats] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    threat_type: 'Poaching',
    severity: 'High',
    area_id: '',
    species_id: '',
    reported_date: new Date().toISOString().substring(0, 10),
    status: 'Active',
    location: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tData, arData, spData] = await Promise.all([
        apiRequest<any[]>('/threats').catch(() => []),
        apiRequest<any[]>('/protected-areas').catch(() => []),
        apiRequest<any[]>('/species').catch(() => []),
      ]);
      setThreats(Array.isArray(tData) ? tData : []);
      setAreas(Array.isArray(arData) ? arData : []);
      setSpeciesList(Array.isArray(spData) ? spData : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch threats');
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
      threat_type: 'Poaching',
      severity: 'High',
      area_id: areas[0]?.area_id ? String(areas[0].area_id) : '',
      species_id: '',
      reported_date: new Date().toISOString().substring(0, 10),
      status: 'Active',
      location: '',
      description: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: any) => {
    setEditingId(t.threat_id);
    setFormData({
      threat_type: t.threat_type || 'Poaching',
      severity: t.severity || 'Medium',
      area_id: t.area_id ? String(t.area_id) : '',
      species_id: t.species_id ? String(t.species_id) : '',
      reported_date: t.reported_date ? String(t.reported_date).substring(0, 10) : '',
      status: t.status || 'Active',
      location: t.location || '',
      description: t.description || '',
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
        species_id: formData.species_id ? parseInt(formData.species_id) : null,
      };

      if (editingId) {
        await apiRequest(`/threats/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Threat #${editingId} updated.`);
      } else {
        await apiRequest('/threats', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(
          formData.severity === 'Critical'
            ? 'Critical threat recorded! DBMS Trigger automatically created an Incident report.'
            : 'Threat report logged successfully.'
        );
      }
      setIsModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this threat record?')) return;
    try {
      await apiRequest(`/threats/${id}`, { method: 'DELETE' });
      setSuccessMsg('Threat record removed.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = threats.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (t.threat_type || '').toLowerCase().includes(q) ||
      (t.location || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.area_name || '').toLowerCase().includes(q);
    const matchesSev = severityFilter === 'All' || t.severity === severityFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesSev && matchesStatus;
  });

  const canManage = hasRole('Admin', 'Forest Officer');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Threat & Vulnerability Management"
        subtitle="Poaching Risks, Human-Wildlife Conflict, Encroachment, and DBMS Auto-Dispatch Triggers"
      />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* DBMS Trigger Notice */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>DBMS Trigger Active:</strong> Any threat logged with{' '}
              <span className="font-bold underline text-red-700">Critical</span> severity automatically triggers the
              MySQL procedure <code className="font-mono bg-amber-100 px-1 rounded">after_threat_insert</code> to spawn
              an investigation in the Incidents module.
            </span>
          </div>
        </div>

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
                placeholder="Search threat type, location, or area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-forest-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Resolved">Resolved</option>
              <option value="Under Assessment">Under Assessment</option>
            </select>
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center space-x-2 bg-rose-700 hover:bg-rose-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Report Threat</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Threat Type</th>
                  <th className="py-3 px-5">Severity</th>
                  <th className="py-3 px-5">Protected Area</th>
                  <th className="py-3 px-5">Target Species</th>
                  <th className="py-3 px-5">Reported Date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Description</th>
                  {canManage && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Loading threats...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No threats recorded matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.threat_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900">
                        {t.threat_type}
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge status={t.severity} />
                      </td>
                      <td className="py-3.5 px-5 text-gray-700">
                        {t.area_name || `Area #${t.area_id}`}
                      </td>
                      <td className="py-3.5 px-5 text-forest-700 font-medium">
                        {t.species_name || 'Ecosystem Wide'}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-600 font-mono">
                        {t.reported_date ? String(t.reported_date).substring(0, 10) : '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge status={t.status} />
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 max-w-xs truncate" title={t.description}>
                        {t.description || '—'}
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Threat"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.threat_id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Threat"
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
          title={editingId ? 'Edit Threat Report' : 'File Wildlife Threat Advisory'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Save Changes' : 'Submit Threat Advisory'}
          isSubmitting={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Threat Classification *</label>
              <select
                required
                value={formData.threat_type}
                onChange={(e) => setFormData({ ...formData, threat_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Poaching">Poaching</option>
                <option value="Habitat Loss">Habitat Loss</option>
                <option value="Human-Wildlife Conflict">Human-Wildlife Conflict</option>
                <option value="Disease Outbreak">Disease Outbreak</option>
                <option value="Forest Fire">Forest Fire</option>
                <option value="Invasive Species">Invasive Species</option>
                <option value="Pollution">Pollution</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Severity Level *</label>
              <select
                required
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Critical">Critical (Triggers Auto Incident Creation)</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
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
                <option value="">Select Affected Reserve</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Vulnerable Species</label>
              <select
                value={formData.species_id}
                onChange={(e) => setFormData({ ...formData, species_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">General Ecosystem / Multiple</option>
                {speciesList.map((sp) => (
                  <option key={sp.species_id} value={sp.species_id}>
                    {sp.common_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reported Date *</label>
              <input
                type="date"
                required
                value={formData.reported_date}
                onChange={(e) => setFormData({ ...formData, reported_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Current Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Active">Active</option>
                <option value="Mitigated">Mitigated</option>
                <option value="Resolved">Resolved</option>
                <option value="Under Assessment">Under Assessment</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Specific Location / Sector</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Northern boundary wire fence, beat 4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Description *</label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Wire snares detected, vehicle tracks near river crossing..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
