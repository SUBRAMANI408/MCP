import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentApi } from '../../api/tournamentApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function FixtureManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadFixtures();
  }, [id]);

  const loadFixtures = () => {
    setLoading(true);
    // Fetch reports/fixtures data directly using getTournamentReports endpoint
    tournamentApi.getTournamentReports(id)
      .then(res => {
        setFixtures(res.data.data.fixtures || []);
      })
      .catch(() => toast.error('Failed to load fixtures'))
      .finally(() => setLoading(false));
  };

  const handleGenerate = () => {
    if (window.confirm('Generate fixtures? This will erase any existing schedules and rebuild the matchups.')) {
      setGenerating(true);
      tournamentApi.generateFixtures(id)
        .then(() => {
          toast.success('Fixtures created successfully!');
          loadFixtures();
        })
        .catch(err => toast.error(err.response?.data?.message || 'Fixture generation failed'))
        .finally(() => setGenerating(false));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Fixture & Match Manager</h1>
          <p className="text-dark-100/60 text-sm mt-1">Generate round robin or knockout brackets and schedule times/locations</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? 'Building matches...' : 'Generate Match Brackets'}
          </button>
          <button onClick={() => navigate(`/tournament/${id}`)} className="btn-secondary">
            Back Details
          </button>
        </div>
      </div>

      {/* Fixtures list */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : fixtures.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-100/50 mb-4">No match fixtures have been generated for this tournament bracket</p>
            <button onClick={handleGenerate} disabled={generating} className="btn-secondary py-1.5 text-xs">
              Generate Now
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Matchup (Team A vs Team B)</th>
                  <th>Date Scheduled</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
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
                      {f.date ? new Date(f.date).toLocaleDateString() : 'Not Scheduled'}
                      {f.startTime && <span className="badge badge-pending font-mono text-[10px] ml-2">{f.startTime}</span>}
                    </td>
                    <td>
                      <span className={`badge ${
                        f.status === 'completed' ? 'badge-success' :
                        f.status === 'live' ? 'badge-live' : 'badge-pending'
                      } capitalize`}>{f.status}</span>
                    </td>
                    <td className="text-right">
                      {f.status !== 'completed' && (
                        <button onClick={() => navigate(`/tournament/${id}/results`)} className="btn-primary py-1 px-3 text-xs">
                          Record Result
                        </button>
                      )}
                      {f.status === 'completed' && (
                        <span className="text-xs text-sport-500 font-bold">Winner: {f.winnerId?.name || 'TBD'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
