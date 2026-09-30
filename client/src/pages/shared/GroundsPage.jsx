import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MapPinIcon, UsersIcon, CalendarDaysIcon, MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const statusColors = {
  available: 'badge-success',
  booked: 'badge-danger',
  maintenance: 'badge-pending',
  unavailable: 'text-dark-100/40 bg-dark-700',
};

export default function GroundsPage() {
  const navigate = useNavigate();
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');

  useEffect(() => {
    api.get('/grounds', { params: { limit: 100 } })
      .then(res => setGrounds(res.data.data || []))
      .catch(() => toast.error('Failed to load grounds'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = grounds.filter(g => {
    const matchSearch = !search || g.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.location?.toLowerCase().includes(search.toLowerCase());
    const matchSport = !sportFilter || g.sport === sportFilter;
    return matchSearch && matchSport;
  });

  const sports = [...new Set(grounds.map(g => g.sport).filter(Boolean))];

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
            <h1 className="section-title gradient-text">Sports Grounds</h1>
            <p className="text-dark-100/60 text-sm mt-1">Browse all available sports grounds and their current availability</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-100/40" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Search grounds by name or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-full sm:w-48" value={sportFilter} onChange={e => setSportFilter(e.target.value)}>
          <option value="">All Sports</option>
          {sports.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Grounds', value: grounds.length },
          { label: 'Available', value: grounds.filter(g => g.status === 'available').length },
          { label: 'Currently Booked', value: grounds.filter(g => g.status === 'booked').length },
          { label: 'Under Maintenance', value: grounds.filter(g => g.status === 'maintenance').length },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-dark-100/50 text-xs">{s.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Grounds Grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <MapPinIcon className="w-12 h-12 text-dark-100/20 mx-auto mb-3" />
          <p className="text-dark-100/50">No grounds found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ground => (
            <div key={ground._id} className="card hover:border-dark-600/50 transition-all duration-300 space-y-4">
              {/* Ground Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sport-500 to-primary-500 flex items-center justify-center flex-shrink-0">
                    <MapPinIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{ground.name}</h3>
                    {ground.sport && <p className="text-xs text-dark-100/50 capitalize">{ground.sport}</p>}
                  </div>
                </div>
                <span className={`badge text-xs capitalize ${statusColors[ground.status] || 'badge-info'}`}>
                  {ground.status || 'available'}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2">
                {ground.location && (
                  <div className="flex items-center gap-2 text-xs text-dark-100/60">
                    <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    {ground.location}
                  </div>
                )}
                {ground.capacity && (
                  <div className="flex items-center gap-2 text-xs text-dark-100/60">
                    <UsersIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    Capacity: {ground.capacity.toLocaleString()} spectators
                  </div>
                )}
              </div>

              {/* Time Slots */}
              {(ground.availableTimeSlots?.length > 0 || ground.timeSlots?.length > 0) && (
                <div>
                  <p className="text-xs text-dark-100/40 mb-1.5">Available Time Slots</p>
                  <div className="flex flex-wrap gap-1">
                    {(ground.availableTimeSlots || ground.timeSlots || []).slice(0, 4).map((slot, i) => (
                      <span key={i} className="text-xs bg-dark-700 text-dark-100/70 px-2 py-0.5 rounded-lg">
                        {typeof slot === 'string' ? slot : `${slot.start} - ${slot.end}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Association */}
              {ground.associationId?.name && (
                <p className="text-xs text-dark-100/40 border-t border-dark-700/50 pt-2">
                  {ground.associationId.name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
