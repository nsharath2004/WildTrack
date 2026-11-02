'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { FileSpreadsheet, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function ResearchPage() {
  const { hasRole } = useAuth();
  const [researchList, setResearchList] = useState<any[]>([]);
  const [researchers, setResearchers] = useState<any[]>([]);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [areaList, setAreaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    researcher_id: '',
    species_id: '',
    area_id: '',
    start_date: new Date().toISOString().substring(0, 10),
    end_date: '',
    budget: '',
    status: 'Active',
    findings_summary: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, rData, spData, arData] = await Promise.all([
        apiRequest<any[]>('/research').catch(() => []),
        apiRequest<any[]>('/researchers').catch(() => []),
        apiRequest<any[]>('/species').catch(() => []),
        apiRequest<any[]>('/protected-areas').catch(() => []),
      ]);
      setResearchList(Array.isArray(resData) ? resData : []);
      setResearchers(Array.isArray(rData) ? rData : []);
      setSpeciesList(Array.isArray(spData) ? spData : []);
      setAreaList(Array.isArray(arData) ? arData : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load research projects');
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
      title: '',
      researcher_id: researchers[0]?.researcher_id ? String(researchers[0].researcher_id) : '',
      species_id: '',
      area_id: '',
      start_date: new Date().toISOString().substring(0, 10),
      end_date: '',
      budget: '500000',
      status: 'Active',
      findings_summary: '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (r: any) => {
    setEditingId(r.research_id);
    setFormData({
      title: r.title || '',
      researcher_id: r.researcher_id ? String(r.researcher_id) : '',
      species_id: r.species_id ? String(r.species_id) : '',
      area_id: r.area_id ? String(r.area_id) : '',
      start_date: r.start_date ? String(r.start_date).substring(0, 10) : '',
      end_date: r.end_date ? String(r.end_date).substring(0, 10) : '',
      budget: r.budget !== null ? String(r.budget) : '',
      status: r.status || 'Active',
      findings_summary: r.findings_summary || '',
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
        researcher_id: parseInt(formData.researcher_id),
        species_id: formData.species_id ? parseInt(formData.species_id) : null,
        area_id: formData.area_id ? parseInt(formData.area_id) : null,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        end_date: formData.end_date || null,
      };

      if (editingId) {
        await apiRequest(`/research/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Research "${formData.title}" updated.`);
      } else {
        await apiRequest('/research', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Research project "${formData.title}" created.`);
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

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete research project "${title}"?`)) {
      return;
    }
    try {
      await apiRequest(`/research/${id}`, { method: 'DELETE' });
      setSuccessMsg(`Project deleted.`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = researchList.filter((r) => {
    const matchesSearch =
      (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.researcher_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canManage = hasRole('Admin', 'Researcher');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Research Projects & Studies"
        subtitle="Scientific Investigations, Ecological Fieldwork, and Grant Budgets"
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
                placeholder="Search project title or researcher..."
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
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Proposed">Proposed</option>
              <option value="Completed">Completed</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center space-x-2 bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>New Research Project</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Project Title</th>
                  <th className="py-3 px-5">Lead Researcher</th>
                  <th className="py-3 px-5">Focus Species</th>
                  <th className="py-3 px-5">Protected Area</th>
                  <th className="py-3 px-5">Budget (INR)</th>
                  <th className="py-3 px-5">Status</th>
                  {canManage && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Loading research projects...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No research studies found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.research_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-gray-900 max-w-sm">
                        {r.title}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-forest-700">
                        {r.researcher_name || `Researcher #${r.researcher_id}`}
                      </td>
                      <td className="py-3.5 px-5 text-gray-700">
                        {r.species_name || 'Multi-species'}
                      </td>
                      <td className="py-3.5 px-5 text-gray-600">
                        {r.area_name || 'Landscape-level'}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-gray-800 font-medium">
                        ₹{parseFloat(r.budget || 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge status={r.status} />
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-5 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(r)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Project"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.research_id, r.title)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Project"
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
          title={editingId ? 'Edit Research Project' : 'Initiate New Research Study'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Save Changes' : 'Create Project'}
          isSubmitting={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Study Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Camera Trap Density Estimation of Tigers in Bandipur"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Researcher *</label>
              <select
                required
                value={formData.researcher_id}
                onChange={(e) => setFormData({ ...formData, researcher_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">Select Researcher</option>
                {researchers.map((r) => (
                  <option key={r.researcher_id} value={r.researcher_id}>
                    {r.first_name} {r.last_name} ({r.specialization})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Species</label>
              <select
                value={formData.species_id}
                onChange={(e) => setFormData({ ...formData, species_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">All / Multi-species</option>
                {speciesList.map((sp) => (
                  <option key={sp.species_id} value={sp.species_id}>
                    {sp.common_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Protected Area</label>
              <select
                value={formData.area_id}
                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">Landscape level / Statewide</option>
                {areaList.map((a) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Allocated Budget (₹)</label>
              <input
                type="number"
                step="1000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="500000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Active">Active</option>
                <option value="Proposed">Proposed</option>
                <option value="Completed">Completed</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Research Methodology & Objectives</label>
              <textarea
                rows={2}
                value={formData.findings_summary}
                onChange={(e) => setFormData({ ...formData, findings_summary: e.target.value })}
                placeholder="Summary of methodology, sampling grid size, and preliminary findings..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
