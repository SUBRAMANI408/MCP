import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { TrophyIcon, CalendarDaysIcon, UsersIcon, MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const statusColors = {
  approved: 'badge-success',
  ongoing: 'badge-danger',
  completed: 'badge-info',
  draft: 'text-dark-100/40 bg-dark-700',
  pending_approval: 'badge-pending',
};

export default function TournamentListPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sportFilter, setSportFilter] = useState('');

  useEffect(() => {
    api.get('/tournaments', { params: { limit: 50 } })
      .then(res => setTournaments(res.data.data || []))
      .catch(() => toast.error('Failed to load tournaments'))
      .finally(() => setLoading(false));
  }, []);

  const sports = [...new Set(tournaments.map(t => t.sport).filter(Boolean))];

  const filtered = tournaments.filter(t => {
    const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchSport = !sportFilter || t.sport === sportFilter;
    return matchSearch && matchStatus && matchSport;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary p-2.5 rounded-xl animate-fade-in" title="Go Back">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="section-title gradient-text">Tournaments</h1>
            <p className="text-dark-100/60 text-sm mt-1">Browse all sports tournaments across all associations</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: tournaments.length },
          { label: 'Ongoing', value: tournaments.filter(t => t.status === 'ongoing').length },
          { label: 'Open Registration', value: tournaments.filter(t => t.status === 'approved').length },
          { label: 'Completed', value: tournaments.filter(t => t.status === 'completed').length },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-dark-100/50 text-xs">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-100/40" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search tournaments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-full sm:w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="approved">Open</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="pending_approval">Pending</option>
        </select>
        <select className="input w-full sm:w-40" value={sportFilter} onChange={e => setSportFilter(e.target.value)}>
          <option value="">All Sports</option>
          {sports.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Tournament Cards */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <TrophyIcon className="w-12 h-12 text-dark-100/20 mx-auto mb-3" />
          <p className="text-dark-100/50">No tournaments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <div
              key={t._id}
              className="card hover:border-dark-600/50 transition-all duration-300 space-y-4 cursor-pointer"
              onClick={() => navigate(`/tournament/${t._id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center flex-shrink-0">
                    <TrophyIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm leading-tight">{t.name}</h3>
                    <p className="text-xs text-dark-100/50 capitalize">{t.sport}</p>
                  </div>
                </div>
                <span className={`badge text-xs capitalize flex-shrink-0 ${statusColors[t.status] || 'badge-info'}`}>
                  {t.status === 'pending_approval' ? 'Pending' : t.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2">
                {t.associationId?.name && (
                  <p className="text-xs text-dark-100/50">{t.associationId.name}</p>
                )}
                <div className="flex items-center justify-between text-xs text-dark-100/60">
                  <div className="flex items-center gap-1.5">
                    <UsersIcon className="w-3.5 h-3.5" />
                    {t.registeredTeams?.length || 0} / {t.maxTeams || '?'} teams
                  </div>
                  <span className="capitalize">{t.format?.replace('_', ' ')}</span>
                </div>
                {t.startDate && (
                  <div className="flex items-center gap-1.5 text-xs text-dark-100/50">
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                    {new Date(t.startDate).toLocaleDateString()} - {t.endDate ? new Date(t.endDate).toLocaleDateString() : 'TBD'}
                  </div>
                )}
              </div>

              {/* Registration Indicator */}
              {t.registeredTeams?.length > 0 && t.maxTeams && (
                <div>
                  <div className="flex justify-between text-xs text-dark-100/50 mb-1">
                    <span>Registration</span>
                    <span>{Math.round((t.registeredTeams.length / t.maxTeams) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-sport-500 rounded-full"
                      style={{ width: `${Math.min(100, (t.registeredTeams.length / t.maxTeams) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
