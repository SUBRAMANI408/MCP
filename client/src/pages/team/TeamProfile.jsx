import React, { useState, useEffect } from 'react';
import { captainApi } from '../../api/captainApi';
import { adminApi } from '../../api/adminApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import FileUpload from '../../components/common/FileUpload';

export default function TeamProfile() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadTeamProfile();
  }, []);

  const loadTeamProfile = () => {
    setLoading(true);
    captainApi.getMyTeam()
      .then(res => {
        const t = res.data.data;
        setTeam(t);
        setName(t.name || '');
        setLogo(t.logo || '');
        setDescription(t.description || '');
      })
      .catch((err) => {
        if (err.response?.status !== 404) {
          toast.error('Failed to load team profile');
        }
      })
      .finally(() => setLoading(false));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setUpdating(true);

    captainApi.updateTeam(team._id, { name, logo, description })
      .then(() => {
        toast.success('Team profile updated successfully');
        loadTeamProfile();
      })
      .catch(() => toast.error('Failed to update team profile'))
      .finally(() => setUpdating(false));
  };

  const handleOpenInvite = () => {
    setShowInviteModal(true);
    api.get('/users', { params: { role: 'player', teamId: 'none', limit: 100 } })
      .then(res => {
        const teamPlayerIds = team.players.map(p => p._id);
        const available = res.data.data.filter(u => !teamPlayerIds.includes(u._id));
        setAllUsers(available);
      })
      .catch(() => {});
  };

  const handleInviteSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlayerId) return toast.error('Please select a player to invite');

    captainApi.invitePlayer(team._id, { userId: selectedPlayerId })
      .then(() => {
        toast.success('Player invited and added to roster');
        setShowInviteModal(false);
        setSelectedPlayerId('');
        loadTeamProfile();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Invite failed'));
  };

  const handleRemovePlayer = (playerId) => {
    if (window.confirm('Are you sure you want to remove this player from the team?')) {
      captainApi.removePlayer(team._id, playerId)
        .then(() => {
          toast.success('Player removed from roster');
          loadTeamProfile();
        })
        .catch(() => toast.error('Failed to remove player'));
    }
  };

  const handlePromoteViceCaptain = (playerId) => {
    if (window.confirm('Promote this player to Vice Captain?')) {
      captainApi.promoteViceCaptain(team._id, { playerId })
        .then(() => {
          toast.success('Player promoted to Vice Captain');
          loadTeamProfile();
        })
        .catch(() => toast.error('Promotion failed'));
    }
  };

  const handleRemoveViceCaptain = () => {
    if (window.confirm('Remove Vice Captain role from this user?')) {
      // Direct update of viceCaptainId to null
      captainApi.updateTeam(team._id, { ...team, viceCaptainId: null })
        .then(() => {
          toast.success('Vice Captain removed');
          loadTeamProfile();
        })
        .catch(() => toast.error('Action failed'));
    }
  };

  // State for team registration if none exists
  const [assocList, setAssocList] = useState([]);
  const [selectedAssocId, setSelectedAssocId] = useState('');
  const [createSport, setCreateSport] = useState('cricket');

  useEffect(() => {
    if (!team) {
      api.get('/associations', { params: { limit: 100 } })
        .then(res => setAssocList(res.data.data || []))
        .catch(() => {});
    }
  }, [team]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Team name is required');
    if (!selectedAssocId) return toast.error('Please select an association');
    setUpdating(true);
    try {
      await api.post('/teams', {
        name: name.trim(),
        sport: createSport,
        associationId: selectedAssocId
      });
      toast.success('Team created successfully!');
      loadTeamProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team');
    } finally {
      setUpdating(false);
    }
  };

  if (!team) return (
    <div className="max-w-md mx-auto card space-y-4">
      <h3 className="section-title text-white">Register Your Team</h3>
      <p className="text-xs text-dark-100/50">You don't have a team profile configured yet. Fill out the details below to register your team.</p>
      <form onSubmit={handleCreateTeam} className="space-y-4">
        <div>
          <label className="label">Team Name</label>
          <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Warriors FC" required />
        </div>
        <div>
          <label className="label">Sport</label>
          <select className="input" value={createSport} onChange={e => setCreateSport(e.target.value)}>
            <option value="cricket">Cricket</option>
            <option value="football">Football</option>
            <option value="volleyball">Volleyball</option>
            <option value="basketball">Basketball</option>
            <option value="kabaddi">Kabaddi</option>
            <option value="badminton">Badminton</option>
            <option value="hockey">Hockey</option>
          </select>
        </div>
        <div>
          <label className="label">Select Association</label>
          <select className="input" value={selectedAssocId} onChange={e => setSelectedAssocId(e.target.value)} required>
            <option value="">Choose association…</option>
            {assocList.map(a => (
              <option key={a._id} value={a._id}>{a.name} ({a.city})</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={updating} className="btn-primary w-full justify-center">
          {updating ? 'Creating Team...' : 'Create & Register Team'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Team Profile</h1>
          <p className="text-dark-100/60 text-sm mt-1">Configure your team information, upload brand assets, and coordinate rosters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card / Identity */}
        <div className="card flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white">{name[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{name}</h3>
            <p className="text-xs text-dark-100/50 capitalize">Sport: {team.sport}</p>
          </div>

          <div className="w-full border-t border-dark-700/50 pt-4 text-left space-y-3">
            <div>
              <span className="text-[10px] text-dark-100/40 uppercase font-bold block mb-1">Description</span>
              <p className="text-xs text-dark-100/70">{description || 'No description provided'}</p>
            </div>
            
            <div className="flex justify-between items-center text-xs border-t border-dark-700/50 pt-3">
              <span className="text-dark-100/40">Vice Captain:</span>
              {team.viceCaptainId ? (
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{team.viceCaptainId.name}</span>
                  <button onClick={handleRemoveViceCaptain} className="text-[10px] text-red-400 hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <span className="text-dark-100/60 font-medium">None Assigned</span>
              )}
            </div>
          </div>
        </div>

        {/* Edit profile form */}
        <div className="card lg:col-span-2">
          <form onSubmit={handleUpdate} className="space-y-4">
            <h3 className="font-semibold text-white">Edit Team Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Team Name</label>
                <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Team Logo</label>
                <FileUpload
                  type="image"
                  value={logo}
                  onChange={setLogo}
                  label="Upload Team Logo"
                  folder="teams"
                />
              </div>
            </div>

            <div>
              <label className="label">Team Description / Mission</label>
              <textarea className="input min-h-[80px]" placeholder="Add team details here..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <button type="submit" disabled={updating} className="btn-primary w-full justify-center">
              {updating ? 'Saving Profile Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Players Roster */}
        <div className="card lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white">Team Roster ({team.players?.length || 0})</h3>
            <button onClick={handleOpenInvite} className="btn-secondary py-1.5 text-xs">
              Invite Player
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.players?.map(p => (
                  <tr key={p._id}>
                    <td>
                      <span className="font-semibold text-white">{p.name}</span>
                      {team.captainId?._id === p._id && <span className="badge badge-info text-[9px] py-0.5 ml-2">Captain</span>}
                      {team.viceCaptainId?._id === p._id && <span className="badge badge-pending text-[9px] py-0.5 ml-2">Vice Captain</span>}
                    </td>
                    <td>{p.email}</td>
                    <td><span className="badge badge-success capitalize">{p.role}</span></td>
                    <td className="text-right space-x-2">
                      {p._id !== team.captainId?._id && (
                        <>
                          {team.viceCaptainId?._id !== p._id && (
                            <button onClick={() => handlePromoteViceCaptain(p._id)} className="btn-ghost py-1 text-xs text-yellow-500">
                              Promote VC
                            </button>
                          )}
                          <button onClick={() => handleRemovePlayer(p._id)} className="btn-ghost py-1 text-xs text-red-500">
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Invite Player Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="section-title text-white">Invite Player</h3>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="label">Select Available Player</label>
                <select className="input" required value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)}>
                  <option value="">Choose Player</option>
                  {allUsers.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowInviteModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Player</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
