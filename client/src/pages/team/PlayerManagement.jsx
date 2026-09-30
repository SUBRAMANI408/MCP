import React, { useState, useEffect } from 'react';
import { captainApi } from '../../api/captainApi';
import { adminApi } from '../../api/adminApi';
import api from '../../api/axios';
import { useAuthStore } from '../../app/store';
import toast from 'react-hot-toast';
import {
  UserPlusIcon, TrashIcon, StarIcon, UserGroupIcon,
  MagnifyingGlassIcon, PhoneIcon, EnvelopeIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';

const RoleBadge = ({ role, isCaptain, isViceCaptain }) => {
  if (isCaptain) return <span className="badge badge-info text-[9px]">Captain</span>;
  if (isViceCaptain) return <span className="badge badge-pending text-[9px]">Vice Captain</span>;
  return <span className="badge badge-success capitalize text-[9px]">{role || 'Player'}</span>;
};

export default function PlayerManagement() {
  const { user } = useAuthStore();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = () => {
    setLoading(true);
    captainApi.getMyTeam()
      .then(res => setTeam(res.data.data))
      .catch(() => toast.error('Failed to load team'))
      .finally(() => setLoading(false));
  };

  const handleOpenInvite = () => {
    setShowInviteModal(true);
    setLoadingPlayers(true);
    adminApi.getUsers({ role: 'player', limit: 200 })
      .then(res => {
        const teamPlayerIds = new Set(team?.players?.map(p => p._id) || []);
        const available = res.data.data.filter(u => !teamPlayerIds.has(u._id) && !u.teamId);
        setAvailablePlayers(available);
      })
      .catch(() => toast.error('Could not load player list'))
      .finally(() => setLoadingPlayers(false));
  };

  const handleInvite = () => {
    if (!selectedPlayer) return toast.error('Select a player first');
    setInviting(true);
    captainApi.invitePlayer(team._id, { userId: selectedPlayer._id })
      .then(() => {
        toast.success(`${selectedPlayer.name} added to roster!`);
        setShowInviteModal(false);
        setSelectedPlayer(null);
        loadTeam();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to invite player'))
      .finally(() => setInviting(false));
  };

  const handleRemove = (player) => {
    if (window.confirm(`Remove ${player.name} from the team?`)) {
      captainApi.removePlayer(team._id, player._id)
        .then(() => { toast.success('Player removed'); loadTeam(); })
        .catch(() => toast.error('Failed to remove player'));
    }
  };

  const handlePromoteVC = (player) => {
    if (window.confirm(`Promote ${player.name} to Vice Captain?`)) {
      captainApi.promoteViceCaptain(team._id, { playerId: player._id })
        .then(() => { toast.success('Vice Captain updated'); loadTeam(); })
        .catch(() => toast.error('Promotion failed'));
    }
  };

  const handleDemoteVC = () => {
    if (window.confirm('Remove Vice Captain role?')) {
      captainApi.updateTeam(team._id, { viceCaptainId: null })
        .then(() => { toast.success('Vice Captain removed'); loadTeam(); })
        .catch(() => toast.error('Action failed'));
    }
  };

  const filteredRoster = team?.players?.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredAvailable = availablePlayers.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!team) return (
    <div className="card text-center py-12 text-dark-100/50">
      No team found. You are not currently assigned as captain of any team.
    </div>
  );

  const isCaptain = user?._id === team.captainId?._id;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Player Management</h1>
          <p className="text-dark-100/60 text-sm mt-1">
            Manage your team roster — invite players, set roles, and build your squad
          </p>
        </div>
        {isCaptain && (
          <button onClick={handleOpenInvite} className="btn-primary gap-2">
            <UserPlusIcon className="w-4 h-4" />
            Invite Player
          </button>
        )}
      </div>

      {/* Team Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Players', value: team.players?.length || 0, color: 'from-primary-500 to-primary-700' },
          { label: 'Captain', value: team.captainId?.name || 'N/A', color: 'from-yellow-500 to-orange-500' },
          { label: 'Vice Captain', value: team.viceCaptainId?.name || 'Not Set', color: 'from-purple-500 to-purple-700' },
          { label: 'Association', value: team.associationId?.name || '-', color: 'from-sport-500 to-sport-700' },
        ].map(stat => (
          <div key={stat.label} className="card">
            <p className="text-dark-100/50 text-xs font-medium">{stat.label}</p>
            <p className="text-white font-bold text-lg mt-1 truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Roster Table */}
      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <h3 className="font-semibold text-white">Team Roster ({filteredRoster.length})</h3>
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-100/40" />
            <input
              type="text"
              className="input pl-9 py-2 text-sm"
              placeholder="Search players..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Contact</th>
                <th>Role</th>
                {isCaptain && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRoster.map((p, idx) => {
                const isCap = team.captainId?._id === p._id;
                const isVC = team.viceCaptainId?._id === p._id;
                return (
                  <tr key={p._id}>
                    <td className="text-dark-100/40 text-sm">{idx + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {p.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{p.name}</p>
                          <div className="flex gap-1 mt-0.5">
                            <RoleBadge role={p.role} isCaptain={isCap} isViceCaptain={isVC} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-dark-100/60">
                          <EnvelopeIcon className="w-3 h-3" />{p.email}
                        </div>
                        {p.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-dark-100/40">
                            <PhoneIcon className="w-3 h-3" />{p.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge capitalize ${isCap ? 'badge-info' : isVC ? 'badge-pending' : 'badge-success'}`}>
                        {isCap ? 'Captain' : isVC ? 'Vice Captain' : 'Player'}
                      </span>
                    </td>
                    {isCaptain && (
                      <td className="text-right">
                        {!isCap && (
                          <div className="flex items-center justify-end gap-2">
                            {isVC ? (
                              <button onClick={handleDemoteVC} className="btn-ghost py-1 px-2 text-xs text-orange-400">
                                Remove VC
                              </button>
                            ) : (
                              <button onClick={() => handlePromoteVC(p)} className="btn-ghost py-1 px-2 text-xs text-yellow-400 flex items-center gap-1">
                                <StarIcon className="w-3 h-3" /> Make VC
                              </button>
                            )}
                            <button onClick={() => handleRemove(p)} className="btn-ghost py-1 px-2 text-xs text-red-400 flex items-center gap-1">
                              <TrashIcon className="w-3 h-3" /> Remove
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredRoster.length === 0 && (
                <tr>
                  <td colSpan={isCaptain ? 5 : 4} className="text-center text-dark-100/40 py-8 text-sm">
                    No players found matching your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Player Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center">
              <h3 className="section-title text-white">Invite Player to Roster</h3>
              <button onClick={() => { setShowInviteModal(false); setSelectedPlayer(null); setSearchQuery(''); }}
                className="btn-ghost p-1 text-dark-100/50">✕</button>
            </div>

            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-100/40" />
              <input
                type="text"
                className="input pl-9"
                placeholder="Search players by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
              {loadingPlayers ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
                </div>
              ) : filteredAvailable.length === 0 ? (
                <p className="text-center text-dark-100/40 text-sm py-8">No available players found</p>
              ) : (
                filteredAvailable.map(p => (
                  <button
                    key={p._id}
                    onClick={() => setSelectedPlayer(p)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedPlayer?._id === p._id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-dark-700/30 bg-dark-900 hover:border-dark-600/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sport-500 to-primary-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {p.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-dark-100/50">{p.email}</p>
                    </div>
                    {selectedPlayer?._id === p._id && (
                      <ShieldCheckIcon className="w-5 h-5 text-primary-400 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-dark-700/50">
              <button onClick={() => { setShowInviteModal(false); setSelectedPlayer(null); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!selectedPlayer || inviting}
                className="btn-primary flex-1 justify-center"
              >
                {inviting ? 'Adding...' : selectedPlayer ? `Add ${selectedPlayer.name}` : 'Select a Player'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
