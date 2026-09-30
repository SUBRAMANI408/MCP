import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { PlayIcon, SignalIcon, TrophyIcon } from '@heroicons/react/24/outline';

export default function PlayerLiveMatches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/matches', { params: { limit: 50 } });
      // Filter for live matches
      setMatches(res.data.data || []);
    } catch {
      toast.error('Failed to load live matches');
    } finally {
      setLoading(false);
    }
  };

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'pending');
  const completedMatches = matches.filter(m => m.status === 'completed');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-sport-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text flex items-center gap-2">
            <SignalIcon className="w-6 h-6 text-sport-500" />
            Live & Scheduled Matches
          </h1>
          <p className="text-dark-100/60 text-sm mt-1">Real-time action, schedules, and completed summary scorecards</p>
        </div>
      </div>

      {/* Live Matches Section */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live Now ({liveMatches.length})
        </h2>
        {liveMatches.length === 0 ? (
          <p className="text-xs text-dark-100/40 py-6 card text-center">No matches are currently live</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map(m => (
              <div key={m._id} onClick={() => navigate(`/live/${m._id}`)} className="card bg-gradient-to-br from-red-950/20 to-dark-800 hover:border-red-500/30 transition-all cursor-pointer">
                <div className="flex justify-between items-center mb-3">
                  <span className="badge badge-danger text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                    <SignalIcon className="w-3 h-3" /> Live
                  </span>
                  <span className="text-[10px] text-dark-100/40 capitalize">{m.sport}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-white">
                  <span>{m.teamA?.name}</span>
                  <span className="text-dark-100/40 text-xs">VS</span>
                  <span>{m.teamB?.name}</span>
                </div>
                <p className="text-xs text-dark-100/40 mt-3 truncate">{m.groundId?.name || 'Main Ground'} • Click to view live score</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled/Upcoming Section */}
      <div className="space-y-3 pt-4">
        <h2 className="text-base font-bold text-white">Upcoming Fixtures ({upcomingMatches.length})</h2>
        {upcomingMatches.length === 0 ? (
          <p className="text-xs text-dark-100/40 py-6 card text-center">No upcoming scheduled matches</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingMatches.map(m => (
              <div key={m._id} className="card hover:border-dark-600/50 transition-all">
                <div className="flex justify-between items-center mb-3">
                  <span className="badge badge-pending text-[10px] capitalize">{m.status}</span>
                  <span className="text-[10px] text-dark-100/40 capitalize">{m.sport}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-white">
                  <span>{m.teamA?.name || 'TBD'}</span>
                  <span className="text-dark-100/40 text-xs">VS</span>
                  <span>{m.teamB?.name || 'TBD'}</span>
                </div>
                <p className="text-xs text-dark-100/40 mt-3">{new Date(m.startedAt || m.createdAt).toLocaleDateString()} @ {m.groundId?.name || 'Main Ground'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Section */}
      <div className="space-y-3 pt-4">
        <h2 className="text-base font-bold text-white">Completed Matches ({completedMatches.length})</h2>
        {completedMatches.length === 0 ? (
          <p className="text-xs text-dark-100/40 py-6 card text-center">No completed matches</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedMatches.map(m => (
              <div key={m._id} onClick={() => navigate(`/live/${m._id}`)} className="card hover:border-dark-600/50 transition-all cursor-pointer">
                <div className="flex justify-between items-center mb-3">
                  <span className="badge badge-success text-[10px] capitalize">Finished</span>
                  <span className="text-[10px] text-dark-100/40 capitalize">{m.sport}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-white">
                  <span>{m.teamA?.name}</span>
                  <span className="text-dark-100/40 text-xs">VS</span>
                  <span>{m.teamB?.name}</span>
                </div>
                <p className="text-xs text-dark-100/40 mt-3 truncate">Winner: <span className="text-green-400 font-bold">{m.winnerId === m.teamA?._id ? m.teamA?.name : m.winnerId === m.teamB?._id ? m.teamB?.name : 'Draw'}</span></p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
