import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentApi } from '../../api/tournamentApi';
import { fixtureApi } from '../../api/fixtureApi';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ResultEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update score modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');
  const [winnerId, setWinnerId] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadFixtures();
  }, [id]);

  const loadFixtures = () => {
    setLoading(true);
    tournamentApi.getTournamentReports(id)
      .then(res => setFixtures(res.data.data.fixtures || []))
      .catch(() => toast.error('Failed to load match fixtures'))
      .finally(() => setLoading(false));
  };

  const handleOpenUpdate = (fixture) => {
    setSelectedFixture(fixture);
    setTeamAScore(fixture.score?.teamA || '');
    setTeamBScore(fixture.score?.teamB || '');
    setWinnerId(fixture.winnerId?._id || fixture.winnerId || '');
    setShowModal(true);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!selectedFixture) return;

    setUpdating(true);
    const payload = {
      score: {
        teamA: Number(teamAScore),
        teamB: Number(teamBScore)
      },
      winnerId: winnerId || null,
      status: 'completed'
    };

    fixtureApi.updateFixture(selectedFixture._id, payload)
      .then(() => {
        toast.success('Match scorecard successfully updated');
        setShowModal(false);
        loadFixtures();
      })
      .catch(() => toast.error('Updating score card failed'))
      .finally(() => setUpdating(false));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/tournament/${id}/fixtures`)} className="btn-secondary p-2 rounded-xl text-dark-100/80 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold" title="Go Back">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="section-title gradient-text">Scorecard Result Entry</h1>
            <p className="text-dark-100/60 text-sm mt-1">Submit official match summaries, scorecards, and verify tournament winners</p>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : fixtures.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No match fixtures have been generated to record results for</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Matchup</th>
                  <th>Scheduled Date</th>
                  <th>Current Score</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {fixtures.map(f => (
                  <tr key={f._id}>
                    <td><span className="badge badge-info">Round {f.round || 1}</span></td>
                    <td>
                      <span className="font-semibold text-white">{f.teamA?.name || 'TBD'}</span>
                      <span className="text-dark-100/40 mx-2 text-xs font-mono">VS</span>
                      <span className="font-semibold text-white">{f.teamB?.name || 'TBD'}</span>
                    </td>
                    <td>
                      {f.date ? new Date(f.date).toLocaleDateString() : 'N/A'} — {f.startTime || 'N/A'}
                    </td>
                    <td>
                      {f.score ? (
                        <span className="font-bold text-white font-mono">{f.score.teamA} - {f.score.teamB}</span>
                      ) : (
                        <span className="text-xs text-dark-100/40">No Score Entered</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        f.status === 'completed' ? 'badge-success' :
                        f.status === 'live' ? 'badge-live' : 'badge-pending'
                      } capitalize`}>{f.status}</span>
                    </td>
                    <td className="text-right">
                      {f.status !== 'completed' ? (
                        <button onClick={() => handleOpenUpdate(f)} className="btn-primary py-1 px-3 text-xs">
                          Record Score
                        </button>
                      ) : (
                        <button onClick={() => handleOpenUpdate(f)} className="btn-ghost py-1 px-3 text-xs text-primary-400">
                          Edit Score
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Result Entry Modal */}
      {showModal && selectedFixture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="section-title text-white">Record Match Score</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{selectedFixture.teamA?.name} Score</label>
                  <input type="number" className="input" required min="0" value={teamAScore} onChange={e => setTeamAScore(e.target.value)} />
                </div>
                <div>
                  <label className="label">{selectedFixture.teamB?.name} Score</label>
                  <input type="number" className="input" required min="0" value={teamBScore} onChange={e => setTeamBScore(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Select Winner</label>
                <select className="input" value={winnerId} onChange={e => setWinnerId(e.target.value)}>
                  <option value="">Choose Winner (Or Draw)</option>
                  <option value={selectedFixture.teamA?._id}>{selectedFixture.teamA?.name}</option>
                  <option value={selectedFixture.teamB?._id}>{selectedFixture.teamB?.name}</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={updating} className="btn-primary">
                  {updating ? 'Saving Scorecard...' : 'Submit Scorecard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
