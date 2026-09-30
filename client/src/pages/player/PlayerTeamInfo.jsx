import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { UserGroupIcon, ChatBubbleLeftRightIcon, TrophyIcon } from '@heroicons/react/24/outline';

export default function PlayerTeamInfo() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [team, setTeam] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamInfo();
  }, []);

  const loadTeamInfo = async () => {
    setLoading(true);
    try {
      const [teamRes, tourRes] = await Promise.all([
        api.get('/teams/my-team').catch(() => null),
        api.get('/tournaments', { params: { limit: 10 } }).catch(() => ({ data: { data: [] } })),
      ]);
      if (teamRes && teamRes.data.data) {
        setTeam(teamRes.data.data);
        setTournaments(tourRes.data.data || []);
      }
    } catch {
      toast.error('Failed to load team info');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-sport-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!team) return (
    <div className="card text-center py-12">
      <UserGroupIcon className="w-12 h-12 text-dark-100/20 mx-auto mb-3" />
      <h3 className="text-lg font-bold text-white mb-2">No Team Assigned</h3>
      <p className="text-sm text-dark-100/60">You are not currently assigned to any team.</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Team Information</h1>
          <p className="text-dark-100/60 text-sm mt-1">View your team profile, roster, and tournament history</p>
        </div>
      </div>

      {/* Team Header Card */}
      <div className="card bg-gradient-to-r from-primary-600/10 to-sport-600/10 border-primary-500/20">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 overflow-hidden">
            {team.logo ? <img src={team.logo} alt="logo" className="w-full h-full object-cover" /> : team.name?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{team.name}</h2>
            <p className="text-dark-100/50 text-sm capitalize">{team.sport} • {team.associationId?.name}</p>
            <span className={`badge mt-2 text-xs ${team.status === 'approved' ? 'badge-success' : 'badge-pending'}`}>
              {team.status}
            </span>
          </div>
          <button
            onClick={() => navigate(`/chat/${team._id}`)}
            className="btn-secondary gap-2 text-sm"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            Team Chat
          </button>
        </div>
        {team.description && (
          <p className="text-dark-100/60 text-sm mt-4 border-t border-dark-700/50 pt-4">{team.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leadership */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Team Leadership</h3>
          <div className="space-y-3">
            {[
              { label: 'Captain', person: team.captainId, badge: 'badge-info' },
              { label: 'Vice Captain', person: team.viceCaptainId, badge: 'badge-pending' },
            ].map(({ label, person, badge }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-dark-900 border border-dark-700/30">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {person?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{person?.name || 'Not Assigned'}</p>
                  <p className="text-xs text-dark-100/50">{person?.email || ''}</p>
                </div>
                <span className={`badge ${badge} text-xs`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team Stats */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Team Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Players', value: team.players?.length || 0 },
              { label: 'Matches Played', value: team.matchesPlayed || 0 },
              { label: 'Wins', value: team.wins || 0 },
              { label: 'Losses', value: team.losses || 0 },
              { label: 'Draws', value: team.draws || 0 },
              { label: 'Win Rate', value: team.matchesPlayed > 0 ? `${((team.wins || 0) / team.matchesPlayed * 100).toFixed(1)}%` : '0%' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-dark-900 border border-dark-700/30 text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-dark-100/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white">Team Roster ({team.players?.length || 0} Players)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {team.players?.map(p => {
            const isCap = p._id === team.captainId?._id;
            const isVC = p._id === team.viceCaptainId?._id;
            const isMe = p._id === user?._id;
            return (
              <div key={p._id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isMe ? 'border-sport-500/40 bg-sport-500/5' : 'border-dark-700/30 bg-dark-900'
              }`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${
                  isCap ? 'bg-yellow-600' : isVC ? 'bg-purple-600' : 'bg-primary-600'
                }`}>
                  {p.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {p.name} {isMe && <span className="text-sport-400 text-xs">(You)</span>}
                  </p>
                  <p className="text-xs text-dark-100/40 truncate">{p.email}</p>
                </div>
                <span className={`badge text-[9px] flex-shrink-0 ${isCap ? 'badge-info' : isVC ? 'badge-pending' : 'badge-success'}`}>
                  {isCap ? 'C' : isVC ? 'VC' : 'P'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Registered Tournaments */}
      {tournaments.length > 0 && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <TrophyIcon className="w-4 h-4 text-primary-400" />
            Available Tournaments
          </h3>
          <div className="space-y-2">
            {tournaments.slice(0, 5).map(t => (
              <div key={t._id} className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-700/30">
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-dark-100/40">{t.sport} • {t.associationId?.name}</p>
                </div>
                <span className={`badge text-xs capitalize ${
                  t.status === 'ongoing' ? 'badge-danger' :
                  t.status === 'approved' ? 'badge-success' :
                  t.status === 'completed' ? 'badge-info' : 'badge-pending'
                }`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
