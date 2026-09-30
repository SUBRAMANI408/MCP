import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { captainApi } from '../../api/captainApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function FriendlyMatches() {
  const { user } = useAuthStore();
  const [team, setTeam] = useState(null);
  const [friendlies, setFriendlies] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedFriendly, setSelectedFriendly] = useState(null);

  // Form states
  const [targetTeamId, setTargetTeamId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [groundId, setGroundId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.teamId) {
      loadFriendlyData();
    }
  }, [user]);

  const loadFriendlyData = () => {
    setLoading(true);
    Promise.all([
      captainApi.getMyTeam().catch(() => null),
      captainApi.getFriendlyMatches().catch(() => ({ data: { data: [] } })),
      api.get(`/teams?associationId=${user.associationId}&status=approved`).catch(() => ({ data: { data: [] } })),
      api.get('/grounds').catch(() => ({ data: { data: [] } }))
    ])
      .then(([teamRes, friendliesRes, teamsRes, groundsRes]) => {
        if (teamRes) setTeam(teamRes.data.data);
        setFriendlies(friendliesRes.data.data || []);
        
        // Filter out my own team from available list
        const filteredTeams = (teamsRes.data.data || []).filter(t => t._id !== user.teamId);
        setAvailableTeams(filteredTeams);

        setGrounds(groundsRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load friendly match details'))
      .finally(() => setLoading(false));
  };

  const handleSendRequest = (e) => {
    e.preventDefault();
    if (!targetTeamId) return toast.error('Please select an opponent team');

    const payload = {
      respondingTeamId: targetTeamId,
      sport: team.sport,
      groundId: groundId || null,
      date: date || null,
      time: time || null,
      message
    };

    captainApi.sendFriendlyRequest(payload)
      .then(() => {
        toast.success('Friendly match challenge dispatched');
        setShowRequestModal(false);
        setTargetTeamId('');
        setDate('');
        setTime('');
        setGroundId('');
        setMessage('');
        loadFriendlyData();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Challenge dispatch failed'));
  };

  const handleAccept = (id) => {
    if (window.confirm('Accept this friendly challenge?')) {
      captainApi.acceptFriendlyMatch(id)
        .then(() => {
          toast.success('Friendly match accepted!');
          loadFriendlyData();
        })
        .catch(() => toast.error('Accept action failed'));
    }
  };

  const handleReject = (id) => {
    if (window.confirm('Reject this friendly challenge?')) {
      captainApi.rejectFriendlyMatch(id)
        .then(() => {
          toast.success('Friendly challenge rejected');
          loadFriendlyData();
        })
        .catch(() => toast.error('Reject action failed'));
    }
  };

  const handleCancel = (id) => {
    if (window.confirm('Cancel this friendly match request?')) {
      captainApi.cancelFriendlyMatch(id)
        .then(() => {
          toast.success('Challenge cancelled');
          loadFriendlyData();
        })
        .catch(() => toast.error('Cancel action failed'));
    }
  };

  const handleOpenReschedule = (friendly) => {
    setSelectedFriendly(friendly);
    setDate(friendly.date ? new Date(friendly.date).toISOString().split('T')[0] : '');
    setTime(friendly.time || '');
    setGroundId(friendly.groundId?._id || friendly.groundId || '');
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    captainApi.rescheduleFriendlyMatch(selectedFriendly._id, { date, time, groundId })
      .then(() => {
        toast.success('Friendly match rescheduled, pending approval');
        setShowRescheduleModal(false);
        loadFriendlyData();
      })
      .catch(() => toast.error('Reschedule failed'));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Friendly Matches</h1>
          <p className="text-dark-100/60 text-sm mt-1">Coordinate practice games, send challenges to other teams, or resolve incoming invitations</p>
        </div>
        <button onClick={() => setShowRequestModal(true)} className="btn-primary">
          Challenge Team
        </button>
      </div>

      {/* Friendly matches logs */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white">Your Friendly Match Logs</h3>
        
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : friendlies.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No friendly match logs recorded. Click "Challenge Team" to send one.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Opponent</th>
                  <th>Match Sport</th>
                  <th>Ground / Pitch</th>
                  <th>Schedule Date / Time</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {friendlies.map(f => {
                  const isRequesting = f.requestingTeamId?._id === user.teamId;
                  const opponent = isRequesting ? f.respondingTeamId : f.requestingTeamId;
                  
                  return (
                    <tr key={f._id}>
                      <td><span className="font-semibold text-white">{opponent?.name || 'Unknown Team'}</span></td>
                      <td><span className="badge badge-info">{f.sport}</span></td>
                      <td>{f.groundId?.name || 'TBD Ground'}</td>
                      <td>
                        {f.date ? new Date(f.date).toLocaleDateString() : 'N/A'} — {f.time || 'N/A'}
                      </td>
                      <td>
                        <span className={`badge ${
                          f.status === 'accepted' ? 'badge-success' :
                          f.status === 'pending' ? 'badge-pending' : 'badge-danger'
                        } capitalize`}>{f.status}</span>
                      </td>
                      <td className="text-right space-x-2">
                        {f.status === 'pending' && !isRequesting && (
                          <>
                            <button onClick={() => handleAccept(f._id)} className="btn-ghost py-1 text-xs text-green-500">Accept</button>
                            <button onClick={() => handleReject(f._id)} className="btn-ghost py-1 text-xs text-red-500">Reject</button>
                          </>
                        )}
                        {f.status === 'pending' && isRequesting && (
                          <button onClick={() => handleCancel(f._id)} className="btn-ghost py-1 text-xs text-red-500">Cancel</button>
                        )}
                        {f.status !== 'cancelled' && f.status !== 'rejected' && (
                          <button onClick={() => handleOpenReschedule(f)} className="btn-ghost py-1 text-xs text-yellow-500">
                            Reschedule
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Challenge opponent modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg space-y-4">
            <h3 className="section-title text-white">Challenge Opponent Team</h3>
            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="label">Select Opponent Team</label>
                <select className="input" required value={targetTeamId} onChange={e => setTargetTeamId(e.target.value)}>
                  <option value="">Select Team</option>
                  {availableTeams.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Preferred Date</label>
                  <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="label">Preferred Time</label>
                  <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Preferred Ground / Pitch</label>
                <select className="input" value={groundId} onChange={e => setGroundId(e.target.value)}>
                  <option value="">Select Ground (Optional)</option>
                  {grounds.map(g => (
                    <option key={g._id} value={g._id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Custom Message (Optional)</label>
                <textarea className="input min-h-[80px]" placeholder="Add details or rules for friendly match request..." value={message} onChange={e => setMessage(e.target.value)} />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowRequestModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Dispatch Challenge</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="section-title text-white">Reschedule Friendly Match</h3>
            <form onSubmit={handleRescheduleSubmit} className="space-y-4">
              <div>
                <label className="label">Preferred Date</label>
                <input type="date" className="input" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Preferred Time</label>
                <input type="time" className="input" required value={time} onChange={e => setTime(e.target.value)} />
              </div>
              <div>
                <label className="label">Preferred Ground</label>
                <select className="input" required value={groundId} onChange={e => setGroundId(e.target.value)}>
                  <option value="">Select Ground</option>
                  {grounds.map(g => (
                    <option key={g._id} value={g._id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowRescheduleModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Request Reschedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
