import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/validators';

export default function AssociationReports() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('teams'); // teams, financial, grounds, tournament
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const tabs = [
    { id: 'teams', label: 'Teams Performance' },
    { id: 'financial', label: 'Financial Ledger' },
    { id: 'grounds', label: 'Ground Utilization' },
    { id: 'tournament', label: 'Tournament Status' }
  ];

  useEffect(() => {
    if (user?.associationId) {
      loadReport();
    }
  }, [user, activeTab, startDate, endDate]);

  const loadReport = () => {
    setLoading(true);
    api.get(`/reports/association/${activeTab}`, {
      params: {
        associationId: user.associationId,
        startDate,
        endDate
      }
    })
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load association reports'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Association Reports</h1>
          <p className="text-dark-100/60 text-sm mt-1">Generate reports for teams performance, financial statements, ground utilization, and tournaments status</p>
        </div>
      </div>

      {/* Filter panel */}
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

        {/* Tab summary cards */}
        {activeTab === 'financial' && !loading && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="card-sm bg-dark-900 border border-dark-700/30">
              <p className="text-xs text-dark-100/40 font-medium">Income Collected</p>
              <p className="text-xl font-bold text-sport-500 mt-1">
                {formatCurrency(data.filter(d => d._id?.type === 'income').reduce((acc, curr) => acc + curr.total, 0))}
              </p>
            </div>
            <div className="card-sm bg-dark-900 border border-dark-700/30">
              <p className="text-xs text-dark-100/40 font-medium">Expenses Audited</p>
              <p className="text-xl font-bold text-red-500 mt-1">
                {formatCurrency(data.filter(d => d._id?.type === 'expense').reduce((acc, curr) => acc + curr.total, 0))}
              </p>
            </div>
            <div className="card-sm bg-dark-900 border border-dark-700/30">
              <p className="text-xs text-dark-100/40 font-medium">Net Operating Balance</p>
              <p className="text-xl font-bold text-primary-400 mt-1">
                {formatCurrency(
                  data.filter(d => d._id?.type === 'income').reduce((acc, curr) => acc + curr.total, 0) -
                  data.filter(d => d._id?.type === 'expense').reduce((acc, curr) => acc + curr.total, 0)
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Reports content card */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No report logs registered for specified selection</p>
        ) : (
          <div className="table-container">
            {activeTab === 'teams' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Sport</th>
                    <th>Captain Name</th>
                    <th>Total Matches Played</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      <td><span className="font-semibold text-white">{row.name}</span></td>
                      <td><span className="badge badge-info">{row.sport}</span></td>
                      <td>{row.captainId?.name}</td>
                      <td>{row.matchesPlayed} matches</td>
                      <td><span className="badge badge-success capitalize">{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'financial' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Flow Type</th>
                    <th>Category</th>
                    <th>Volume count</th>
                    <th>Total Cash flow</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className={`badge ${row._id?.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                          {row._id?.type}
                        </span>
                      </td>
                      <td><span className="font-semibold text-white capitalize">{row._id?.category?.replace('_', ' ')}</span></td>
                      <td>{row.count} events</td>
                      <td className={`font-bold ${row._id?.type === 'income' ? 'text-sport-500' : 'text-red-500'}`}>
                        {formatCurrency(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'grounds' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Ground Name</th>
                    <th>Total Approved Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      <td><span className="font-semibold text-white">{row.groundName}</span></td>
                      <td><span className="font-bold text-primary-400">{row.count} booking slots filled</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'tournament' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tournament Title</th>
                    <th>Sport</th>
                    <th>Roster Size</th>
                    <th>Schedule Dates</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      <td><span className="font-semibold text-white">{row.name}</span></td>
                      <td><span className="badge badge-info">{row.sport}</span></td>
                      <td>{row.registeredTeams?.length || 0} teams registered</td>
                      <td className="text-xs text-dark-100/50">
                        {new Date(row.startDate).toLocaleDateString()} - {new Date(row.endDate).toLocaleDateString()}
                      </td>
                      <td><span className="badge badge-pending capitalize">{row.status}</span></td>
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
