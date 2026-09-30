import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { captainApi } from '../../api/captainApi';
import toast from 'react-hot-toast';

export default function TournamentRegistration() {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.associationId) {
      loadTournaments();
    }
  }, [user]);

  const loadTournaments = () => {
    setLoading(true);
    // Fetch tournaments for current association
    captainApi.getTournaments({ associationId: user.associationId })
      .then(res => {
        setTournaments(res.data.data || []);
      })
      .catch(() => toast.error('Failed to load tournament registries'))
      .finally(() => setLoading(false));
  };

  const handleRegister = (id) => {
    if (window.confirm('Register your team for this tournament?')) {
      captainApi.registerTournament(id)
        .then(() => {
          toast.success('Team registered successfully');
          loadTournaments();
        })
        .catch(err => toast.error(err.response?.data?.message || 'Registration failed'));
    }
  };

  const handleUnregister = (id) => {
    if (window.confirm('Withdraw/unregister your team from this tournament?')) {
      captainApi.unregisterTournament(id)
        .then(() => {
          toast.success('Team unregistered successfully');
          loadTournaments();
        })
        .catch(err => toast.error(err.response?.data?.message || 'Withdrawal failed'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Tournament Registries</h1>
          <p className="text-dark-100/60 text-sm mt-1">Review upcoming tournaments in your association and register your team roster</p>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold text-white">Upcoming & Ongoing Tournaments</h3>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : tournaments.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No tournaments scheduled in this association</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map(t => {
              const isRegistered = t.registeredTeams?.some(teamId => teamId === user.teamId || teamId._id === user.teamId);
              const maxCap = t.maxTeams || 16;
              const currentRegCount = t.registeredTeams?.length || 0;
              const hasPassedDeadline = t.registrationDeadline ? new Date(t.registrationDeadline) < new Date() : false;

              return (
                <div key={t._id} className="card bg-dark-900 border border-dark-700/40 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-base font-bold text-white leading-tight">{t.name}</h4>
                      <span className={`badge ${
                        t.status === 'approved' ? 'badge-success' :
                        t.status === 'ongoing' ? 'badge-live' : 'badge-info'
                      } capitalize`}>{t.status}</span>
                    </div>
                    {t.description && <p className="text-xs text-dark-100/50 mt-1 line-clamp-2">{t.description}</p>}
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-dark-100/40 mt-3 pt-3 border-t border-dark-700/30">
                      <div>Sport: <span className="text-white font-medium capitalize">{t.sport}</span></div>
                      <div>Format: <span className="text-white font-medium capitalize">{t.format?.replace('_', ' ')}</span></div>
                      <div>Deadline: <span className="text-white font-medium">{t.registrationDeadline ? new Date(t.registrationDeadline).toLocaleDateString() : 'N/A'}</span></div>
                      <div>Registered Capacity: <span className="text-white font-medium">{currentRegCount} / {maxCap} teams</span></div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {isRegistered ? (
                      <button
                        onClick={() => handleUnregister(t._id)}
                        disabled={t.status === 'ongoing' || t.status === 'completed'}
                        className="btn-danger w-full justify-center text-xs py-2 disabled:opacity-50"
                      >
                        Withdraw Team
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(t._id)}
                        disabled={currentRegCount >= maxCap || hasPassedDeadline || t.status !== 'approved'}
                        className="btn-primary w-full justify-center text-xs py-2 disabled:opacity-50"
                      >
                        {hasPassedDeadline ? 'Deadline Passed' : currentRegCount >= maxCap ? 'Capacity Full' : 'Register Team'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
