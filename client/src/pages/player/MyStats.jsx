import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  UserCircleIcon, TrophyIcon, ChartBarIcon, PlayIcon,
  CheckCircleIcon, XCircleIcon, SparklesIcon, FireIcon
} from '@heroicons/react/24/outline';

export default function MyStats() {
  const { user } = useAuthStore();
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [leaderboards, setLeaderboards] = useState(null);
  const [activeTab, setActiveTab] = useState('individual'); // 'individual' | 'team' | 'leaderboard'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const promises = [
        api.get(`/players/${user?._id}/stats`).catch(() => null),
        api.get('/players/leaderboards').catch(() => null),
      ];

      if (user?.teamId) {
        promises.push(api.get('/teams/my-team').catch(() => null));
        promises.push(api.get('/matches', { params: { teamId: user.teamId, limit: 100 } }).catch(() => null));
      }

      const results = await Promise.all(promises);
      const [statsRes, lbRes, teamRes, matchRes] = results;

      if (statsRes?.data?.data) {
        setPlayerStats(statsRes.data.data.stats);
      }
      if (lbRes?.data?.data) {
        setLeaderboards(lbRes.data.data);
      }
      if (teamRes?.data?.data) {
        setTeam(teamRes.data.data);
      }
      if (matchRes?.data?.data) {
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

  const cricket = playerStats?.cricket || {};
  const football = playerStats?.football || {};
  const potm = playerStats?.playerOfTheMatchCount || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title gradient-text">Player Statistics & Leaderboards</h1>
          <p className="text-dark-100/60 text-sm mt-1">Your authoritative performance metrics and platform rankings</p>
        </div>
        <div className="flex bg-dark-800 p-1 rounded-xl border border-dark-700">
          <button
            onClick={() => setActiveTab('individual')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'individual' ? 'bg-sport-600 text-white shadow' : 'text-dark-100/60 hover:text-white'
            }`}
          >
            My Performance
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'leaderboard' ? 'bg-sport-600 text-white shadow' : 'text-dark-100/60 hover:text-white'
            }`}
          >
            Leaderboards
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'team' ? 'bg-sport-600 text-white shadow' : 'text-dark-100/60 hover:text-white'
            }`}
          >
            Team Overview
          </button>
        </div>
      </div>

      {/* Player Header Card */}
      <div className="card bg-gradient-to-r from-sport-600/10 to-primary-600/10 border-sport-500/20">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sport-500 to-primary-500 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-dark-100/50 text-sm">{user?.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="badge badge-info capitalize">{user?.role?.replace('_', ' ')}</span>
              {team && <span className="badge badge-success">{team.name}</span>}
              {potm > 0 && (
                <span className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 flex items-center gap-1">
                  <SparklesIcon className="w-3.5 h-3.5" /> {potm}x Player of the Match
                </span>
              )}
            </div>
          </div>
          {team && (
            <div className="text-right">
              <div className="text-3xl font-bold text-sport-400">{winRate}%</div>
              <p className="text-xs text-dark-100/50">Team Win Rate</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab: Individual Performance */}
      {activeTab === 'individual' && (
        <div className="space-y-6">
          {/* Cricket Stats */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-dark-700/50 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FireIcon className="w-5 h-5 text-orange-400" /> Cricket Batting & Bowling Records
              </h3>
              <span className="text-xs text-dark-100/40">Innings: {cricket.innings || 0}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-xs text-dark-100/50">Runs</p>
                <p className="text-xl font-bold text-white mt-1">{cricket.runs || 0}</p>
              </div>
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-xs text-dark-100/50">Highest Score</p>
                <p className="text-xl font-bold text-white mt-1">{cricket.highestScore || 0}</p>
              </div>
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-xs text-dark-100/50">Strike Rate</p>
                <p className="text-xl font-bold text-sport-400 mt-1">{cricket.strikeRate || 0}</p>
              </div>
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-xs text-dark-100/50">Boundaries (4s/6s)</p>
                <p className="text-xl font-bold text-white mt-1">{cricket.fours || 0} / {cricket.sixes || 0}</p>
              </div>
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-xs text-dark-100/50">Wickets</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">{cricket.wickets || 0}</p>
              </div>
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-xs text-dark-100/50">Economy</p>
                <p className="text-xl font-bold text-white mt-1">{cricket.economy || 0}</p>
              </div>
            </div>
          </div>

          {/* Football Stats */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between border-b border-dark-700/50 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrophyIcon className="w-5 h-5 text-emerald-400" /> Football Performance
              </h3>
              <span className="text-xs text-dark-100/40">Minutes: {football.minutes || 0}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-xs text-dark-100/50">Goals</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">{football.goals || 0}</p>
              </div>
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-xs text-dark-100/50">Assists</p>
                <p className="text-xl font-bold text-blue-400 mt-1">{football.assists || 0}</p>
              </div>
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-xs text-dark-100/50">Clean Sheets</p>
                <p className="text-xl font-bold text-white mt-1">{football.cleanSheets || 0}</p>
              </div>
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-xs text-dark-100/50">Yellow Cards</p>
                <p className="text-xl font-bold text-yellow-400 mt-1">{football.yellowCards || 0}</p>
              </div>
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-xs text-dark-100/50">Red Cards</p>
                <p className="text-xl font-bold text-red-400 mt-1">{football.redCards || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Leaderboards */}
      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Run Scorers */}
          <div className="card space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FireIcon className="w-5 h-5 text-orange-400" /> Top Run Scorers (Cricket)
            </h3>
            <div className="space-y-2">
              {leaderboards?.topRunScorers?.map((item, idx) => (
                <div key={item._id} className="flex items-center justify-between p-2.5 rounded-xl bg-dark-900/50 border border-dark-700/30">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-bold text-dark-100/40">#{idx + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.playerId?.name || 'Player'}</p>
                      <p className="text-xs text-dark-100/40">{item.teamId?.name || 'Free Agent'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-sport-400">{item.cricket?.runs || 0} runs</span>
                </div>
              ))}
              {(!leaderboards?.topRunScorers || leaderboards.topRunScorers.length === 0) && (
                <p className="text-xs text-dark-100/40 text-center py-4">No cricket statistics logged yet</p>
              )}
            </div>
          </div>

          {/* Top Wicket Takers */}
          <div className="card space-y-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <TrophyIcon className="w-5 h-5 text-emerald-400" /> Top Wicket Takers (Cricket)
            </h3>
            <div className="space-y-2">
              {leaderboards?.topWicketTakers?.map((item, idx) => (
                <div key={item._id} className="flex items-center justify-between p-2.5 rounded-xl bg-dark-900/50 border border-dark-700/30">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center text-xs font-bold text-dark-100/40">#{idx + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.playerId?.name || 'Player'}</p>
                      <p className="text-xs text-dark-100/40">{item.teamId?.name || 'Free Agent'}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{item.cricket?.wickets || 0} wickets</span>
                </div>
              ))}
              {(!leaderboards?.topWicketTakers || leaderboards.topWicketTakers.length === 0) && (
                <p className="text-xs text-dark-100/40 text-center py-4">No bowling statistics logged yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Team Overview */}
      {activeTab === 'team' && (
        !team ? (
          <div className="card text-center py-12">
            <UserCircleIcon className="w-12 h-12 text-dark-100/20 mx-auto mb-3" />
            <p className="text-dark-100/50">Join a team to see detailed statistics</p>
          </div>
        ) : (
          <>
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
        )
      )}
    </div>
  );
}
