'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { Stethoscope, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function VeterinaryPage() {
  const { hasRole } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    animal_id: '',
    checkup_date: new Date().toISOString().substring(0, 10),
    diagnosis: '',
    treatment: '',
    medications: '',
    veterinarian_name: '',
    treatment_cost: '2500',
    followup_date: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vData, aData] = await Promise.all([
        apiRequest<any[]>('/veterinary').catch(() => []),
        apiRequest<any[]>('/animals').catch(() => []),
      ]);
      setRecords(Array.isArray(vData) ? vData : []);
      setAnimals(Array.isArray(aData) ? aData : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch veterinary records');
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
      checkup_date: new Date().toISOString().substring(0, 10),
      diagnosis: 'Dehydration & superficial paw laceration',
      treatment: 'Saline IV rehydration and wound dressing with antiseptic',
      medications: 'Enrofloxacin 100mg, Meloxicam 5ml',
      veterinarian_name: 'Dr. Priya Varma (Wildlife Vet)',
      treatment_cost: '4500',
      followup_date: '',
      notes: 'Animal responding well, will be monitored in holding pen.',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: any) => {
    setEditingId(r.record_id);
    setFormData({
      animal_id: r.animal_id ? String(r.animal_id) : '',
      checkup_date: r.checkup_date ? String(r.checkup_date).substring(0, 10) : '',
      diagnosis: r.diagnosis || '',
      treatment: r.treatment || '',
      medications: r.medications || '',
      veterinarian_name: r.veterinarian_name || '',
      treatment_cost: r.treatment_cost !== null ? String(r.treatment_cost) : '',
      followup_date: r.followup_date ? String(r.followup_date).substring(0, 10) : '',
      notes: r.notes || '',
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
        treatment_cost: formData.treatment_cost ? parseFloat(formData.treatment_cost) : 0,
        followup_date: formData.followup_date || null,
      };

      if (editingId) {
        await apiRequest(`/veterinary/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Medical record #${editingId} updated.`);
      } else {
        await apiRequest('/veterinary', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('Veterinary treatment documented.');
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
    if (!confirm('Are you sure you want to delete this clinical record?')) return;
    try {
      await apiRequest(`/veterinary/${id}`, { method: 'DELETE' });
      setSuccessMsg('Clinical record deleted.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = records.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      (r.animal_name || '').toLowerCase().includes(q) ||
      (r.veterinarian_name || '').toLowerCase().includes(q) ||
      (r.diagnosis || '').toLowerCase().includes(q) ||
      (r.medications || '').toLowerCase().includes(q)
    );
  });

  const canManage = hasRole('Admin', 'Forest Officer');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Veterinary Clinical Care & Medical Logs"
        subtitle="Health Diagnostics, Wildlife Surgeries, Vaccinations, and Rehabilitation Care"
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
              placeholder="Search animal, vet name, diagnosis, or meds..."
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
              <span>New Medical Entry</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Patient Animal</th>
                  <th className="py-3 px-5">Checkup Date</th>
                  <th className="py-3 px-5">Diagnosis</th>
                  <th className="py-3 px-5">Treatment Administered</th>
                  <th className="py-3 px-5">Attending Veterinarian</th>
                  <th className="py-3 px-5">Cost (INR)</th>
                  <th className="py-3 px-5">Next Follow-Up</th>
                  {canManage && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Loading clinical records...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No clinical entries recorded.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.record_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900">
                        {r.animal_name || `Animal #${r.animal_id}`}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-600 font-mono">
                        {r.checkup_date ? String(r.checkup_date).substring(0, 10) : '—'}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-rose-700 max-w-xs truncate" title={r.diagnosis}>
                        {r.diagnosis}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-700 max-w-xs truncate" title={r.treatment}>
                        {r.treatment}
                      </td>
                      <td className="py-3.5 px-5 text-xs font-semibold text-gray-800">
                        {r.veterinarian_name}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-gray-800 font-medium">
                        ₹{parseFloat(r.treatment_cost || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 font-mono">
                        {r.followup_date ? String(r.followup_date).substring(0, 10) : 'None'}
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
                            onClick={() => handleDelete(r.record_id)}
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
          title={editingId ? 'Edit Clinical Entry' : 'Log Veterinary Treatment'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Save Medical Record' : 'Record Treatment'}
          isSubmitting={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Patient Animal *</label>
              <select
                required
                value={formData.animal_id}
                onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">Select Animal</option>
                {animals.map((a) => (
                  <option key={a.animal_id} value={a.animal_id}>
                    {a.animal_name} ({a.species_name || 'Animal'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Checkup Date *</label>
              <input
                type="date"
                required
                value={formData.checkup_date}
                onChange={(e) => setFormData({ ...formData, checkup_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Diagnosis *</label>
              <input
                type="text"
                required
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="e.g. Compound fracture of left forelimb due to wire snare"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Treatment Performed *</label>
              <textarea
                rows={2}
                required
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                placeholder="Surgical debridement, bone pinning, antiseptic cast applied under general anesthesia..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Medications Prescribed</label>
              <input
                type="text"
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                placeholder="e.g. Amoxicillin 500mg, Tramadol 50mg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attending Veterinarian *</label>
              <input
                type="text"
                required
                value={formData.veterinarian_name}
                onChange={(e) => setFormData({ ...formData, veterinarian_name: e.target.value })}
                placeholder="e.g. Dr. Priya Varma"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Treatment Cost (₹)</label>
              <input
                type="number"
                step="50"
                value={formData.treatment_cost}
                onChange={(e) => setFormData({ ...formData, treatment_cost: e.target.value })}
                placeholder="4500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Follow-up Review Date</label>
              <input
                type="date"
                value={formData.followup_date}
                onChange={(e) => setFormData({ ...formData, followup_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
