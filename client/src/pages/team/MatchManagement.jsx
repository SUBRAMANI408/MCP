import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { captainApi } from '../../api/captainApi';
import api from '../../api/axios';
import { useAuthStore } from '../../app/store';
import toast from 'react-hot-toast';
import {
  PlayIcon, TrophyIcon, ClockIcon, CheckCircleIcon,
  BoltIcon, CalendarDaysIcon, MapPinIcon, FireIcon
} from '@heroicons/react/24/outline';

const statusColors = {
  scheduled: 'badge-pending',
  live: 'badge-danger',
  completed: 'badge-success',
  cancelled: 'text-dark-100/40 bg-dark-700/30',
};

const StatusBadge = ({ status }) => (
  <span className={`badge ${statusColors[status] || 'badge-info'} capitalize`}>{status}</span>
);

export default function MatchManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    captainApi.getMyTeam()
      .then(async teamRes => {
        const t = teamRes.data.data;
        setTeam(t);
        const matchRes = await api.get('/matches', { params: { teamId: t._id, limit: 50 } });
        setMatches(matchRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load match data'))
      .finally(() => setLoading(false));
  };

  const filtered = matches.filter(m => {
    if (activeTab === 'all') return true;
    if (activeTab === 'live') return m.status === 'live';
    if (activeTab === 'upcoming') return m.status === 'scheduled';
    if (activeTab === 'completed') return m.status === 'completed';
    return true;
  });

  const tabs = [
    { key: 'all', label: 'All Matches', count: matches.length },
    { key: 'live', label: '🔴 Live', count: matches.filter(m => m.status === 'live').length },
    { key: 'upcoming', label: 'Upcoming', count: matches.filter(m => m.status === 'scheduled').length },
    { key: 'completed', label: 'Completed', count: matches.filter(m => m.status === 'completed').length },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!team) return (
    <div className="card text-center py-12 text-dark-100/50">No team found.</div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Match Management</h1>
          <p className="text-dark-100/60 text-sm mt-1">
            View and manage all matches — start live scoring, track results
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Matches', value: matches.length, icon: TrophyIcon, color: 'bg-primary-600' },
          { label: 'Live Now', value: matches.filter(m => m.status === 'live').length, icon: FireIcon, color: 'bg-red-600' },
          { label: 'Upcoming', value: matches.filter(m => m.status === 'scheduled').length, icon: ClockIcon, color: 'bg-yellow-600' },
          { label: 'Completed', value: matches.filter(m => m.status === 'completed').length, icon: CheckCircleIcon, color: 'bg-green-600' },
        ].map(stat => (
          <div key={stat.label} className="card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-dark-100/50 text-xs">{stat.label}</p>
              <p className="text-white font-bold text-xl">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'text-dark-100/60 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-dark-700'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Match List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <TrophyIcon className="w-12 h-12 text-dark-100/20 mx-auto mb-3" />
            <p className="text-dark-100/50 text-sm">No matches found in this category</p>
          </div>
        ) : (
          filtered.map(match => {
            const isHome = match.teamA?._id === team._id;
            const opponent = isHome ? match.teamB : match.teamA;
            const myScore = isHome ? match.scoreSummary?.teamA : match.scoreSummary?.teamB;
            const oppScore = isHome ? match.scoreSummary?.teamB : match.scoreSummary?.teamA;
            const canScore = match.status === 'live' || match.status === 'scheduled';

            return (
              <div key={match._id} className={`card flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                match.status === 'live' ? 'border-red-500/30 bg-red-500/5' : ''
              }`}>
                {match.status === 'live' && (
                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </div>
                )}

                <div className="flex-1 flex items-center gap-4">
                  {/* Teams */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center text-sm font-bold text-white mx-auto">
                        {team.name?.[0]}
                      </div>
                      <p className="text-xs text-white font-medium mt-1 truncate max-w-[80px]">{team.name}</p>
                    </div>

                    <div className="text-center flex-1">
                      {match.status === 'completed' || match.status === 'live' ? (
                        <div className="text-xl font-bold text-white">
                          {myScore ?? 0} — {oppScore ?? 0}
                        </div>
                      ) : (
                        <div className="text-sm text-dark-100/40 font-medium">VS</div>
                      )}
                      <StatusBadge status={match.status} />
                    </div>

                    <div className="text-center">
                      <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-sm font-bold text-white mx-auto">
                        {opponent?.name?.[0] || '?'}
                      </div>
                      <p className="text-xs text-white font-medium mt-1 truncate max-w-[80px]">{opponent?.name || 'TBD'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-right shrink-0">
                  <div className="flex items-center gap-1 text-xs text-dark-100/50 justify-end">
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                    {match.scheduledAt ? new Date(match.scheduledAt).toLocaleDateString() : 'TBD'}
                  </div>
                  {match.groundId && (
                    <div className="flex items-center gap-1 text-xs text-dark-100/40 justify-end">
                      <MapPinIcon className="w-3.5 h-3.5" />
                      {match.groundId?.name}
                    </div>
                  )}
                  <span className={`badge capitalize text-xs ${match.type === 'tournament' ? 'badge-info' : 'badge-pending'}`}>
                    {match.type}
                  </span>
                </div>

                {canScore && (
                  <button
                    onClick={() => navigate(`/score/${match._id}`)}
                    className={`btn-primary gap-1.5 text-xs shrink-0 ${match.status === 'live' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  >
                    <BoltIcon className="w-4 h-4" />
                    {match.status === 'live' ? 'Score Now' : 'Start Match'}
                  </button>
                )}

                {match.status === 'completed' && (
                  <button
                    onClick={() => navigate(`/match/${match._id}/summary`)}
                    className="btn-secondary gap-1.5 text-xs shrink-0"
                  >
                    View Summary
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
