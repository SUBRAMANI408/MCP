import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentApi } from '../../api/tournamentApi';
import toast from 'react-hot-toast';

export default function TournamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournamentDetails();
  }, [id]);

  const loadTournamentDetails = () => {
    setLoading(true);
    tournamentApi.getTournament(id)
      .then(res => setTournament(res.data.data))
      .catch(() => toast.error('Failed to load tournament info'))
      .finally(() => setLoading(false));
  };

  const handleSubmitApproval = () => {
    if (window.confirm('Submit this tournament draft to the Association Head for review and approval?')) {
      tournamentApi.submitForApproval(id)
        .then(() => {
          toast.success('Tournament submitted for approval');
          loadTournamentDetails();
        })
        .catch(() => toast.error('Submission failed'));
    }
  };

  const handleStart = () => {
    if (window.confirm('Start the tournament? This will locked registrations and activate fixtures scoring.')) {
      tournamentApi.startTournament(id)
        .then(() => {
          toast.success('Tournament matches are now ongoing!');
          loadTournamentDetails();
        })
        .catch(() => toast.error('Failed to start tournament'));
    }
  };

  const handleComplete = () => {
    if (window.confirm('Close this tournament and mark as completed?')) {
      tournamentApi.completeTournament(id)
        .then(() => {
          toast.success('Tournament completed!');
          loadTournamentDetails();
        })
        .catch(() => toast.error('Failed to close tournament'));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!tournament) return (
    <div className="card text-center py-12 text-dark-100/50">Tournament details not found</div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">{tournament.name}</h1>
          <p className="text-dark-100/60 text-sm mt-1">Configure status levels, audit team rosters, and manage brackets</p>
        </div>
        
        <div className="flex gap-2">
          {tournament.status === 'draft' && (
            <button onClick={handleSubmitApproval} className="btn-primary">
              Submit for Approval
            </button>
          )}
          {tournament.status === 'approved' && (
            <button onClick={handleStart} className="btn-primary btn-success">
              Start Tournament
            </button>
          )}
          {tournament.status === 'ongoing' && (
            <button onClick={handleComplete} className="btn-primary btn-danger">
              Complete Tournament
            </button>
          )}
          <button onClick={() => navigate(`/tournament/${id}/fixtures`)} className="btn-secondary">
            Manage Fixtures
          </button>
          <button onClick={() => navigate(`/tournament/${id}/standings`)} className="btn-secondary">
            Standings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Basic specifications card */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Specifications</h3>
          
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-dark-100/40">Status:</span>
              <span className="badge badge-info capitalize">{tournament.status?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-100/40">Sport Category:</span>
              <span className="text-white capitalize font-medium">{tournament.sport}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-100/40">Roster Capacity:</span>
              <span className="text-white font-medium">{tournament.registeredTeams?.length || 0} / {tournament.maxTeams} teams</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-100/40">Format Rule:</span>
              <span className="text-white capitalize font-medium">{tournament.format?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dark-100/40">Registration Fee:</span>
              <span className="text-white font-medium">Rs. {tournament.registrationFee || 0}</span>
            </div>
          </div>
        </div>

        {/* Narrative, Rules, and Prizes details */}
        <div className="card lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-white">Details & Rules Guidelines</h3>
          
          <div className="space-y-4 pt-2">
            {tournament.description && (
              <div>
                <span className="text-[10px] text-dark-100/40 uppercase font-bold block mb-1">Description</span>
                <p className="text-xs text-dark-100/70">{tournament.description}</p>
              </div>
            )}
            
            {tournament.rules && (
              <div>
                <span className="text-[10px] text-dark-100/40 uppercase font-bold block mb-1">Rules & Regulations</span>
                <p className="text-xs text-dark-100/70">{tournament.rules}</p>
              </div>
            )}

            {tournament.prizeDetails && (
              <div>
                <span className="text-[10px] text-dark-100/40 uppercase font-bold block mb-1">Prizes Pool</span>
                <p className="text-xs text-dark-100/70">{tournament.prizeDetails}</p>
              </div>
            )}
          </div>
        </div>

        {/* Registered Teams lists */}
        <div className="card lg:col-span-3 space-y-4">
          <h3 className="font-semibold text-white">Registered Rosters ({tournament.registeredTeams?.length || 0})</h3>
          
          {tournament.registeredTeams?.length === 0 ? (
            <p className="text-xs text-dark-100/40 py-6 text-center">No team roster has registered for this tournament yet</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Sport</th>
                    <th>Captain Name</th>
                    <th>Previous Matches Played</th>
                  </tr>
                </thead>
                <tbody>
                  {tournament.registeredTeams.map(t => (
                    <tr key={t._id}>
                      <td><span className="font-semibold text-white">{t.name}</span></td>
                      <td><span className="badge badge-info">{t.sport}</span></td>
                      <td>{t.captainId?.name}</td>
                      <td>{t.matchesPlayed || 0} matches</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
