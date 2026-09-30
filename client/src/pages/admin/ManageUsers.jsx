import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assocFilter, setAssocFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Forms state
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'player', associationId: '', phone: '', username: ''
  });
  const [resetPasswordState, setResetPasswordState] = useState({
    newPassword: '', forceChange: false
  });

  useEffect(() => {
    loadUsers();
    loadAssociations();
  }, [page, roleFilter, statusFilter, assocFilter]);

  const loadUsers = () => {
    setLoading(true);
    adminApi.getUsers({
      page,
      limit: 10,
      search,
      role: roleFilter,
      status: statusFilter,
      associationId: assocFilter
    })
      .then(res => {
        setUsers(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  const loadAssociations = () => {
    adminApi.getAssociations({ limit: 100 })
      .then(res => setAssociations(res.data.data))
      .catch(() => {});
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleCreate = (e) => {
    e.preventDefault();
    adminApi.createUser(formData)
      .then(() => {
        toast.success('User created successfully');
        setShowCreateModal(false);
        setFormData({ name: '', email: '', password: '', role: 'player', associationId: '', phone: '', username: '' });
        loadUsers();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to create user'));
  };

  const handleEditOpen = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'player',
      associationId: user.associationId?._id || user.associationId || '',
      phone: user.phone || '',
      username: user.username || '',
      status: user.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleEdit = (e) => {
    e.preventDefault();
    adminApi.updateUser(selectedUser._id, formData)
      .then(() => {
        toast.success('User updated successfully');
        setShowEditModal(false);
        loadUsers();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to update user'));
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      adminApi.deleteUser(id)
        .then(() => {
          toast.success('User status set to inactive');
          loadUsers();
        })
        .catch(() => toast.error('Failed to deactivate user'));
    }
  };

  const handleToggleStatus = (user) => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended';
    adminApi.toggleUserStatus(user._id, { status: nextStatus })
      .then(() => {
        toast.success(`User status updated to ${nextStatus}`);
        loadUsers();
      })
      .catch(() => toast.error('Failed to toggle status'));
  };

  const handleResetOpen = (user) => {
    setSelectedUser(user);
    setResetPasswordState({ newPassword: '', forceChange: false });
    setShowResetModal(true);
  };

  const handleResetPasswordSubmit = (e) => {
    e.preventDefault();
    adminApi.resetUserPassword(selectedUser._id, resetPasswordState)
      .then(() => {
        toast.success('Password reset email dispatched successfully');
        setShowResetModal(false);
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to reset password'));
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetPasswordState(prev => ({ ...prev, newPassword: pass }));
  };

  // Bulk actions
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map(u => u._id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Deactivate ${selectedIds.length} selected users?`)) {
      adminApi.bulkDeleteUsers({ userIds: selectedIds })
        .then(() => {
          toast.success('Selected users deactivated');
          setSelectedIds([]);
          loadUsers();
        })
        .catch(() => toast.error('Bulk deactivation failed'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Manage Users</h1>
          <p className="text-dark-100/60 text-sm mt-1">Configure global platform login accounts</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          Create User
        </button>
      </div>

      {/* Filters & Search */}
      <form onSubmit={handleSearchSubmit} className="card grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="label">Search User</label>
          <input
            type="text"
            className="input"
            placeholder="Name, email, phone or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All Roles</option>
            <option value="player">Player</option>
            <option value="captain">Captain</option>
            <option value="vice_captain">Vice Captain</option>
            <option value="association_head">Association Head</option>
            <option value="tournament_organizer">Tournament Organizer</option>
            <option value="ground_officer">Ground Officer</option>
            <option value="funds_officer">Funds Officer</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div>
          <button type="submit" className="btn-secondary w-full justify-center">Search</button>
        </div>
      </form>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="card bg-primary-950/20 border-primary-500/30 flex justify-between items-center py-4">
          <span className="text-primary-400 font-medium text-sm">{selectedIds.length} users selected</span>
          <button onClick={handleBulkDelete} className="btn-danger py-1.5 text-sm">
            Bulk Deactivate
          </button>
        </div>
      )}

      {/* Users table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No users found match criteria</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === users.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Association</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u._id)}
                        onChange={() => toggleSelect(u._id)}
                      />
                    </td>
                    <td>
                      <div className="font-semibold text-white">{u.name}</div>
                      {u.phone && <div className="text-xs text-dark-100/40">{u.phone}</div>}
                    </td>
                    <td>{u.email}</td>
                    <td>{u.username || '-'}</td>
                    <td><span className="badge badge-info">{u.role}</span></td>
                    <td>{u.associationId?.name || '-'}</td>
                    <td>
                      <span className={`badge ${
                        u.status === 'active' ? 'badge-success' :
                        u.status === 'suspended' ? 'badge-danger' : 'badge-pending'
                      }`}>{u.status}</span>
                    </td>
                    <td className="text-right space-x-2">
                      <button onClick={() => handleEditOpen(u)} className="btn-ghost py-1 text-xs">Edit</button>
                      <button onClick={() => handleResetOpen(u)} className="btn-ghost py-1 text-xs text-yellow-500">Reset</button>
                      <button onClick={() => handleToggleStatus(u)} className={`btn-ghost py-1 text-xs ${
                        u.status === 'suspended' ? 'text-green-500' : 'text-orange-500'
                      }`}>
                        {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                      </button>
                      <button onClick={() => handleDelete(u._id)} className="btn-ghost py-1 text-xs text-red-500">Deactivate</button>
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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg space-y-4">
            <h3 className="section-title text-white">Create Login Profile</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input type="text" className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address</label>
                  <input type="email" className="input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="label">Username</label>
                  <input type="text" className="input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Password</label>
                  <input type="password" className="input" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input type="text" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Role Type</label>
                  <select className="input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="player">Player</option>
                    <option value="captain">Captain</option>
                    <option value="vice_captain">Vice Captain</option>
                    <option value="association_head">Association Head</option>
                    <option value="tournament_organizer">Tournament Organizer</option>
                    <option value="ground_officer">Ground Officer</option>
                    <option value="funds_officer">Funds Officer</option>
                  </select>
                </div>
                <div>
                  <label className="label">Link Association</label>
                  <select className="input" value={formData.associationId} onChange={e => setFormData({...formData, associationId: e.target.value})}>
                    <option value="">None / System Global</option>
                    {associations.map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg space-y-4">
            <h3 className="section-title text-white">Edit Login Profile</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input type="text" className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Email Address</label>
                  <input type="email" className="input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="label">Username</label>
                  <input type="text" className="input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone Number</label>
                  <input type="text" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Role Type</label>
                  <select className="input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="player">Player</option>
                    <option value="captain">Captain</option>
                    <option value="vice_captain">Vice Captain</option>
                    <option value="association_head">Association Head</option>
                    <option value="tournament_organizer">Tournament Organizer</option>
                    <option value="ground_officer">Ground Officer</option>
                    <option value="funds_officer">Funds Officer</option>
                  </select>
                </div>
                <div>
                  <label className="label">Link Association</label>
                  <select className="input" value={formData.associationId} onChange={e => setFormData({...formData, associationId: e.target.value})}>
                    <option value="">None / System Global</option>
                    {associations.map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="section-title text-white">Reset credentials</h3>
            <p className="text-xs text-dark-100/60">Generate a new password for {selectedUser?.name}. An automated email alert will be sent.</p>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="label">New Temporary Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input"
                    required
                    value={resetPasswordState.newPassword}
                    onChange={e => setResetPasswordState({...resetPasswordState, newPassword: e.target.value})}
                  />
                  <button type="button" onClick={generatePassword} className="btn-secondary whitespace-nowrap">
                    Auto Gen
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="forceChange"
                  checked={resetPasswordState.forceChange}
                  onChange={e => setResetPasswordState({...resetPasswordState, forceChange: e.target.checked})}
                />
                <label htmlFor="forceChange" className="text-sm font-medium text-dark-100/70 cursor-pointer">
                  Force password change after first login
                </label>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setShowResetModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Execute Reset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
