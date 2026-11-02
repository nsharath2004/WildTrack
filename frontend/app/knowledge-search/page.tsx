'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Modal from '@/components/Modal';
import { apiRequest } from '@/services/api';
import { SearchCode, Sparkles, Plus, RefreshCw, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export default function KnowledgeSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'library'>('search');

  // Add document modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Species Ecology',
    source: 'Wildlife Institute of India (WII)',
    content: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const samplePrompts = [
    'What are the primary poaching threats facing Royal Bengal Tigers?',
    'Emergency protocols for elephants caught in wire snare traps',
    'How do camera trap census grids estimate carnivore densities?',
    'Veterinary care for dehydration and limb wounds in wild leopards',
  ];

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const data = await apiRequest<any>('/vector/documents');
      setDocuments(data.documents || []);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery !== undefined ? customQuery : query;
    if (!q.trim()) return;

    setIsSearching(true);
    setFeedback(null);
    try {
      const data = await apiRequest<any>('/vector/search', {
        method: 'POST',
        body: JSON.stringify({ query: q, n_results: 4 }),
      });
      setResults(data.results || []);
    } catch (err: any) {
      setFeedback(`Search failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSeed = async () => {
    setIsLoadingDocs(true);
    try {
      await apiRequest('/vector/seed');
      setFeedback('Vector database re-seeded with 10 standard wildlife conservation research documents.');
      fetchDocuments();
    } catch (err: any) {
      setFeedback(`Seeding failed: ${err.message}`);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/vector/documents', {
        method: 'POST',
        body: JSON.stringify({
          text: formData.content,
          metadata: {
            title: formData.title,
            category: formData.category,
            source: formData.source,
          },
        }),
      });
      setFeedback(`Document "${formData.title}" vectorized and indexed in ChromaDB.`);
      setIsModalOpen(false);
      fetchDocuments();
      setFormData({
        title: '',
        category: 'Species Ecology',
        source: 'Wildlife Institute of India (WII)',
        content: '',
      });
    } catch (err: any) {
      setFeedback(`Index failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="ChromaDB Semantic Knowledge Search"
        subtitle="Dense Vector Embeddings & Cosine Similarity Search for Wildlife Research & SOP Guidelines"
      />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner */}
        <div className="bg-gradient-to-r from-forest-950 via-forest-900 to-forest-800 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-green-300 text-xs font-semibold uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Vector Database & NoSQL Semantic Search</span>
            </div>
            <h1 className="text-xl font-bold">ChromaDB Wildlife Knowledge Base</h1>
            <p className="text-forest-200 text-sm max-w-2xl">
              Queries are mapped into high-dimensional dense embedding vectors. Cosine similarity retrieves the most
              relevant ecological guidelines, veterinary medical protocols, and anti-poaching SOPs.
            </p>
          </div>
          <div className="flex items-center space-x-2 self-end md:self-center">
            <button
              onClick={handleSeed}
              className="flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-xs font-semibold backdrop-blur-sm transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-seed Vectors</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1.5 bg-forest-600 hover:bg-forest-500 text-white px-3 py-2 rounded-xl text-xs font-semibold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Index Document</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center justify-between">
            <span>{feedback}</span>
            <button onClick={() => setFeedback(null)} className="text-xs underline font-semibold ml-2">
              Dismiss
            </button>
          </div>
        )}

        {/* Tab toggle */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'search'
                ? 'border-forest-600 text-forest-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Semantic Search
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'library'
                ? 'border-forest-600 text-forest-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>Indexed Documents</span>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-mono">
              {documents.length}
            </span>
          </button>
        </div>

        {activeTab === 'search' ? (
          <div className="space-y-6">
            {/* Search Box */}
            <form onSubmit={handleSearch} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <div className="relative">
                <SearchCode className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  placeholder="Ask a natural language question about wildlife protocols, diseases, or census methods..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-28 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-2 bg-forest-700 hover:bg-forest-800 text-white px-5 py-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {isSearching ? 'Embedding...' : 'Vector Search'}
                </button>
              </div>

              {/* Suggestions */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Try asking:</span>
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(p);
                      handleSearch(undefined, p);
                    }}
                    className="text-xs bg-gray-100 hover:bg-forest-50 hover:text-forest-800 text-gray-600 px-3 py-1 rounded-full transition"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </form>

            {/* Results Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Similarity Results {results.length > 0 && `(${results.length} nearest neighbors)`}
              </h3>

              {isSearching ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center space-y-3">
                  <div className="w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 font-medium">
                    Computing vector cosine similarities across ChromaDB collections...
                  </p>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((r, idx) => {
                    const score = Math.round((r.score || 0.85) * 100);
                    return (
                      <div
                        key={idx}
                        className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest-50 text-forest-800 border border-forest-200">
                              {r.metadata?.category || 'General SOP'}
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {score}% Semantic Match
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-base">{r.metadata?.title || 'Indexed Guide'}</h4>
                          <p className="text-xs text-gray-600 leading-relaxed">{r.content || r.text}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                          <span>Source: {r.metadata?.source || 'Wildlife DB'}</span>
                          <span className="font-mono">Doc ID: {r.id || `#${idx + 1}`}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-400 text-sm">
                  Enter a question above or click one of the suggested prompts to query the ChromaDB vector database.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Library View */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-gray-800 text-base">ChromaDB Indexed Vector Knowledgebase</h3>
            {isLoadingDocs ? (
              <p className="text-sm text-gray-400 py-8 text-center">Loading vector collections...</p>
            ) : documents.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-sm text-gray-500">No documents found in the vector index.</p>
                <button
                  onClick={handleSeed}
                  className="bg-forest-700 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                >
                  Seed Default Guidelines
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-gray-900">{doc.metadata?.title || `Doc #${doc.id}`}</h4>
                      <span className="text-xs bg-forest-100 text-forest-800 px-2 py-0.5 rounded font-medium">
                        {doc.metadata?.category || 'Ecological SOP'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{doc.content || doc.text}</p>
                    <p className="text-[11px] text-gray-400">Source: {doc.metadata?.source || 'National Repository'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Vectorize & Index Wildlife Document"
          onSubmit={handleAddDocument}
          submitLabel="Generate Vectors & Store"
          isSubmitting={submitting}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Document / Protocol Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Protocol for Elephant Translocation and Radio-Collaring"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-forest-500"
                >
                  <option value="Species Ecology">Species Ecology</option>
                  <option value="Anti-Poaching SOP">Anti-Poaching SOP</option>
                  <option value="Veterinary Medicine">Veterinary Medicine</option>
                  <option value="Census Methodology">Census Methodology</option>
                  <option value="Habitat Management">Habitat Management</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Source / Author</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="e.g. Wildlife Institute of India"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Document Body / SOP Text (Will be converted to dense vector embeddings) *
              </label>
              <textarea
                rows={6}
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter complete protocol paragraphs, dosing formulas, field indicators..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
