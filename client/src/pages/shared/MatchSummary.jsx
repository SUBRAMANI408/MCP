import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, TrophyIcon, MapPinIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function MatchSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/matches/${id}/summary`)
      .then(res => setMatch(res.data.data?.match || res.data.data))
      .catch(() => toast.error('Failed to load match summary'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!match) return (
    <div className="card text-center py-12 text-dark-100/50">Match not found.</div>
  );

  const scoreA = match.scoreSummary?.teamA ?? 0;
  const scoreB = match.scoreSummary?.teamB ?? 0;
  const winner = scoreA > scoreB ? match.teamA : scoreB > scoreA ? match.teamB : null;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="section-title gradient-text">Match Summary</h1>
          <p className="text-dark-100/60 text-xs">Final result and event log</p>
        </div>
      </div>

      {/* Final Score Card */}
      <div className="card text-center space-y-5 bg-gradient-to-b from-dark-800 to-dark-900">
        <span className="badge badge-success text-sm px-4 py-1">Final Result</span>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">
              {match.teamA?.name?.[0]}
            </div>
            <p className="font-bold text-white text-lg">{match.teamA?.name || 'Team A'}</p>
            {winner?._id === match.teamA?._id && (
              <div className="flex items-center justify-center gap-1 mt-1 text-yellow-400 text-xs">
                <TrophyIcon className="w-3.5 h-3.5" /> Winner
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="text-5xl font-bold text-white font-mono">
              {scoreA} <span className="text-dark-100/30">:</span> {scoreB}
            </div>
            {!winner && <p className="text-sm text-dark-100/50 mt-1">Draw</p>}
          </div>

          <div className="flex-1 text-center">
            <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3">
              {match.teamB?.name?.[0]}
            </div>
            <p className="font-bold text-white text-lg">{match.teamB?.name || 'Team B'}</p>
            {winner?._id === match.teamB?._id && (
              <div className="flex items-center justify-center gap-1 mt-1 text-yellow-400 text-xs">
                <TrophyIcon className="w-3.5 h-3.5" /> Winner
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-dark-100/50 border-t border-dark-700/50 pt-4">
          {match.groundId && (
            <div className="flex items-center gap-1.5">
              <MapPinIcon className="w-4 h-4" />
              {match.groundId.name}
            </div>
          )}
          {match.endedAt && (
            <div className="flex items-center gap-1.5">
              <CalendarDaysIcon className="w-4 h-4" />
              {new Date(match.endedAt).toLocaleDateString()}
            </div>
          )}
          <span className={`badge capitalize text-xs ${match.type === 'tournament' ? 'badge-info' : 'badge-pending'}`}>
            {match.type}
          </span>
        </div>
      </div>

      {/* Events Log */}
      {match.events?.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-white">Match Events ({match.events.length})</h3>
          <div className="space-y-2">
            {match.events.map((event, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-dark-900 border border-dark-700/30">
                <div className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-xs text-dark-100/50 flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white capitalize">{event.type?.replace(/_/g, ' ')}</p>
                </div>
                <span className="text-xs text-dark-100/40">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
