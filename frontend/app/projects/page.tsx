'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import Badge from '@/components/Badge';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { FolderKanban, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function ProjectsPage() {
  const { hasRole } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    project_name: '',
    description: '',
    area_id: '',
    start_date: new Date().toISOString().substring(0, 10),
    end_date: '',
    budget: '1500000',
    spent_amount: '350000',
    status: 'Active',
    project_lead: '',
    funding_source: 'National Tiger Conservation Authority (NTCA)',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pData, arData] = await Promise.all([
        apiRequest<any[]>('/projects').catch(() => []),
        apiRequest<any[]>('/protected-areas').catch(() => []),
      ]);
      setProjects(Array.isArray(pData) ? pData : []);
      setAreas(Array.isArray(arData) ? arData : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch conservation projects');
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
      project_name: '',
      description: '',
      area_id: areas[0]?.area_id ? String(areas[0].area_id) : '',
      start_date: new Date().toISOString().substring(0, 10),
      end_date: '',
      budget: '2500000',
      spent_amount: '400000',
      status: 'Active',
      project_lead: 'Dr. Ramesh K.',
      funding_source: 'MoEFCC / Project Tiger',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingId(p.project_id);
    setFormData({
      project_name: p.project_name || '',
      description: p.description || '',
      area_id: p.area_id ? String(p.area_id) : '',
      start_date: p.start_date ? String(p.start_date).substring(0, 10) : '',
      end_date: p.end_date ? String(p.end_date).substring(0, 10) : '',
      budget: p.budget !== null ? String(p.budget) : '',
      spent_amount: p.spent_amount !== null ? String(p.spent_amount) : '',
      status: p.status || 'Active',
      project_lead: p.project_lead || '',
      funding_source: p.funding_source || '',
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
        budget: parseFloat(formData.budget),
        spent_amount: formData.spent_amount ? parseFloat(formData.spent_amount) : 0,
        end_date: formData.end_date || null,
      };

      if (editingId) {
        await apiRequest(`/projects/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Project "${formData.project_name}" updated.`);
      } else {
        await apiRequest('/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg(`Conservation Project "${formData.project_name}" initiated.`);
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
    if (!confirm(`Are you sure you want to delete project "${name}"?`)) return;
    try {
      await apiRequest(`/projects/${id}`, { method: 'DELETE' });
      setSuccessMsg('Project removed.');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filtered = projects.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (p.project_name || '').toLowerCase().includes(q) ||
      (p.project_lead || '').toLowerCase().includes(q) ||
      (p.funding_source || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canManage = hasRole('Admin', 'Forest Officer');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Conservation Projects & Habitat Initiatives"
        subtitle="National Wildlife Programs, Eco-Restoration Budgets, and Expenditure Audits"
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
                placeholder="Search project name, lead or sponsor..."
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
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {canManage && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center space-x-2 bg-forest-700 hover:bg-forest-800 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Project</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-5">Project Name</th>
                  <th className="py-3 px-5">Area</th>
                  <th className="py-3 px-5">Project Lead</th>
                  <th className="py-3 px-5">Budget</th>
                  <th className="py-3 px-5">Expenditure</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Funding Source</th>
                  {canManage && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      Loading conservation initiatives...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No conservation projects found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const budget = parseFloat(p.budget || 0);
                    const spent = parseFloat(p.spent_amount || 0);
                    const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
                    return (
                      <tr key={p.project_id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-gray-900 max-w-xs">
                          {p.project_name}
                        </td>
                        <td className="py-3.5 px-5 text-gray-700">
                          {p.area_name || 'Landscape'}
                        </td>
                        <td className="py-3.5 px-5 text-forest-700 font-medium">
                          {p.project_lead}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-gray-800 font-semibold">
                          ₹{budget.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span>₹{spent.toLocaleString()}</span>
                              <span className="text-gray-400">{pct}%</span>
                            </div>
                            <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-forest-600 h-1.5 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <Badge status={p.status} />
                        </td>
                        <td className="py-3.5 px-5 text-xs text-gray-500">
                          {p.funding_source || 'Government'}
                        </td>
                        {canManage && (
                          <td className="py-3.5 px-5 text-right space-x-2">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Project"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.project_id, p.project_name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit Project Strategy' : 'Launch New Conservation Project'}
          onSubmit={handleSubmit}
          submitLabel={editingId ? 'Save Changes' : 'Launch Project'}
          isSubmitting={submitting}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Project Initiative Name *</label>
              <input
                type="text"
                required
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                placeholder="e.g. Project Tiger Habitat Expansion Corridor"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Protected Area</label>
              <select
                value={formData.area_id}
                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="">Cross-boundary / Statewide</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>
                    {a.area_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Project Lead *</label>
              <input
                type="text"
                required
                value={formData.project_lead}
                onChange={(e) => setFormData({ ...formData, project_lead: e.target.value })}
                placeholder="e.g. Dr. Ramesh K."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Total Approved Budget (₹) *</label>
              <input
                type="number"
                step="5000"
                required
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Spent / Disbursed (₹)</label>
              <input
                type="number"
                step="5000"
                value={formData.spent_amount}
                onChange={(e) => setFormData({ ...formData, spent_amount: e.target.value })}
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Project Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Funding Agency / Sponsor</label>
              <input
                type="text"
                value={formData.funding_source}
                onChange={(e) => setFormData({ ...formData, funding_source: e.target.value })}
                placeholder="e.g. National Tiger Conservation Authority (NTCA)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Scope & Objectives</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Reforestation of degraded patches, anti-poaching camera surveillance network..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
