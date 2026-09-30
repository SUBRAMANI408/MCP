import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, UsersIcon, UserIcon, MapPinIcon, TrophyIcon, BuildingOffice2Icon, XMarkIcon, AdjustmentsHorizontalIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const TYPES = [
  { key: '', label: 'All', icon: MagnifyingGlassIcon },
  { key: 'users', label: 'Users', icon: UserIcon },
  { key: 'teams', label: 'Teams', icon: UsersIcon },
  { key: 'grounds', label: 'Grounds', icon: MapPinIcon },
  { key: 'tournaments', label: 'Tournaments', icon: TrophyIcon },
  { key: 'associations', label: 'Associations', icon: BuildingOffice2Icon },
];

const SPORTS = ['', 'cricket', 'football', 'volleyball', 'basketball', 'kabaddi', 'badminton', 'hockey'];

export default function SearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [sport, setSport] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const search = async (query, t, s) => {
    if (!query.trim() || query.trim().length < 1) { setResults({}); return; }
    setLoading(true);
    try {
      const params = { q: query };
      if (t) params.type = t;
      if (s) params.sport = s;
      const res = await api.get('/search', { params });
      setResults(res.data.data || {});
    } catch { setResults({}); }
    finally { setLoading(false); }
  };

  const handleInput = (val) => {
    setQ(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val, type, sport), 350);
  };

  const handleTypeChange = (t) => {
    setType(t);
    search(q, t, sport);
  };

  const handleSportChange = (s) => {
    setSport(s);
    search(q, type, s);
  };

  const totalResults = Object.values(results).reduce((s, arr) => s + (arr?.length || 0), 0);

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Search input */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary p-3 rounded-xl" title="Go Back">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-100/40" />
          <input
            ref={inputRef}
            className="input pl-11 pr-10 py-3 text-base w-full"
            placeholder="Search users, teams, grounds, tournaments…"
            value={q}
            onChange={e => handleInput(e.target.value)}
          />
          {q && (
            <button onClick={() => { setQ(''); setResults({}); }} className="absolute right-3 top-1/2 -translate-y-1/2 btn-ghost p-1">
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TYPES.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => handleTypeChange(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${type === key ? 'bg-primary-600 text-white' : 'bg-dark-700 text-dark-100/60 hover:bg-dark-600 hover:text-white'}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ml-auto ${showFilters ? 'bg-primary-600/20 text-primary-400' : 'bg-dark-700 text-dark-100/60'}`}>
          <AdjustmentsHorizontalIcon className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card-sm flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-dark-100/50">Sport:</span>
            <select className="input py-1.5 text-xs w-40" value={sport} onChange={e => handleSportChange(e.target.value)}>
              <option value="">All sports</option>
              {SPORTS.slice(1).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-7 h-7 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      )}

      {/* No results */}
      {!loading && q && totalResults === 0 && (
        <div className="text-center py-12 text-dark-100/40">
          <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No results found for "<span className="text-white">{q}</span>"</p>
        </div>
      )}

      {/* Results */}
      {!loading && totalResults > 0 && (
        <div className="space-y-5">
          {/* Users */}
          {results.users?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-dark-100/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> Users ({results.users.length})
              </h3>
              <div className="space-y-1">
                {results.users.map(u => (
                  <div key={u._id} className="card-sm flex items-center gap-3 cursor-pointer hover:bg-dark-700/70 transition-colors" onClick={() => navigate('/profile')}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {u.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{u.name}</p>
                      <p className="text-xs text-dark-100/50 truncate capitalize">{u.role?.replace(/_/g, ' ')} • {u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teams */}
          {results.teams?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-dark-100/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                <UsersIcon className="w-4 h-4" /> Teams ({results.teams.length})
              </h3>
              <div className="space-y-1">
                {results.teams.map(t => (
                  <div key={t._id} className="card-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sport-500 to-primary-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {t.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{t.name}</p>
                      <p className="text-xs text-dark-100/50 capitalize">{t.sport} • {t.matchesPlayed} matches</p>
                    </div>
                    <span className={`badge capitalize ${t.status === 'approved' ? 'badge-success' : 'badge-pending'}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grounds */}
          {results.grounds?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-dark-100/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                <MapPinIcon className="w-4 h-4" /> Grounds ({results.grounds.length})
              </h3>
              <div className="space-y-1">
                {results.grounds.map(g => (
                  <div key={g._id} className="card-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-sm flex-shrink-0">📍</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{g.name}</p>
                      <p className="text-xs text-dark-100/50 capitalize">{g.sport} • {g.location}</p>
                    </div>
                    <span className={`badge capitalize ${g.status === 'active' ? 'badge-success' : 'badge-pending'}`}>{g.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tournaments */}
          {results.tournaments?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-dark-100/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                <TrophyIcon className="w-4 h-4" /> Tournaments ({results.tournaments.length})
              </h3>
              <div className="space-y-1">
                {results.tournaments.map(t => (
                  <div key={t._id} className="card-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-primary-500 flex items-center justify-center text-sm flex-shrink-0">🏆</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{t.name}</p>
                      <p className="text-xs text-dark-100/50 capitalize">{t.sport} • {t.format?.replace('_', ' ')} • {t.associationId?.name}</p>
                    </div>
                    <span className={`badge capitalize text-xs ${t.status === 'ongoing' ? 'badge-danger' : t.status === 'completed' ? 'badge-success' : 'badge-pending'}`}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Associations */}
          {results.associations?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-dark-100/50 uppercase tracking-wider mb-2 flex items-center gap-2">
                <BuildingOffice2Icon className="w-4 h-4" /> Associations ({results.associations.length})
              </h3>
              <div className="space-y-1">
                {results.associations.map(a => (
                  <div key={a._id} className="card-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-sport-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {a.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{a.name}</p>
                      <p className="text-xs text-dark-100/50">{a.city} • {a.contactEmail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!q && (
        <div className="text-center py-16 text-dark-100/30">
          <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Start typing to search</p>
          <p className="text-sm mt-1">Search across users, teams, grounds, tournaments</p>
        </div>
      )}
    </div>
  );
}
