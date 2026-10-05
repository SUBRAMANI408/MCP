import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, TrophyIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function TournamentStandings() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tourRes, fixtureRes, standingsRes] = await Promise.all([
        api.get(`/tournaments/${id}`),
        api.get('/fixtures', { params: { tournamentId: id } }),
        api.get(`/tournaments/${id}/standings`).catch(() => null),
      ]);

      const tour = tourRes.data.data;
      setTournament(tour);

      const fixtures = fixtureRes.data.data || [];
      setFixtures(fixtures);

      if (standingsRes?.data?.data?.standings?.length > 0) {
        const serverStandings = standingsRes.data.data.standings.map(s => ({
          team: s.teamId || {},
          played: s.played,
          won: s.won,
          lost: s.lost,
          drawn: s.drawn || s.tied,
          goalsFor: s.goalsFor || s.runsFor,
          goalsAgainst: s.goalsAgainst || s.runsAgainst,
          points: s.points,
          netRunRate: s.netRunRate,
          rank: s.rank,
        }));
        setStandings(serverStandings);
        return;
      }

      // Build standings from completed fixtures (fallback)
      const standingsMap = {};

      // Initialize all registered teams
      (tour.registeredTeams || []).forEach(team => {
        standingsMap[team._id] = {
          team,
          played: 0,
          won: 0,
          lost: 0,
          drawn: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0,
        };
      });

      // Process completed fixtures
      fixtures.filter(f => f.status === 'completed').forEach(f => {
        const teamAId = f.teamA?._id;
        const teamBId = f.teamB?._id;
        const scoreA = f.result?.teamA ?? f.scoreA ?? 0;
        const scoreB = f.result?.teamB ?? f.scoreB ?? 0;

        if (standingsMap[teamAId]) {
          standingsMap[teamAId].played += 1;
          standingsMap[teamAId].goalsFor += scoreA;
          standingsMap[teamAId].goalsAgainst += scoreB;
          if (scoreA > scoreB) { standingsMap[teamAId].won += 1; standingsMap[teamAId].points += 3; }
          else if (scoreA === scoreB) { standingsMap[teamAId].drawn += 1; standingsMap[teamAId].points += 1; }
          else { standingsMap[teamAId].lost += 1; }
        }

        if (standingsMap[teamBId]) {
          standingsMap[teamBId].played += 1;
          standingsMap[teamBId].goalsFor += scoreB;
          standingsMap[teamBId].goalsAgainst += scoreA;
          if (scoreB > scoreA) { standingsMap[teamBId].won += 1; standingsMap[teamBId].points += 3; }
          else if (scoreA === scoreB) { standingsMap[teamBId].drawn += 1; standingsMap[teamBId].points += 1; }
          else { standingsMap[teamBId].lost += 1; }
        }
      });

      const sortedStandings = Object.values(standingsMap).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        return b.goalsFor - a.goalsFor;
      });

      setStandings(sortedStandings);
    } catch {
      toast.error('Failed to load standings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="section-title gradient-text">{tournament?.name} — Standings</h1>
          <p className="text-dark-100/60 text-sm mt-0.5 capitalize">{tournament?.format?.replace('_', ' ')} • {tournament?.sport}</p>
        </div>
      </div>

      {/* Standings Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th>Team</th>
                <th className="text-center">Played</th>
                <th className="text-center">Won</th>
                <th className="text-center">Drawn</th>
                <th className="text-center">Lost</th>
                <th className="text-center">GF</th>
                <th className="text-center">GA</th>
                <th className="text-center">GD</th>
                <th className="text-center font-bold text-white">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, idx) => (
                <tr key={row.team._id} className={idx === 0 ? 'border-l-2 border-yellow-500' : ''}>
                  <td>
                    {idx === 0 ? (
                      <TrophyIcon className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <span className="text-dark-100/50">{idx + 1}</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {row.team.name?.[0]}
                      </div>
                      <span className="font-semibold text-white text-sm">{row.team.name}</span>
                    </div>
                  </td>
                  <td className="text-center text-dark-100/70">{row.played}</td>
                  <td className="text-center text-green-400 font-medium">{row.won}</td>
                  <td className="text-center text-yellow-400 font-medium">{row.drawn}</td>
                  <td className="text-center text-red-400 font-medium">{row.lost}</td>
                  <td className="text-center text-dark-100/70">{row.goalsFor}</td>
                  <td className="text-center text-dark-100/70">{row.goalsAgainst}</td>
                  <td className="text-center text-dark-100/70">{row.goalsFor - row.goalsAgainst > 0 ? '+' : ''}{row.goalsFor - row.goalsAgainst}</td>
                  <td className="text-center">
                    <span className="font-bold text-white text-lg">{row.points}</span>
                  </td>
                </tr>
              ))}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-dark-100/40 py-8">
                    No standings data yet. Matches need to be completed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Fixtures */}
      {fixtures.length > 0 && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">All Fixtures ({fixtures.length})</h3>
          <div className="space-y-2">
            {fixtures.map(f => (
              <div key={f._id} className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-700/30">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-medium text-white">{f.teamA?.name || 'TBD'}</span>
                  <span className="text-dark-100/40 text-xs">vs</span>
                  <span className="text-sm font-medium text-white">{f.teamB?.name || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {f.status === 'completed' && (
                    <span className="font-mono text-white text-sm">
                      {f.result?.teamA ?? 0} — {f.result?.teamB ?? 0}
                    </span>
                  )}
                  <span className={`badge text-xs capitalize ${
                    f.status === 'completed' ? 'badge-success' :
                    f.status === 'live' ? 'badge-danger' : 'badge-pending'
                  }`}>{f.status}</span>
                  <span className="text-xs text-dark-100/40">{f.round ? `R${f.round}` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
