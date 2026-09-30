import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  UserGroupIcon, TrophyIcon, PlayIcon, ClockIcon,
  CheckCircleIcon, XCircleIcon, FireIcon, ArrowTrendingUpIcon,
  BellIcon, CalendarDaysIcon, StarIcon
} from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="card hover:border-dark-600/50 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-dark-100/60 text-xs font-medium">{title}</p>
        <p className="text-2xl font-bold text-white mt-1 truncate">{value ?? '-'}</p>
        {subtitle && <p className="text-xs text-dark-100/40 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center flex-shrink-0 ml-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [teamRes, notifRes] = await Promise.all([
        api.get('/teams/my-team').catch(() => null),
        api.get('/notifications', { params: { limit: 5 } }).catch(() => ({ data: { data: [] } })),
      ]);

      if (teamRes) setTeam(teamRes.data.data);
      setNotifications(notifRes.data.data || []);

      if (teamRes?.data?.data?._id) {
        const matchRes = await api.get('/matches', {
          params: { teamId: teamRes.data.data._id, limit: 20 }
        }).catch(() => ({ data: { data: [] } }));
        setMatches(matchRes.data.data || []);
      }
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-sport-500 border-t-transparent rounded-full" />
    </div>
  );

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const completedMatches = matches.filter(m => m.status === 'completed');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="card bg-gradient-to-r from-sport-600/20 to-primary-600/20 border-sport-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sport-500 to-primary-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'P'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-dark-100/60 text-sm mt-0.5">
              {team ? `Playing for ${team.name}` : 'No team assigned yet'} • {user?.sport || 'Player'}
            </p>
          </div>
          {liveMatches.length > 0 && (
            <div className="ml-auto">
              <button onClick={() => navigate(`/live/${liveMatches[0]._id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-medium transition-colors">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Live Match
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Team Members" value={team?.players?.length || 0} icon={UserGroupIcon} color="bg-primary-600" />
        <StatCard title="Matches Played" value={team?.matchesPlayed || 0} icon={PlayIcon} color="bg-indigo-600" />
        <StatCard title="Upcoming Matches" value={upcomingMatches.length} icon={ClockIcon} color="bg-yellow-600" />
        <StatCard title="Wins" value={team?.wins || 0} icon={CheckCircleIcon} color="bg-green-600" />
        <StatCard title="Losses" value={team?.losses || 0} icon={XCircleIcon} color="bg-red-600" />
        <StatCard title="Live Now" value={liveMatches.length} icon={FireIcon} color="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Info */}
        {team ? (
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">My Team</h3>
              <span className={`badge text-xs ${team.status === 'approved' ? 'badge-success' : 'badge-pending'}`}>
                {team.status}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center text-lg font-bold text-white">
                {team.name?.[0]}
              </div>
              <div>
                <p className="font-bold text-white">{team.name}</p>
                <p className="text-xs text-dark-100/50 capitalize">{team.sport}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-100/50">Captain</span>
                <span className="text-white font-medium">{team.captainId?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-100/50">Vice Captain</span>
                <span className="text-white font-medium">{team.viceCaptainId?.name || 'Not Assigned'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-100/50">Total Players</span>
                <span className="text-white font-medium">{team.players?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-100/50">Association</span>
                <span className="text-white font-medium">{team.associationId?.name || 'N/A'}</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-dark-100/50 pt-2 border-t border-dark-700/50">
              <span>Win Rate</span>
              <span className="text-sport-400 font-bold">
                {team.matchesPlayed > 0 ? `${((team.wins || 0) / team.matchesPlayed * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>
        ) : (
          <div className="card text-center py-8">
            <UserGroupIcon className="w-10 h-10 text-dark-100/20 mx-auto mb-2" />
            <p className="text-dark-100/50 text-sm">You are not currently in a team</p>
          </div>
        )}

        {/* Upcoming Matches */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4 text-primary-400" />
            Upcoming Matches ({upcomingMatches.length})
          </h3>
          {upcomingMatches.length === 0 ? (
            <p className="text-dark-100/40 text-sm text-center py-6">No upcoming matches</p>
          ) : (
            <div className="space-y-2">
              {upcomingMatches.slice(0, 4).map(m => (
                <div key={m._id} className="p-3 rounded-xl bg-dark-900 border border-dark-700/30">
                  <p className="text-sm font-medium text-white">
                    {m.teamA?.name || 'Team'} vs {m.teamB?.name || 'TBD'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge text-xs ${m.type === 'tournament' ? 'badge-info' : 'badge-pending'}`}>{m.type}</span>
                    <span className="text-xs text-dark-100/40">
                      {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="card space-y-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <BellIcon className="w-4 h-4 text-yellow-400" />
            Notifications
          </h3>
          {notifications.length === 0 ? (
            <p className="text-dark-100/40 text-sm text-center py-6">No notifications</p>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n._id} className={`p-3 rounded-xl border ${!n.read ? 'bg-primary-500/5 border-primary-500/20' : 'bg-dark-900 border-dark-700/30'}`}>
                  <p className="text-sm text-white">{n.message}</p>
                  <p className="text-xs text-dark-100/40 mt-1">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
              <button onClick={() => navigate('/notifications')} className="w-full text-xs text-primary-400 hover:text-primary-300 pt-1 text-center">
                View all →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Matches Banner */}
      {liveMatches.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live Matches
          </h3>
          {liveMatches.map(m => (
            <div key={m._id} onClick={() => navigate(`/live/${m._id}`)}
              className="card border-red-500/30 bg-red-500/5 cursor-pointer hover:border-red-500/50 transition-all flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{m.teamA?.name || 'Team'} vs {m.teamB?.name || 'TBD'}</p>
                <p className="text-xs text-dark-100/50 mt-0.5">{m.groundId?.name || 'Ground TBD'}</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white font-mono">
                  {m.scoreSummary?.teamA ?? 0} — {m.scoreSummary?.teamB ?? 0}
                </div>
                <span className="badge badge-danger text-xs">LIVE</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Match Results */}
      {completedMatches.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-white">Recent Results</h3>
          <div className="space-y-2">
            {completedMatches.slice(0, 5).map(m => {
              const isTeamA = m.teamA?._id === team?._id;
              const myScore = isTeamA ? m.scoreSummary?.teamA : m.scoreSummary?.teamB;
              const oppScore = isTeamA ? m.scoreSummary?.teamB : m.scoreSummary?.teamA;
              const result = myScore > oppScore ? 'W' : myScore < oppScore ? 'L' : 'D';
              return (
                <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-700/30">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {m.teamA?.name || 'Team'} vs {m.teamB?.name || 'TBD'}
                    </p>
                    <p className="text-xs text-dark-100/40 mt-0.5">
                      {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-white text-sm">{m.scoreSummary?.teamA ?? 0} - {m.scoreSummary?.teamB ?? 0}</span>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      result === 'W' ? 'bg-green-600 text-white' :
                      result === 'L' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'
                    }`}>{result}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
