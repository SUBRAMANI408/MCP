import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function SecurityPanel() {
  const [failures, setFailures] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadFailedAttempts();
    loadDashboardStats();
  }, []);

  const loadFailedAttempts = () => {
    setLoadingAttempts(true);
    adminApi.getLoginAttempts({ limit: 10 })
      .then(res => setFailures(res.data.data))
      .catch(() => {})
      .finally(() => setLoadingAttempts(false));
  };

  const loadDashboardStats = () => {
    adminApi.getDashboard()
      .then(res => setStats(res.data.data))
      .catch(() => {});
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchUser.trim()) return;

    setSearching(true);
    adminApi.getUsers({ search: searchUser, limit: 10 })
      .then(res => setSearchResults(res.data.data))
      .catch(() => toast.error('Search query failed'))
      .finally(() => setSearching(false));
  };

  const handleForceLogout = (userId) => {
    if (window.confirm('Force logout this user and terminate session?')) {
      adminApi.forceLogoutUser(userId)
        .then(() => {
          toast.success('User session terminated successfully');
          loadDashboardStats();
        })
        .catch(() => toast.error('Force logout request failed'));
    }
  };

  const handleToggleStatus = (user, status) => {
    const actionText = status === 'suspended' ? 'suspend' : 'reactivate';
    if (window.confirm(`Are you sure you want to ${actionText} this user's login access?`)) {
      adminApi.toggleUserStatus(user._id, { status })
        .then(() => {
          toast.success(`User login access ${status === 'suspended' ? 'suspended' : 'reactivated'}`);
          // Refresh search result list item status
          setSearchResults(prev => prev.map(u => u._id === user._id ? { ...u, status } : u));
          loadDashboardStats();
        })
        .catch(() => toast.error(`Failed to modify login access status`));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">System Security Panel</h1>
          <p className="text-dark-100/60 text-sm mt-1">Audit security alerts, lock/unlock login portals, terminate active user threads, and monitor suspicious activities</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-sm bg-dark-900 border border-dark-700/30">
          <p className="text-xs text-dark-100/40 font-medium">Total Registered Users</p>
          <p className="text-2xl font-bold text-white mt-1">{stats?.totalUsers || 0}</p>
        </div>
        <div className="card-sm bg-dark-900 border border-dark-700/30">
          <p className="text-xs text-dark-100/40 font-medium">Active Accounts</p>
          <p className="text-2xl font-bold text-sport-500 mt-1">{stats?.activeUsers || 0}</p>
        </div>
        <div className="card-sm bg-dark-900 border border-dark-700/30">
          <p className="text-xs text-dark-100/40 font-medium">Suspended Accounts</p>
          <p className="text-2xl font-bold text-red-500 mt-1">
            {stats?.totalUsers && stats?.activeUsers ? (stats.totalUsers - stats.activeUsers) : 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Portal Access Control */}
        <div className="card lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-white">Login Portal Access Control</h3>
          <p className="text-xs text-dark-100/40">Search for any account to invoke security overrides (force logs out or toggles suspension states)</p>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              className="input py-2"
              placeholder="Search by name, email, phone or username..."
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              required
            />
            <button type="submit" className="btn-primary py-2 px-6 whitespace-nowrap">
              Search Accounts
            </button>
          </form>

          {searching ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="table-container bg-dark-900/40">
              <table className="table">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="text-right">Overrides</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[10px] text-dark-100/40">{u.email}</div>
                      </td>
                      <td><span className="badge badge-info">{u.role}</span></td>
                      <td>
                        <span className={`badge ${
                          u.status === 'active' ? 'badge-success' : 'badge-danger'
                        }`}>{u.status}</span>
                      </td>
                      <td className="text-right space-x-2">
                        <button onClick={() => handleForceLogout(u._id)} className="btn-secondary py-1 px-2.5 text-xs text-orange-400">
                          Force Logout
                        </button>
                        {u.status === 'suspended' ? (
                          <button onClick={() => handleToggleStatus(u, 'active')} className="btn-success py-1 px-2.5 text-xs">
                            Reactivate
                          </button>
                        ) : (
                          <button onClick={() => handleToggleStatus(u, 'suspended')} className="btn-danger py-1 px-2.5 text-xs">
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : searchUser && !searching && (
            <p className="text-xs text-dark-100/40 text-center py-6">No account match found</p>
          )}
        </div>

        {/* Failed Login Attempts */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Failed Login Alerts</h3>
          {loadingAttempts ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : failures.length === 0 ? (
            <p className="text-xs text-dark-100/40 py-6 text-center">No failed login logs recorded</p>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {failures.map(f => (
                <div key={f._id} className="card-sm bg-dark-900 space-y-1.5 border border-dark-700/30">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-semibold text-red-400">FAILED PORTAL ATTEMPT</span>
                    <span className="text-dark-100/40">{new Date(f.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs text-white">Target User Email: {f.details?.email || '-'}</div>
                  <div className="text-[10px] text-dark-100/40">Remote IP Address: {f.ipAddress || 'unknown'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
