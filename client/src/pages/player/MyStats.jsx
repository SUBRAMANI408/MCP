import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  UserCircleIcon, TrophyIcon, ChartBarIcon, PlayIcon,
  CheckCircleIcon, XCircleIcon
} from '@heroicons/react/24/outline';

export default function MyStats() {
  const { user } = useAuthStore();
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      if (user?.teamId) {
        const [teamRes, matchRes] = await Promise.all([
          api.get('/teams/my-team'),
          api.get('/matches', { params: { teamId: user.teamId, limit: 100 } }),
        ]);
        setTeam(teamRes.data.data);
        setMatches(matchRes.data.data || []);
      }
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-sport-500 border-t-transparent rounded-full" />
    </div>
  );

  const completed = matches.filter(m => m.status === 'completed');
  const wins = team?.wins || 0;
  const losses = team?.losses || 0;
  const draws = team?.draws || 0;
  const played = team?.matchesPlayed || 0;
  const winRate = played > 0 ? ((wins / played) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">My Statistics</h1>
          <p className="text-dark-100/60 text-sm mt-1">Your personal performance metrics and team stats</p>
        </div>
      </div>

      {/* Player Card */}
      <div className="card bg-gradient-to-r from-sport-600/10 to-primary-600/10 border-sport-500/20">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sport-500 to-primary-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-dark-100/50 text-sm">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <span className="badge badge-info capitalize">{user?.role?.replace('_', ' ')}</span>
              {team && <span className="badge badge-success">{team.name}</span>}
            </div>
          </div>
          {team && (
            <div className="text-right">
              <div className="text-3xl font-bold text-sport-400">{winRate}%</div>
              <p className="text-xs text-dark-100/50">Win Rate</p>
            </div>
          )}
        </div>
      </div>

      {!team ? (
        <div className="card text-center py-12">
          <UserCircleIcon className="w-12 h-12 text-dark-100/20 mx-auto mb-3" />
          <p className="text-dark-100/50">Join a team to see detailed statistics</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Matches Played', value: played, icon: PlayIcon, color: 'bg-primary-600' },
              { label: 'Wins', value: wins, icon: CheckCircleIcon, color: 'bg-green-600' },
              { label: 'Losses', value: losses, icon: XCircleIcon, color: 'bg-red-600' },
              { label: 'Draws', value: draws, icon: ChartBarIcon, color: 'bg-yellow-600' },
              { label: 'Win Rate', value: `${winRate}%`, icon: TrophyIcon, color: 'bg-sport-600' },
            ].map(stat => (
              <div key={stat.label} className="card flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-dark-100/50">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Bar */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Team Performance Overview</h3>
            <div className="space-y-4">
              {[
                { label: 'Wins', value: wins, total: played, color: 'bg-green-500' },
                { label: 'Losses', value: losses, total: played, color: 'bg-red-500' },
                { label: 'Draws', value: draws, total: played, color: 'bg-yellow-500' },
              ].map(bar => (
                <div key={bar.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-dark-100/70">{bar.label}</span>
                    <span className="text-white font-medium">{bar.value} / {bar.total}</span>
                  </div>
                  <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar.color} rounded-full transition-all duration-700`}
                      style={{ width: `${bar.total > 0 ? (bar.value / bar.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Match History */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Recent Match History</h3>
            <div className="space-y-2">
              {completed.slice(0, 10).map(m => {
                const isTeamA = m.teamA?._id === team._id;
                const myScore = isTeamA ? m.scoreSummary?.teamA : m.scoreSummary?.teamB;
                const oppScore = isTeamA ? m.scoreSummary?.teamB : m.scoreSummary?.teamA;
                const opponent = isTeamA ? m.teamB : m.teamA;
                const result = myScore > oppScore ? 'W' : myScore < oppScore ? 'L' : 'D';
                return (
                  <div key={m._id} className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-700/30">
                    <div>
                      <p className="text-sm text-white font-medium">vs {opponent?.name || 'Unknown'}</p>
                      <p className="text-xs text-dark-100/40">
                        {m.type} • {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-white">{myScore ?? 0} - {oppScore ?? 0}</span>
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        result === 'W' ? 'bg-green-600' : result === 'L' ? 'bg-red-600' : 'bg-yellow-600'
                      } text-white`}>{result}</span>
                    </div>
                  </div>
                );
              })}
              {completed.length === 0 && (
                <p className="text-dark-100/40 text-sm text-center py-6">No completed matches yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
