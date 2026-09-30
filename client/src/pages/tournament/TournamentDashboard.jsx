import React, { useState, useEffect } from 'react';
import { tournamentApi } from '../../api/tournamentApi';
import { useNavigate } from 'react-router-dom';
import {
  TrophyIcon, CalendarIcon, UsersIcon, PlayIcon,
  CheckCircleIcon, ClockIcon, ArrowTrendingUpIcon, PlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="card hover:border-dark-600/50 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-dark-100/60 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value ?? '-'}</p>
        {subtitle && <p className="text-xs text-dark-100/40 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export default function TournamentDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = () => {
    setLoading(true);
    Promise.all([
      tournamentApi.getDashboard().catch(() => null),
      tournamentApi.getTournaments({ limit: 50 }).catch(() => ({ data: { data: [] } }))
    ])
      .then(([statsRes, toursRes]) => {
        if (statsRes) setStats(statsRes.data.data);
        setTournaments(toursRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load tournament aggregates'))
      .finally(() => setLoading(false));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Tournaments Console</h1>
          <p className="text-dark-100/60 text-sm mt-1">Configure tournaments, generate format brackets, and submit results</p>
        </div>
        <button onClick={() => navigate('/tournament/create')} className="btn-primary">
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Tournament
        </button>
      </div>

      {/* Telemetry Stats Grid */}
      <h2 className="text-lg font-bold text-white mb-2">Tournaments Summary</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tournaments" value={stats?.totalTournaments} icon={TrophyIcon} color="bg-primary-600" />
        <StatCard title="Upcoming Brackets" value={stats?.upcoming} icon={CalendarIcon} color="bg-sport-600" />
        <StatCard title="Ongoing Matches" value={stats?.ongoing} icon={PlayIcon} color="bg-orange-600" />
        <StatCard title="Completed Events" value={stats?.completed} icon={CheckCircleIcon} color="bg-teal-600" />
      </div>

      <h2 className="text-lg font-bold text-white mb-2">Fixtures Telemetry</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Matches" value={stats?.totalMatches} icon={TrophyIcon} color="bg-primary-600" subtitle={`Completed: ${stats?.completedMatches}`} />
        <StatCard title="Upcoming Matches" value={stats?.upcomingMatches} icon={ClockIcon} color="bg-yellow-600" />
        <StatCard title="Live Matches" value={stats?.liveMatches} icon={PlayIcon} color="bg-red-600" />
        <StatCard title="Total Registered Teams" value={stats?.totalRegisteredTeams} icon={UsersIcon} color="bg-indigo-600" />
      </div>

      {/* Main Tournaments Grid */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white">Your Managed Tournaments</h3>
        
        {tournaments.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No tournaments registered. Click "Create Tournament" to start.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map(t => (
              <div key={t._id} className="card bg-dark-900 border border-dark-700/40 p-4 flex flex-col justify-between hover:border-dark-600 transition-colors">
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-base font-bold text-white leading-tight">{t.name}</h4>
                    <span className={`badge ${
                      t.status === 'draft' ? 'badge-pending' :
                      t.status === 'approved' ? 'badge-success' :
                      t.status === 'ongoing' ? 'badge-live' : 'badge-info'
                    } capitalize`}>{t.status?.replace('_', ' ')}</span>
                  </div>
                  {t.description && <p className="text-xs text-dark-100/50 mt-1 line-clamp-2">{t.description}</p>}
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-dark-100/40 mt-3 pt-3 border-t border-dark-700/30">
                    <div>Sport: <span className="text-white font-medium capitalize">{t.sport}</span></div>
                    <div>Format: <span className="text-white font-medium capitalize">{t.format?.replace('_', ' ')}</span></div>
                    <div>Schedule: <span className="text-white font-medium">{new Date(t.startDate).toLocaleDateString()}</span></div>
                    <div>Max Teams: <span className="text-white font-medium">{t.maxTeams}</span></div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button onClick={() => navigate(`/tournament/${t._id}`)} className="btn-secondary w-full justify-center text-xs py-1.5">
                    Manage Details
                  </button>
                  {t.status === 'ongoing' && (
                    <button onClick={() => navigate(`/tournament/${t._id}/fixtures`)} className="btn-primary w-full justify-center text-xs py-1.5">
                      Enter Scores
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
