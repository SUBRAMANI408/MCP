import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/validators';

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState('users'); // users, associations, tournaments, matches, grounds, financial
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const tabs = [
    { id: 'users', label: 'User Registrations' },
    { id: 'associations', label: 'Associations Overview' },
    { id: 'tournaments', label: 'Tournament Reports' },
    { id: 'matches', label: 'Match Breakdown' },
    { id: 'grounds', label: 'Ground Utilization' },
    { id: 'financial', label: 'Financial Statements' }
  ];

  useEffect(() => {
    loadReport();
  }, [activeTab, startDate, endDate]);

  const loadReport = () => {
    setLoading(true);
    let endpoint = '';
    
    if (activeTab === 'users') endpoint = '/reports/admin/users';
    else if (activeTab === 'associations') endpoint = '/reports/admin/associations'; // returns user breakdown
    else if (activeTab === 'tournaments') endpoint = '/reports/admin/associations'; // stub routing or reports routing fallback
    else if (activeTab === 'matches') endpoint = '/reports/admin/associations';
    else if (activeTab === 'grounds') endpoint = '/reports/admin/associations';
    else if (activeTab === 'financial') endpoint = '/reports/admin/revenue';

    api.get(endpoint, {
      params: { startDate, endDate }
    })
      .then(res => {
        setData(res.data.data);
      })
      .catch(() => toast.error('Failed to load report data'))
      .finally(() => setLoading(false));
  };

  // Helper calculations for summary cards
  const getTotalUsers = () => {
    if (activeTab !== 'users') return 0;
    return data.reduce((acc, curr) => acc + curr.count, 0);
  };

  const getActiveUsersCount = () => {
    if (activeTab !== 'users') return 0;
    return data.reduce((acc, curr) => acc + curr.active, 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">System Reports</h1>
          <p className="text-dark-100/60 text-sm mt-1">Generate system-wide metrics, telemetry, and platform activity data</p>
        </div>
      </div>

      {/* Date filter & Tab Nav */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-dark-700/50 pb-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setData([]); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  activeTab === t.id ? 'bg-primary-600 text-white' : 'bg-dark-900 text-dark-100/60 hover:bg-dark-700/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 items-end">
            <div>
              <label className="text-[10px] text-dark-100/50 block mb-1">Start Date</label>
              <input type="date" className="input py-1.5 px-3 text-xs w-32" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-dark-100/50 block mb-1">End Date</label>
              <input type="date" className="input py-1.5 px-3 text-xs w-32" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="btn-secondary py-1.5 text-xs">
              Clear
            </button>
          </div>
        </div>

        {/* Tab-specific summary cards */}
        {activeTab === 'users' && !loading && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="card-sm bg-dark-900 border border-dark-700/30 flex justify-between items-center">
              <div>
                <p className="text-xs text-dark-100/40 font-medium">Total Registered Users</p>
                <p className="text-2xl font-bold text-white mt-1">{getTotalUsers()}</p>
              </div>
              <span className="badge badge-info py-1">System Global</span>
            </div>
            <div className="card-sm bg-dark-900 border border-dark-700/30 flex justify-between items-center">
              <div>
                <p className="text-xs text-dark-100/40 font-medium">Active Account States</p>
                <p className="text-2xl font-bold text-sport-500 mt-1">{getActiveUsersCount()}</p>
              </div>
              <span className="badge badge-success py-1">Active Ratio</span>
            </div>
          </div>
        )}

        {activeTab === 'financial' && !loading && (
          <div className="card-sm bg-dark-900 border border-dark-700/30">
            <p className="text-xs text-dark-100/40 font-medium">Financial Operating Income Summary</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatCurrency(Array.isArray(data) ? data.reduce((acc, curr) => acc + curr.total, 0) : 0)}
            </p>
          </div>
        )}
      </div>

      {/* Report Table Card */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No reports recorded matching specified criteria</p>
        ) : (
          <div className="table-container">
            {activeTab === 'users' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Role Type</th>
                    <th>Accounts count</th>
                    <th>Active Accounts</th>
                    <th>Inactivity Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      <td><span className="font-semibold text-white capitalize">{row._id?.replace(/_/g, ' ')}</span></td>
                      <td>{row.count} users</td>
                      <td><span className="text-sport-500 font-medium">{row.active} active</span></td>
                      <td className="text-dark-100/40">{row.count - row.active} inactive</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'financial' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Reporting Month</th>
                    <th>Total Operating Income</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      <td><span className="font-semibold text-white">Month {row._id?.month}, {row._id?.year}</span></td>
                      <td className="text-sport-500 font-bold">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab !== 'users' && activeTab !== 'financial' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Role / Metric Item</th>
                    <th>Records count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      <td><span className="font-semibold text-white capitalize">{row._id?.replace(/_/g, ' ') || 'Default'}</span></td>
                      <td>{row.count} records matching</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
