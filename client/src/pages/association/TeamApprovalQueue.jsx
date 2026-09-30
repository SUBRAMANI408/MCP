import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { associationApi } from '../../api/associationApi';
import toast from 'react-hot-toast';

export default function TeamApprovalQueue() {
  const { user } = useAuthStore();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [reason, setReason] = useState('');
  const [showRosterModal, setShowRosterModal] = useState(false);

  useEffect(() => {
    if (user?.associationId) {
      loadTeams();
    }
  }, [user, page, statusFilter]);

  const loadTeams = () => {
    setLoading(true);
    associationApi.getTeams(user.associationId, {
      page,
      limit: 10,
      status: statusFilter
    })
      .then(res => {
        setTeams(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      })
      .catch(() => toast.error('Failed to load association teams'))
      .finally(() => setLoading(false));
  };

  const handleApprove = (teamId) => {
    if (window.confirm('Approve this team registration?')) {
      associationApi.approveTeam(teamId)
        .then(() => {
          toast.success('Team registration approved successfully');
          loadTeams();
        })
        .catch(() => toast.error('Approve request failed'));
    }
  };

  const handleOpenReject = (team) => {
    setSelectedTeam(team);
    setReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return toast.error('Please specify a rejection reason');

    associationApi.rejectTeam(selectedTeam._id, { reason })
      .then(() => {
        toast.success('Team registration rejected/returned for modification');
        setShowRejectModal(false);
        loadTeams();
      })
      .catch(() => toast.error('Rejection request failed'));
  };

  const handleSuspend = (teamId) => {
    if (window.confirm('Suspend this team? This changes status to rejected.')) {
      associationApi.suspendTeam(teamId)
        .then(() => {
          toast.success('Team suspended successfully');
          loadTeams();
        })
        .catch(() => toast.error('Suspension failed'));
    }
  };

  const handleReactivate = (teamId) => {
    if (window.confirm('Reactivate this team? This changes status to approved.')) {
      associationApi.reactivateTeam(teamId)
        .then(() => {
          toast.success('Team reactivated successfully');
          loadTeams();
        })
        .catch(() => toast.error('Reactivation failed'));
    }
  };

  const handleViewRoster = (team) => {
    setSelectedTeam(team);
    setShowRosterModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Team Management</h1>
          <p className="text-dark-100/60 text-sm mt-1">Review team applications, manage statuses (approve/reject/suspend/reactivate), and inspect player rosters</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="card flex gap-2 py-4">
        {['', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${
              statusFilter === status ? 'bg-primary-600 text-white' : 'bg-dark-900 text-dark-100/60 hover:bg-dark-700/50'
            }`}
          >
            {status === '' ? 'All Teams' : status}
          </button>
        ))}
      </div>

      {/* Teams list */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : teams.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No teams found matching the criteria</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Sport</th>
                  <th>Captain</th>
                  <th>Vice Captain</th>
                  <th>Total Players</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(t => (
                  <tr key={t._id}>
                    <td>
                      <span className="font-semibold text-white">{t.name}</span>
                      {t.rejectionReason && <div className="text-[10px] text-red-400 mt-0.5">Reason: {t.rejectionReason}</div>}
                    </td>
                    <td><span className="badge badge-info">{t.sport}</span></td>
                    <td>{t.captainId?.name || 'N/A'}</td>
                    <td>{t.viceCaptainId?.name || 'None'}</td>
                    <td>{t.players?.length || 0} roster size</td>
                    <td>
                      <span className={`badge ${
                        t.status === 'approved' ? 'badge-success' :
                        t.status === 'pending' ? 'badge-pending' : 'badge-danger'
                      }`}>{t.status}</span>
                    </td>
                    <td className="text-right space-x-2">
                      <button onClick={() => handleViewRoster(t)} className="btn-ghost py-1 text-xs">Roster</button>
                      
                      {t.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(t._id)} className="btn-ghost py-1 text-xs text-green-500">Approve</button>
                          <button onClick={() => handleOpenReject(t)} className="btn-ghost py-1 text-xs text-red-500">Reject</button>
                        </>
                      )}

                      {t.status === 'approved' && (
                        <button onClick={() => handleSuspend(t._id)} className="btn-ghost py-1 text-xs text-orange-500">Suspend</button>
                      )}

                      {t.status === 'rejected' && (
                        <button onClick={() => handleReactivate(t._id)} className="btn-ghost py-1 text-xs text-green-500">Reactivate</button>
                      )}
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="section-title text-white">Reject Team Application</h3>
            <p className="text-xs text-dark-100/60">Specify the reason. This message will be sent to the team captain so they can modify and resubmit.</p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="label">Rejection/Modification Reason</label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="e.g. Please update player list with contact numbers..."
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setShowRejectModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary btn-danger">Reject Application</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Roster View Modal */}
      {showRosterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="section-title text-white">Roster: {selectedTeam?.name}</h3>
            
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-dark-100/50 uppercase tracking-wider">Captain</h4>
              <div className="p-3 bg-dark-900 border border-dark-700/30 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <div className="font-semibold text-white">{selectedTeam?.captainId?.name}</div>
                  <div className="text-dark-100/40">{selectedTeam?.captainId?.email}</div>
                </div>
                <span className="badge badge-info">Captain</span>
              </div>

              <h4 className="text-xs font-bold text-dark-100/50 uppercase tracking-wider">Players Roster ({selectedTeam?.players?.length || 0})</h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {(selectedTeam?.players || []).length === 0 ? (
                  <p className="text-xs text-dark-100/40 text-center py-4">No players listed in roster</p>
                ) : (
                  selectedTeam.players.map(p => (
                    <div key={p._id} className="p-2.5 bg-dark-900/60 border border-dark-700/20 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <div className="font-medium text-white">{p.name}</div>
                        <div className="text-dark-100/40">{p.email || 'No email'}</div>
                      </div>
                      <span className="badge badge-success capitalize">{p.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-dark-700/50">
              <button type="button" onClick={() => setShowRosterModal(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
