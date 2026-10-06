import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../app/store';
import { getDashboardRoute } from '../../utils/permissions';
import { TrophyIcon, SignalIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const formatOvers = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

// ─── Cricket Scorecard ───────────────────────────────────────────────────────
function CricketScorecard({ match }) {
  const inning = match.innings?.[match.currentInning || 0];
  const inning1 = match.innings?.[0];
  const inning2 = match.innings?.[1];

  // Helper to derive score from inning if scoreSummary is empty
  const getInningScoreForTeam = (teamId) => {
    if (!teamId) return null;
    const inn = match.innings?.find(i => i.battingTeamId?.toString() === teamId?.toString());
    if (!inn) return null;
    const ov = inn.overs !== undefined && inn.overs !== null ? inn.overs : formatOvers(inn.balls?.length || 0);
    return {
      runs: inn.totalRuns || 0,
      wickets: inn.wickets || 0,
      overs: ov,
    };
  };

  const teamAScore = match.scoreSummary?.teamA || getInningScoreForTeam(match.teamA?._id || match.teamA);
  const teamBScore = match.scoreSummary?.teamB || getInningScoreForTeam(match.teamB?._id || match.teamB);

  // Get over summary (last 6 balls of each over)
  const getOverSummary = (balls) => {
    const overs = [];
    for (let i = 0; i < balls.length; i += 6) {
      overs.push(balls.slice(i, i + 6));
    }
    return overs;
  };

  const overSummary = getOverSummary(inning?.balls || []);

  return (
    <div className="space-y-4">
      {/* Main scoreboard */}
      <div className="card bg-gradient-to-br from-dark-800 to-dark-700">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <p className="text-sm text-dark-100/50">{match.teamA?.name}</p>
            <p className="text-3xl font-bold font-mono text-white">
              {teamAScore ? `${teamAScore.runs}/${teamAScore.wickets}` : '—'}
            </p>
            {teamAScore && <p className="text-xs text-dark-100/50">({teamAScore.overs} ov)</p>}
          </div>
          <div className="text-center px-4">
            <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center mb-1">
              <span className="text-xs font-bold text-dark-100/60">VS</span>
            </div>
            {inning2?.targetRuns && (
              <p className="text-xs text-yellow-400">Target: {inning2.targetRuns}</p>
            )}
          </div>
          <div className="text-center flex-1">
            <p className="text-sm text-dark-100/50">{match.teamB?.name}</p>
            <p className="text-3xl font-bold font-mono text-white">
              {teamBScore ? `${teamBScore.runs}/${teamBScore.wickets}` : '—'}
            </p>
            {teamBScore && <p className="text-xs text-dark-100/50">({teamBScore.overs} ov)</p>}
          </div>
        </div>

        {/* Current inning info */}
        {inning && !inning.completed && (
          <div className="bg-dark-900/50 rounded-xl px-4 py-2 text-center">
            <p className="text-xs text-dark-100/50">
              Inning {(match.currentInning || 0) + 1} • {inning.overs || formatOvers(inning.balls?.length || 0)} / {match.totalOvers} overs
            </p>
          </div>
        )}
      </div>

      {/* Recent over-by-over */}
      {overSummary.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-white text-sm">Ball-by-Ball</h3>
          <div className="space-y-2">
            {overSummary.map((over, overNum) => (
              <div key={overNum} className="flex items-center gap-2">
                <span className="text-xs text-dark-100/40 w-8 flex-shrink-0">Ov {overNum + 1}</span>
                <div className="flex gap-1 flex-wrap">
                  {over.map((ball, bi) => (
                    <span key={bi} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                      ball.isWicket ? 'bg-red-500/20 border-red-500 text-red-400' :
                      ball.isSix ? 'bg-purple-500/20 border-purple-500 text-purple-400' :
                      ball.isBoundary ? 'bg-green-500/20 border-green-500 text-green-400' :
                      ball.extraType ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' :
                      'bg-dark-600 border-dark-500 text-white'
                    }`}>
                      {ball.isWicket ? 'W' : ball.extraType === 'wide' ? 'Wd' : ball.extraType === 'no_ball' ? 'Nb' : (ball.runs + (ball.extraRuns || 0))}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-dark-100/40 ml-auto">
                  {over.reduce((s, b) => s + b.runs + (b.extraRuns || 0), 0)} runs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fall of wickets */}
      {inning?.fallOfWickets?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-3">Fall of Wickets</h3>
          <div className="flex flex-wrap gap-2">
            {inning.fallOfWickets.map((fow, i) => (
              <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-lg px-2 py-1 text-xs">
                <span className="text-red-400 font-bold">{fow.wicket}W</span>
                <span className="text-dark-100/60 ml-1">{fow.runs} ({fow.over?.toFixed(1)})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extras */}
      {inning?.extras && inning.extras.total > 0 && (
        <div className="card">
          <h3 className="font-semibold text-white text-sm mb-2">Extras: {inning.extras.total}</h3>
          <div className="flex gap-4 text-xs text-dark-100/60">
            {Object.entries(inning.extras).filter(([k]) => k !== 'total' && k !== 'noBall').map(([k, v]) => (
              v > 0 && <span key={k}>{k}: {v}</span>
            ))}
            {inning.extras.noBall > 0 && <span>nb: {inning.extras.noBall}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Football Scorecard ──────────────────────────────────────────────────────
function FootballScorecard({ match }) {
  const goals = match.events?.filter(e => e.type === 'goal') || [];
  const cards = match.events?.filter(e => ['yellow_card', 'red_card'].includes(e.type)) || [];
  const subs = match.events?.filter(e => e.type === 'substitution') || [];

  const teamAGoals = goals.filter(g => g.teamId?.toString() === match.teamA?._id?.toString()).length;
  const teamBGoals = goals.filter(g => g.teamId?.toString() === match.teamB?._id?.toString()).length;

  return (
    <div className="space-y-4">
      <div className="card text-center bg-gradient-to-br from-dark-800 to-dark-700">
        <p className="text-5xl font-bold font-mono text-white">{teamAGoals} — {teamBGoals}</p>
        <p className="text-dark-100/50 text-sm mt-2">{match.teamA?.name} vs {match.teamB?.name}</p>
      </div>

      {/* Goals timeline */}
      {goals.length > 0 && (
        <div className="card space-y-2">
          <h3 className="font-semibold text-white text-sm">Goals</h3>
          {goals.map((g, i) => {
            const isTeamA = g.teamId?.toString() === match.teamA?._id?.toString();
            return (
              <div key={i} className={`flex items-center gap-3 ${isTeamA ? '' : 'flex-row-reverse'}`}>
                <span className="text-xl">⚽</span>
                <div className={`flex-1 ${isTeamA ? 'text-left' : 'text-right'}`}>
                  <p className="text-sm text-white">{isTeamA ? match.teamA?.name : match.teamB?.name}</p>
                  <p className="text-xs text-dark-100/50">Minute {g.data?.minute}'</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cards */}
      {cards.length > 0 && (
        <div className="card space-y-2">
          <h3 className="font-semibold text-white text-sm">Cards</h3>
          {cards.map((c, i) => (
            <div key={i} className="flex items-center gap-3">
              <span>{c.type === 'yellow_card' ? '🟨' : '🟥'}</span>
              <span className="text-sm text-white">{c.type.replace('_', ' ')}</span>
              <span className="text-xs text-dark-100/50 ml-auto">{c.data?.minute}'</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Generic Scorecard ───────────────────────────────────────────────────────
function GenericScorecard({ match }) {
  const scoreA = match.scoreSummary?.teamA || 0;
  const scoreB = match.scoreSummary?.teamB || 0;

  // Volleyball sets
  if (match.sport === 'volleyball' && match.scoreSummary?.sets) {
    return (
      <div className="space-y-4">
        <div className="card text-center">
          <p className="text-4xl font-bold font-mono text-white">{scoreA} — {scoreB}</p>
          <p className="text-dark-100/50 text-sm mt-1">Sets Won</p>
        </div>
        <div className="card space-y-2">
          <h3 className="font-semibold text-white text-sm">Set Scores</h3>
          {match.scoreSummary.sets.map((set, i) => set && (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-dark-100/50">Set {i + 1}</span>
              <span className={`font-mono font-bold ${set.scoreA > set.scoreB ? 'text-green-400' : 'text-white'}`}>{set.scoreA}</span>
              <span className="text-dark-100/40">—</span>
              <span className={`font-mono font-bold ${set.scoreB > set.scoreA ? 'text-green-400' : 'text-white'}`}>{set.scoreB}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card text-center">
      <p className="text-5xl font-bold font-mono text-white">{scoreA} — {scoreB}</p>
      <p className="text-dark-100/50 text-sm mt-2 capitalize">{match.sport}</p>
      <p className="text-dark-100/50 text-sm">{match.teamA?.name} vs {match.teamB?.name}</p>
      <div className="grid grid-cols-2 gap-4 mt-4 text-left">
        <div>
          <p className="text-xs text-dark-100/40 mb-2">{match.teamA?.name} Events</p>
          {match.events?.filter(e => e.teamId?.toString() === match.teamA?._id?.toString()).slice(-5).map((ev, i) => (
            <p key={i} className="text-xs text-dark-100/60">{ev.type.replace(/_/g, ' ')} +{ev.data?.points || 0}</p>
          ))}
        </div>
        <div>
          <p className="text-xs text-dark-100/40 mb-2">{match.teamB?.name} Events</p>
          {match.events?.filter(e => e.teamId?.toString() === match.teamB?._id?.toString()).slice(-5).map((ev, i) => (
            <p key={i} className="text-xs text-dark-100/60">{ev.type.replace(/_/g, ' ')} +{ev.data?.points || 0}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main LiveScoreView ──────────────────────────────────────────────────────
export default function LiveScoreView() {
  const { id } = useParams();
  const { socket, connected } = useSocket();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadMatch = useCallback(async () => {
    try {
      const res = await api.get(`/matches/${id}`);
      setMatch(res.data.data);
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    loadMatch();
    socket?.emit('match:join', id);

    socket?.on('match:update', (data) => {
      setMatch(prev => prev ? {
        ...prev,
        scoreSummary: data.scoreSummary,
        events: data.event ? [...(prev.events || []), data.event] : prev.events,
        innings: data.innings || prev.innings,
      } : prev);
      setLastUpdate(new Date());
    });

    socket?.on('match:innings_switch', (data) => {
      setMatch(prev => prev ? { ...prev, innings: data.innings, currentInning: data.currentInning } : prev);
    });

    socket?.on('match:player_of_match', (data) => {
      setMatch(prev => prev ? { ...prev, playerOfMatchId: data.player } : prev);
    });

    // Auto refresh every 30 seconds
    const interval = setInterval(loadMatch, 30000);
    return () => {
      socket?.emit('match:leave', id);
      socket?.off('match:update');
      socket?.off('match:innings_switch');
      socket?.off('match:player_of_match');
      clearInterval(interval);
    };
  }, [id, socket, loadMatch]);

  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(getDashboardRoute(user?.role));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!match) return (
    <div className="text-center py-12 text-dark-100/50">
      <p>Match not found</p>
      <button onClick={handleBack} className="btn-secondary mt-4">
        Go Back
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in p-4">
      {/* Top Navigation & Status bar */}
      <div className="flex items-center justify-between pb-1 border-b border-dark-700/40">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="btn-secondary p-2 rounded-xl text-dark-100/80 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Go Back"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            {match.status === 'live' ? (
              <span className="badge-live badge flex items-center gap-1">
                <SignalIcon className="w-3 h-3" /> LIVE
              </span>
            ) : (
              <span className={`badge ${match.status === 'completed' ? 'badge-success' : 'badge-pending'} capitalize`}>{match.status}</span>
            )}
            <span className="text-xs text-dark-100/50 capitalize">{match.sport} • {match.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-dark-100/30">Updated {lastUpdate.toLocaleTimeString()}</span>
          )}
          <button
            onClick={() => navigate(getDashboardRoute(user?.role))}
            className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Sport-specific scorecard */}
      {match.sport === 'cricket' && <CricketScorecard match={match} />}
      {match.sport === 'football' && <FootballScorecard match={match} />}
      {!['cricket', 'football'].includes(match.sport) && <GenericScorecard match={match} />}

      {/* Player of match */}
      {match.status === 'completed' && match.playerOfMatchId && (
        <div className="card flex items-center gap-4">
          <TrophyIcon className="w-8 h-8 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-yellow-400 font-semibold">Player of the Match</p>
            <p className="font-bold text-white">{match.playerOfMatchId?.name || 'TBD'}</p>
          </div>
        </div>
      )}

      {/* Match info */}
      <div className="card-sm grid grid-cols-2 gap-3 text-xs">
        {match.groundId && (
          <div><p className="text-dark-100/40">Ground</p><p className="text-white">{match.groundId?.name}</p></div>
        )}
        {match.sport === 'cricket' && (
          <>
            <div><p className="text-dark-100/40">Overs</p><p className="text-white">{match.totalOvers}</p></div>
            <div><p className="text-dark-100/40">Ball Type</p><p className="text-white capitalize">{match.ballType}</p></div>
            {match.tossWinner && (
              <div><p className="text-dark-100/40">Toss</p><p className="text-white">{match.tossWinner?.name || '—'} elected to {match.tossDecision}</p></div>
            )}
          </>
        )}
        {match.startedAt && (
          <div><p className="text-dark-100/40">Started</p><p className="text-white">{new Date(match.startedAt).toLocaleTimeString()}</p></div>
        )}
      </div>
    </div>
  );
}
