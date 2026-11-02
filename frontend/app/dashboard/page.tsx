'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import StatsCard from '@/components/StatsCard';
import Badge from '@/components/Badge';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import {
  PawPrint,
  Bug,
  TreePine,
  Binoculars,
  AlertTriangle,
  FolderKanban,
  Users2,
  HeartHandshake,
  Siren,
  Stethoscope,
  RefreshCw,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [popChart, setPopChart] = useState<any[]>([]);
  const [speciesDist, setSpeciesDist] = useState<any[]>([]);
  const [threatDist, setThreatDist] = useState<any[]>([]);
  const [recentSightings, setRecentSightings] = useState<any[]>([]);
  const [recentThreats, setRecentThreats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, popData, distData, threatData, sightingsData, threatsData] = await Promise.all([
        apiRequest<any>('/dashboard/stats').catch(() => ({})),
        apiRequest<any[]>('/dashboard/population-chart').catch(() => []),
        apiRequest<any[]>('/dashboard/species-distribution').catch(() => []),
        apiRequest<any[]>('/dashboard/threats-by-severity').catch(() => []),
        apiRequest<any[]>('/sightings').then((r: any) => (Array.isArray(r) ? r.slice(0, 5) : [])).catch(() => []),
        apiRequest<any[]>('/threats').then((r: any) => (Array.isArray(r) ? r.slice(0, 5) : [])).catch(() => []),
      ]);

      setStats(statsData);
      setPopChart(popData);
      setSpeciesDist(distData);
      setThreatDist(threatData);
      setRecentSightings(sightingsData);
      setRecentThreats(threatsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="Conservation Analytics Dashboard"
        subtitle="Centralized Wildlife Intelligence and Ecological Monitoring System"
      />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Welcome & Role Banner */}
        <div className="bg-gradient-to-r from-forest-900 via-forest-800 to-forest-700 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-green-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>WildTrack Integrated Management System</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.full_name || 'Conservation Specialist'}
            </h1>
            <p className="text-forest-200 text-sm mt-1 max-w-xl">
              You are authenticated with role{' '}
              <span className="font-semibold text-accent-mint bg-forest-950/40 px-2 py-0.5 rounded">
                {user?.role || 'Guest'}
              </span>
              . Real-time telemetry, population records, and active threat advisories are updated below.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition backdrop-blur-sm self-end md:self-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live Data</span>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchDashboardData} className="underline font-semibold ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Top KPI Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Animal Records"
            value={stats.total_animals ?? 0}
            subtitle="Registered individuals"
            icon={PawPrint}
            color="green"
            trend="+12% this month"
          />
          <StatsCard
            title="Cataloged Species"
            value={stats.total_species ?? 0}
            subtitle="Taxonomic catalog"
            icon={Bug}
            color="blue"
          />
          <StatsCard
            title="Endangered Species"
            value={stats.endangered_species ?? 0}
            subtitle="High conservation priority"
            icon={AlertTriangle}
            color="rose"
            trend="Needs monitoring"
          />
          <StatsCard
            title="Protected Areas"
            value={stats.total_areas ?? stats.protected_areas ?? 0}
            subtitle="National parks & reserves"
            icon={TreePine}
            color="green"
          />
          <StatsCard
            title="Field Sightings"
            value={stats.total_sightings ?? 0}
            subtitle="GPS-logged observations"
            icon={Binoculars}
            color="blue"
          />
          <StatsCard
            title="Active Threats"
            value={stats.active_threats ?? 0}
            subtitle="Poaching, habitat, disease"
            icon={Siren}
            color="amber"
          />
          <StatsCard
            title="Conservation Projects"
            value={stats.active_projects ?? 0}
            subtitle="Ongoing initiatives"
            icon={FolderKanban}
            color="purple"
          />
          <StatsCard
            title="Research & Volunteers"
            value={(stats.total_researchers ?? 0) + (stats.total_volunteers ?? 0)}
            subtitle={`${stats.total_researchers ?? 0} Researchers · ${stats.total_volunteers ?? 0} Volunteers`}
            icon={HeartHandshake}
            color="green"
          />
        </div>

        {/* Analytical Visualizations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Population by Species Bar representation */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-base">Wildlife Population by Species</h3>
              <span className="text-xs text-gray-400">DBMS Aggregate & Group By</span>
            </div>
            <div className="space-y-3">
              {popChart.length > 0 ? (
                popChart.slice(0, 6).map((item, idx) => {
                  const maxCount = Math.max(...popChart.map((p) => p.animal_count || 1), 1);
                  const pct = Math.round(((item.animal_count || 0) / maxCount) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-700">{item.species_name}</span>
                        <span className="text-forest-700 font-bold">{item.animal_count} tracked</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-forest-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 8)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">Loading population data...</p>
              )}
            </div>
          </div>

          {/* Species Distribution by Conservation Status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-base">IUCN Conservation Status Distribution</h3>
              <span className="text-xs text-gray-400">IUCN Red List Categorization</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {speciesDist.length > 0 ? (
                speciesDist.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <Badge status={item.conservation_status} />
                      <p className="text-xs text-gray-500 mt-1">Species in category</p>
                    </div>
                    <span className="text-xl font-bold text-gray-800">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center col-span-2">Loading status distribution...</p>
              )}
            </div>
          </div>
        </div>

        {/* Live Operational Feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sightings */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center space-x-2">
                <Binoculars className="w-4 h-4 text-forest-700" />
                <span>Recent Wildlife Sightings</span>
              </h3>
              <span className="text-xs text-forest-600 font-medium">GPS Tracked</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="pb-3">Animal</th>
                    <th className="pb-3">Protected Area</th>
                    <th className="pb-3">Date & Time</th>
                    <th className="pb-3">Observer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentSightings.length > 0 ? (
                    recentSightings.map((s, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-2.5 font-semibold text-gray-800">
                          {s.animal_name || `Animal #${s.animal_id}`}
                        </td>
                        <td className="py-2.5 text-gray-600">{s.area_name || 'Protected Zone'}</td>
                        <td className="py-2.5 text-gray-500">
                          {s.sighting_date ? String(s.sighting_date).substring(0, 10) : '—'}
                        </td>
                        <td className="py-2.5 text-gray-600">{s.observer_name || 'Forest Ranger'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        No recent sightings recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Threat Advisories */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-base flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Active Threat Advisories</span>
              </h3>
              <span className="text-xs text-amber-700 font-medium">Automatic Trigger Watch</span>
            </div>
            <div className="space-y-3">
              {recentThreats.length > 0 ? (
                recentThreats.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-start justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-gray-800">{t.threat_type}</span>
                        <Badge status={t.severity} />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{t.description}</p>
                      <p className="text-[11px] text-gray-400">Location: {t.location || 'Reserve perimeter'}</p>
                    </div>
                    <Badge status={t.status || 'Active'} />
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">No active threat advisories</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
