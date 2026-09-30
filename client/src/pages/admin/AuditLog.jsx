import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const actionsList = [
    { value: 'user_created', label: 'User Created' },
    { value: 'user_updated', label: 'User Updated' },
    { value: 'user_deleted', label: 'User Deleted' },
    { value: 'user_suspended', label: 'User Suspended' },
    { value: 'user_activated', label: 'User Activated' },
    { value: 'password_reset', label: 'Password Reset' },
    { value: 'role_changed', label: 'Role Changed' },
    { value: 'association_created', label: 'Association Created' },
    { value: 'association_updated', label: 'Association Updated' },
    { value: 'association_deleted', label: 'Association Deleted' },
    { value: 'sport_created', label: 'Sport Created' },
    { value: 'sport_toggled', label: 'Sport Active State' },
    { value: 'sport_deleted', label: 'Sport Deleted' },
    { value: 'ground_created', label: 'Ground Created' },
    { value: 'ground_booking_toggled', label: 'Ground Booking Switch' },
    { value: 'notification_sent', label: 'Notification Broadcast' },
    { value: 'system_config_updated', label: 'System Config Edited' },
    { value: 'feedback_replied', label: 'Feedback Response' },
    { value: 'feedback_resolved', label: 'Feedback Resolved' }
  ];

  useEffect(() => {
    loadAuditLogs();
  }, [page, actionFilter, startDate, endDate]);

  const loadAuditLogs = () => {
    setLoading(true);
    adminApi.getAuditLogs({
      page,
      limit: 20,
      action: actionFilter,
      startDate,
      endDate
    })
      .then(res => {
        setLogs(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      })
      .catch(() => toast.error('Failed to load system audit logs'))
      .finally(() => setLoading(false));
  };

  const getActionBadgeColor = (action) => {
    if (action.includes('created')) return 'badge-success';
    if (action.includes('deleted')) return 'badge-danger';
    if (action.includes('suspended')) return 'badge-danger';
    if (action.includes('failed')) return 'badge-danger';
    if (action.includes('reset')) return 'badge-pending';
    if (action.includes('updated') || action.includes('toggled') || action.includes('reply')) return 'badge-info';
    return 'badge';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">System Audit Logs</h1>
          <p className="text-dark-100/60 text-sm mt-1">Audit log repository tracking all administrator actions and system-wide state modifications</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="card grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        <div>
          <label className="label">Action Type</label>
          <select className="input" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
            <option value="">All Actions</option>
            {actionsList.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Start Date</label>
          <input type="date" className="input" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label className="label">End Date</label>
          <input type="date" className="input" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
        </div>
        <div>
          <button onClick={() => { setActionFilter(''); setStartDate(''); setEndDate(''); setPage(1); }} className="btn-secondary w-full justify-center">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Logs list */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No audit events recorded matching the criteria</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Admin / Performed By</th>
                  <th>Target Object</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l._id}>
                    <td className="text-xs text-dark-100/50">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeColor(l.action)}`}>
                        {l.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-white">{l.performedBy?.name || 'Admin'}</div>
                      <div className="text-[10px] text-dark-100/40">{l.performedBy?.role || 'System'}</div>
                    </td>
                    <td>
                      {l.targetUser ? (
                        <div>
                          <span className="text-xs text-white">User: {l.targetUser.name}</span>
                          <span className="text-[10px] text-dark-100/40 block">{l.targetUser.email}</span>
                        </div>
                      ) : l.targetModel ? (
                        <span className="text-xs text-white">{l.targetModel} ({l.targetId?.substring(0, 8)})</span>
                      ) : (
                        <span className="text-xs text-dark-100/40">-</span>
                      )}
                    </td>
                    <td>
                      <pre className="text-[10px] font-mono text-dark-100/70 max-w-xs overflow-x-auto bg-dark-900/60 p-1.5 rounded-lg border border-dark-700/30">
                        {JSON.stringify(l.details || {}, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(prev => prev - 1)}
              className="btn-secondary py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-dark-100/60">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(prev => prev + 1)}
              className="btn-secondary py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
