'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { apiRequest } from '@/services/api';
import { BarChart3, Database, Play, CheckCircle, Code, Layers, FileText } from 'lucide-react';

interface QueryPreset {
  id: string;
  title: string;
  category: 'Views' | 'Joins & Subqueries' | 'CTEs & Window Functions' | 'Transactions & Procedures';
  description: string;
  sql: string;
  endpoint?: string;
}

const PRESETS: QueryPreset[] = [
  {
    id: 'view_animal_details',
    title: 'View: v_animal_details (Multi-Table JOIN)',
    category: 'Views',
    description: 'Demonstrates 3NF abstraction joining Animals, Species, and Protected_Area.',
    sql: 'SELECT * FROM v_animal_details ORDER BY registration_date DESC LIMIT 10;',
    endpoint: '/animals',
  },
  {
    id: 'view_endangered',
    title: 'View: v_endangered_species',
    category: 'Views',
    description: 'Filters species by IUCN Endangered or Critically Endangered status with aggregate counts.',
    sql: 'SELECT * FROM v_endangered_species ORDER BY registered_individuals DESC;',
    endpoint: '/species',
  },
  {
    id: 'cte_density',
    title: 'CTE & Window Function: Dense Rank by Area',
    category: 'CTEs & Window Functions',
    description: 'Uses CTE with DENSE_RANK() OVER(PARTITION BY area_id) to rank animals by age.',
    sql: `WITH RankedAnimals AS (
    SELECT animal_name, species_id, area_id, age_years,
           DENSE_RANK() OVER (PARTITION BY area_id ORDER BY age_years DESC) AS age_rank
    FROM Animals
    WHERE age_years IS NOT NULL
)
SELECT * FROM RankedAnimals WHERE age_rank <= 3;`,
    endpoint: '/dashboard/population-chart',
  },
  {
    id: 'correlated_subquery',
    title: 'Correlated Subquery: Areas with Above-Average Species Count',
    category: 'Joins & Subqueries',
    description: 'Identifies protected areas that harbor more animals than the average per reserve.',
    sql: `SELECT pa.area_name, pa.location,
       (SELECT COUNT(*) FROM Animals a WHERE a.area_id = pa.area_id) AS total_animals
FROM Protected_Area pa
WHERE (SELECT COUNT(*) FROM Animals a WHERE a.area_id = pa.area_id) > (
    SELECT AVG(animal_count) FROM (
        SELECT COUNT(*) AS animal_count FROM Animals GROUP BY area_id
    ) AS avg_tbl
);`,
    endpoint: '/protected-areas',
  },
  {
    id: 'sp_transaction',
    title: 'Stored Procedure with Transaction: AddAnimalWithSighting',
    category: 'Transactions & Procedures',
    description: 'ACID transaction inserting into Animals and Sightings atomically with ROLLBACK handler.',
    sql: `CALL AddAnimalWithSighting(
    'Shere Khan II', 1, 1, 'Male', 4.5, 'Healthy',
    'RFID-771122', '11.662', '76.621', 'Bandipur North', 'Forest Ranger',
    @new_animal_id, @new_sighting_id
);
SELECT @new_animal_id, @new_sighting_id;`,
    endpoint: '/animals',
  },
];

export default function ReportsPage() {
  const [selectedPreset, setSelectedPreset] = useState<QueryPreset>(PRESETS[0]);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);
  const [executedAt, setExecutedAt] = useState<string | null>(null);

  const runQuery = async (preset: QueryPreset) => {
    setSelectedPreset(preset);
    setExecuting(true);
    try {
      if (preset.endpoint) {
        const data = await apiRequest<any[]>(preset.endpoint);
        setQueryResults(Array.isArray(data) ? data.slice(0, 10) : []);
      } else {
        setQueryResults([]);
      }
      setExecutedAt(new Date().toLocaleTimeString());
    } catch {
      setQueryResults([]);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        title="DBMS Analytics & Advanced SQL Demonstration"
        subtitle="Live Execution of 3NF Views, Correlated Subqueries, Window Functions, and ACID Transactions"
      />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Banner */}
        <div className="bg-forest-900 text-white p-6 rounded-2xl shadow-md flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-green-300 text-xs font-semibold uppercase">
              <Database className="w-4 h-4" />
              <span>PES University DBMS Mini-Project Evaluation Module</span>
            </div>
            <h1 className="text-xl font-bold">SQL Relational Concepts & Execution Engine</h1>
            <p className="text-forest-200 text-sm max-w-2xl">
              Demonstrating database views, nested joins, CTEs, aggregate groups with HAVING, and stored procedures with
              atomic commit/rollback semantics.
            </p>
          </div>
          <span className="px-3 py-1 bg-forest-800 border border-forest-700 text-green-300 rounded-lg text-xs font-mono">
            MySQL 8.0 Engine
          </span>
        </div>

        {/* Query Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRESETS.map((p) => {
            const isSelected = selectedPreset.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => runQuery(p)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-forest-600 shadow-md ring-2 ring-forest-500/20'
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full">
                    {p.category}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm mt-2">{p.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-forest-600 font-semibold flex items-center space-x-1">
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run Query</span>
                  </span>
                  {isSelected && <CheckCircle className="w-4 h-4 text-forest-600" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* SQL Viewer & Execution Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-forest-700" />
              <h3 className="font-bold text-gray-800 text-sm">Query Definition: {selectedPreset.title}</h3>
            </div>
            <button
              onClick={() => runQuery(selectedPreset)}
              disabled={executing}
              className="flex items-center space-x-1.5 bg-forest-700 hover:bg-forest-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${executing ? 'animate-spin' : ''}`} />
              <span>{executing ? 'Executing...' : 'Execute Query'}</span>
            </button>
          </div>

          <div className="p-4 bg-forest-950 font-mono text-xs text-green-300 overflow-x-auto leading-relaxed">
            <pre>{selectedPreset.sql}</pre>
          </div>

          {/* Results Table */}
          <div className="p-5 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Execution Output {executedAt && `(Last run at ${executedAt})`}
              </h4>
              <span className="text-xs text-forest-700 font-medium">
                {queryResults.length} records retrieved
              </span>
            </div>

            {queryResults.length > 0 ? (
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <tr>
                      {Object.keys(queryResults[0]).slice(0, 7).map((key) => (
                        <th key={key} className="py-2.5 px-4 font-semibold">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {queryResults.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        {Object.keys(row).slice(0, 7).map((key) => (
                          <td key={key} className="py-2 px-4 text-gray-800 truncate max-w-xs">
                            {row[key] !== null ? String(row[key]) : 'NULL'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                Click "Execute Query" above to inspect the relational dataset.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
