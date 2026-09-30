import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { associationApi } from '../../api/associationApi';
import toast from 'react-hot-toast';

export default function ManageOrganizers() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal control states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTempModal, setShowTempModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  // Forms state
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', username: '', role: 'tournament_organizer', status: 'active'
  });
  const [tempData, setTempData] = useState({
    captainId: '', assignedDate: '', startTime: '09:00', endTime: '17:00', reason: 'Tournament assignment'
  });

  useEffect(() => {
    if (user?.associationId) {
      loadMembers();
    }
  }, [user]);

  const loadMembers = () => {
    setLoading(true);
    associationApi.getMembers(user.associationId)
      .then(res => setMembers(res.data.data))
      .catch(() => toast.error('Failed to load association members list'))
      .finally(() => setLoading(false));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    let promise;
    if (formData.role === 'tournament_organizer') {
      promise = associationApi.createOrganizer(user.associationId, formData);
    } else if (formData.role === 'ground_officer') {
      promise = associationApi.createGroundOfficer(user.associationId, formData);
    } else if (formData.role === 'funds_officer') {
      promise = associationApi.createFundsOfficer(user.associationId, formData);
    } else {
      return toast.error('Invalid role selected for creation');
    }

    promise
      .then(() => {
        toast.success('Officer created successfully');
        setShowCreateModal(false);
        setFormData({ name: '', email: '', password: '', phone: '', username: '', role: 'tournament_organizer', status: 'active' });
        loadMembers();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to create officer'));
  };

  const handleEditOpen = (officer) => {
    setSelectedOfficer(officer);
    setFormData({
      name: officer.name || '',
      email: officer.email || '',
      phone: officer.phone || '',
      username: officer.username || '',
      role: officer.role || 'tournament_organizer',
      status: officer.status || 'active',
      password: ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    associationApi.updateOfficer(user.associationId, selectedOfficer._id, formData)
      .then(() => {
        toast.success('Officer details updated');
        setShowEditModal(false);
        loadMembers();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to save changes'));
  };

  const handleDelete = (officerId) => {
    if (window.confirm('Are you sure you want to permanently delete this officer?')) {
      associationApi.deleteOfficer(user.associationId, officerId)
        .then(() => {
          toast.success('Officer removed successfully');
          loadMembers();
        })
        .catch(() => toast.error('Failed to remove officer'));
    }
  };

  const handleTempSubmit = (e) => {
    e.preventDefault();
    if (!tempData.captainId) return toast.error('Please select a Team Captain');

    associationApi.assignTempOrganizer(user.associationId, tempData)
      .then(() => {
        toast.success('Temporary Tournament Organizer assigned successfully');
        setShowTempModal(false);
        setTempData({ captainId: '', assignedDate: '', startTime: '09:00', endTime: '17:00', reason: 'Tournament assignment' });
        loadMembers();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to assign role'));
  };

  const handleRevokeTemp = (captainId) => {
    if (window.confirm('Revoke temporary tournament organizer assignment?')) {
      associationApi.revokeTempOrganizer(user.associationId, captainId)
        .then(() => {
          toast.success('Temporary role revoked');
          loadMembers();
        })
        .catch(() => toast.error('Failed to revoke role'));
    }
  };

  // Filters for role lists
  const officers = members.filter(m => ['tournament_organizer', 'ground_officer', 'funds_officer'].includes(m.role));
  const captains = members.filter(m => m.role === 'captain');
  const tempOrganizers = members.filter(m => m.tempOrganizer?.isTemp);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Officer Management</h1>
          <p className="text-dark-100/60 text-sm mt-1">Configure officers, allocate roles, and assign Temporary Tournament Organizers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTempModal(true)} className="btn-secondary">
            Assign Temporary Organizer
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            Create Officer
          </button>
        </div>
      </div>

      {/* Temporary Organizers timeline/list */}
      {tempOrganizers.length > 0 && (
        <div className="card border-primary-500/30 bg-primary-950/10 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Temporary Organizers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tempOrganizers.map(o => (
              <div key={o._id} className="card-sm bg-dark-900 border border-dark-700/50 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white">{o.name}</div>
                  <div className="text-xs text-dark-100/50 mt-0.5">Time: {o.tempOrganizer.startTime} - {o.tempOrganizer.endTime}</div>
                  <div className="text-[10px] text-dark-100/40">Reason: {o.tempOrganizer.reason}</div>
                </div>
                <button onClick={() => handleRevokeTemp(o._id)} className="btn-danger py-1 px-3 text-xs">
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Officers List */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white">Registered Officers</h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : officers.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No officers registered. Click "Create Officer" to get started.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {officers.map(o => (
                  <tr key={o._id}>
                    <td><span className="font-semibold text-white">{o.name}</span></td>
                    <td>{o.username || '-'}</td>
                    <td>{o.email}</td>
                    <td>{o.phone || '-'}</td>
                    <td>
                      <span className="badge badge-info capitalize">{o.role?.replace('_', ' ')}</span>
                    </td>
                    <td>
                      <span className={`badge ${o.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="text-right space-x-2">
                      <button onClick={() => handleEditOpen(o)} className="btn-ghost py-1 text-xs">Edit</button>
                      <button onClick={() => handleDelete(o._id)} className="btn-ghost py-1 text-xs text-red-500">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Officer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg space-y-4">
            <h3 className="section-title text-white">Create Officer Profile</h3>
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
                  <input type="text" className="input" placeholder="Optional" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Temporary Password</label>
                  <input type="password" className="input" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input type="text" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Role Type</label>
                <select className="input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="tournament_organizer">Tournament Organizer</option>
                  <option value="ground_officer">Ground Booking Allocation Officer</option>
                  <option value="funds_officer">Funds Officer</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Officer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Officer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg space-y-4">
            <h3 className="section-title text-white">Edit Officer Profile</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
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
                  <label className="label">Status</label>
                  <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
                    <option value="tournament_organizer">Tournament Organizer</option>
                    <option value="ground_officer">Ground Booking Allocation Officer</option>
                    <option value="funds_officer">Funds Officer</option>
                  </select>
                </div>
                <div>
                  <label className="label">Change Password (optional)</label>
                  <input type="password" className="input" placeholder="Type new password..." value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Temporary Organizer Modal */}
      {showTempModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="section-title text-white">Assign Temporary Organizer</h3>
            <form onSubmit={handleTempSubmit} className="space-y-4">
              <div>
                <label className="label">Select Active Team Captain</label>
                <select className="input" required value={tempData.captainId} onChange={e => setTempData({...tempData, captainId: e.target.value})}>
                  <option value="">Select Captain</option>
                  {captains.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Assigned Date</label>
                <input type="date" className="input" required value={tempData.assignedDate} onChange={e => setTempData({...tempData, assignedDate: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time</label>
                  <input type="time" className="input" required value={tempData.startTime} onChange={e => setTempData({...tempData, startTime: e.target.value})} />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="time" className="input" required value={tempData.endTime} onChange={e => setTempData({...tempData, endTime: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="label">Reason / Notes</label>
                <textarea className="input min-h-[80px]" required value={tempData.reason} onChange={e => setTempData({...tempData, reason: e.target.value})} />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowTempModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Assign Role</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
