import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../app/store';
import toast from 'react-hot-toast';
import {
  PlayIcon, StopIcon, TrophyIcon, UserIcon,
  CheckCircleIcon, XMarkIcon
} from '@heroicons/react/24/outline';

// ─── Cricket Scorer ──────────────────────────────────────────────────────────
function CricketScorer({ match, onBall, onSwitchInnings, onComplete }) {
  const [runs, setRuns] = useState(0);
  const [extras, setExtras] = useState({ type: null, runs: 0 });
  const [wicket, setWicket] = useState({ isWicket: false, type: null });

  const inningIdx = match.currentInning || 0;
  const inning = match.innings?.[inningIdx];
  const isSecondInning = inningIdx === 1;
  const target = inning?.targetRuns;
  const runsNeeded = target ? target - (inning?.totalRuns || 0) : null;
  const ballsLeft = isSecondInning ? (match.totalOvers * 6) - (inning?.balls?.length || 0) : null;

  const handleBall = () => {
    const payload = {
      inningIndex: inningIdx,
      runs,
      extraType: extras.type || null,
      extraRuns: extras.runs || 0,
      isWicket: wicket.isWicket,
      wicketType: wicket.type || null,
      isBoundary: runs === 4 && !extras.type,
      isSix: runs === 6 && !extras.type,
    };
    onBall(payload);
    setRuns(0);
    setExtras({ type: null, runs: 0 });
    setWicket({ isWicket: false, type: null });
  };

  const teamAScore = match.scoreSummary?.teamA;
  const teamBScore = match.scoreSummary?.teamB;
  const battingTeam = inning?.battingTeamId;
  const isBattingTeamA = battingTeam?.toString() === match.teamA?._id?.toString();

  const currentScore = isBattingTeamA ? teamAScore : teamBScore;
  const oversDisplay = `${Math.floor((inning?.balls?.length || 0) / 6)}.${(inning?.balls?.length || 0) % 6}`;

  // Last 6 balls
  const recentBalls = (inning?.balls || []).slice(-6);

  return (
    <div className="space-y-4">
      {/* Scoreboard */}
      <div className="card bg-gradient-to-br from-dark-800 to-dark-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <p className="text-xs text-dark-100/50">{match.teamA?.name}</p>
            <p className="text-2xl font-bold font-mono text-white">
              {teamAScore ? `${teamAScore.runs}/${teamAScore.wickets}` : '0/0'}
              <span className="text-sm font-normal text-dark-100/60 ml-1">({teamAScore?.overs || 0})</span>
            </p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center">
              <span className="text-xs font-bold text-dark-100/60">VS</span>
            </div>
            {isSecondInning && target && (
              <p className="text-xs text-yellow-400 mt-1">Target: {target}</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-dark-100/50">{match.teamB?.name}</p>
            <p className="text-2xl font-bold font-mono text-white">
              {teamBScore ? `${teamBScore.runs}/${teamBScore.wickets}` : '0/0'}
              <span className="text-sm font-normal text-dark-100/60 ml-1">({teamBScore?.overs || 0})</span>
            </p>
          </div>
        </div>

        {/* Over info */}
        <div className="flex items-center justify-between text-xs text-dark-100/50 bg-dark-900/50 rounded-lg px-3 py-1.5">
          <span>Overs: {oversDisplay} / {match.totalOvers}</span>
          {isSecondInning && runsNeeded !== null && (
            <span className="text-yellow-400 font-medium">Need {runsNeeded} off {ballsLeft} balls</span>
          )}
          <span>Inning {inningIdx + 1}</span>
        </div>

        {/* Recent balls */}
        {recentBalls.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-dark-100/40">Recent:</span>
            {recentBalls.map((b, i) => (
              <span key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                b.isWicket ? 'bg-red-500/20 border-red-500 text-red-400' :
                b.isSix ? 'bg-purple-500/20 border-purple-500 text-purple-400' :
                b.isBoundary ? 'bg-green-500/20 border-green-500 text-green-400' :
                b.extraType ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' :
                'bg-dark-600 border-dark-500 text-white'
              }`}>
                {b.isWicket ? 'W' : b.extraType === 'wide' ? 'Wd' : b.extraType === 'no_ball' ? 'Nb' : b.runs + (b.extraRuns || 0)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Run buttons */}
      <div>
        <p className="text-xs text-dark-100/50 mb-2 font-medium uppercase tracking-wider">Runs Scored</p>
        <div className="grid grid-cols-5 gap-2">
          {[0, 1, 2, 3, 4, 6].map(r => (
            <button key={r} onClick={() => setRuns(r)}
              className={`py-3 rounded-xl font-bold text-lg border-2 transition-all ${
                runs === r ? (r === 4 ? 'border-green-500 bg-green-500/20 text-green-400' : r === 6 ? 'border-purple-500 bg-purple-500/20 text-purple-400' : 'border-primary-500 bg-primary-500/20 text-primary-400') : 'border-dark-600 text-white hover:border-dark-500'
              }`}>
              {r === 4 ? '4🏏' : r === 6 ? '6⭐' : r}
            </button>
          ))}
          <button onClick={() => setRuns(5)} className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${runs === 5 ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-600 text-white'}`}>5</button>
        </div>
      </div>

      {/* Extras */}
      <div>
        <p className="text-xs text-dark-100/50 mb-2 font-medium uppercase tracking-wider">Extras</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'wide', label: 'Wide' },
            { key: 'no_ball', label: 'No Ball' },
            { key: 'bye', label: 'Bye' },
            { key: 'leg_bye', label: 'Leg Bye' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setExtras(p => ({ type: p.type === key ? null : key, runs: 1 }))}
              className={`py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${extras.type === key ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' : 'border-dark-600 text-dark-100/60 hover:border-dark-500'}`}>
              {label}
            </button>
          ))}
        </div>
        {extras.type && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-dark-100/50">Extra runs:</span>
            {[1, 2, 3, 4].map(r => (
              <button key={r} onClick={() => setExtras(p => ({ ...p, runs: r }))}
                className={`w-8 h-8 rounded-lg text-sm border transition-all ${extras.runs === r ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' : 'border-dark-600 text-white'}`}>{r}</button>
            ))}
          </div>
        )}
      </div>

      {/* Wicket */}
      <div>
        <p className="text-xs text-dark-100/50 mb-2 font-medium uppercase tracking-wider">Wicket</p>
        <button onClick={() => setWicket(p => ({ isWicket: !p.isWicket, type: null }))}
          className={`w-full py-3 rounded-xl font-bold border-2 transition-all ${wicket.isWicket ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-dark-600 text-white hover:border-red-500/50'}`}>
          {wicket.isWicket ? '🔴 WICKET!' : 'Mark as Wicket'}
        </button>
        {wicket.isWicket && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket'].map(t => (
              <button key={t} onClick={() => setWicket(p => ({ ...p, type: t }))}
                className={`py-1.5 rounded-lg text-xs border capitalize transition-all ${wicket.type === t ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-dark-600 text-dark-100/60'}`}>
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirm ball button */}
      <button onClick={handleBall}
        className="w-full btn-primary py-4 text-base font-bold justify-center">
        ✓ Confirm Ball
      </button>

      {/* Innings control */}
      <div className="grid grid-cols-2 gap-3">
        {inningIdx === 0 && (
          <button onClick={onSwitchInnings} className="btn-secondary py-3 justify-center text-sm">
            🔄 End Inning / Switch
          </button>
        )}
        <button onClick={onComplete} className="btn-danger py-3 justify-center text-sm col-span-1">
          🏁 End Match
        </button>
      </div>
    </div>
  );
}

// ─── Football Scorer ─────────────────────────────────────────────────────────
function FootballScorer({ match, onEvent, onComplete }) {
  const [minute, setMinute] = useState(1);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const teamAScore = match.scoreSummary?.teamA || 0;
  const teamBScore = match.scoreSummary?.teamB || 0;

  const handleEvent = (type) => {
    if (!selectedTeam && !['timeout', 'half_time'].includes(type)) return toast.error('Select a team');
    onEvent({ type, teamId: selectedTeam, minute });
  };

  const EVENTS = [
    { type: 'goal', label: '⚽ Goal', className: 'btn-success' },
    { type: 'own_goal', label: '😬 Own Goal', className: 'btn-danger' },
    { type: 'yellow_card', label: '🟨 Yellow Card', className: 'bg-yellow-500/20 border-yellow-500 text-yellow-300 border' },
    { type: 'red_card', label: '🟥 Red Card', className: 'btn-danger' },
    { type: 'substitution', label: '🔄 Substitution', className: 'btn-secondary' },
    { type: 'penalty', label: '⚡ Penalty', className: 'bg-orange-500/20 border-orange-500 text-orange-300 border' },
  ];

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="card text-center">
        <p className="text-4xl font-bold font-mono text-white">{teamAScore} — {teamBScore}</p>
        <p className="text-dark-100/50 text-sm mt-1">{match.teamA?.name} vs {match.teamB?.name}</p>
      </div>

      {/* Team selector */}
      <div>
        <p className="text-xs text-dark-100/50 mb-2 font-medium uppercase tracking-wider">Team</p>
        <div className="grid grid-cols-2 gap-3">
          {[{ id: match.teamA?._id, name: match.teamA?.name }, { id: match.teamB?._id, name: match.teamB?.name }].map(t => (
            <button key={t.id} onClick={() => setSelectedTeam(t.id)}
              className={`py-3 rounded-xl font-medium text-sm border-2 transition-all ${selectedTeam === t.id ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-600 text-white'}`}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Minute */}
      <div>
        <label className="label">Minute</label>
        <input type="number" className="input" min={1} max={120} value={minute} onChange={e => setMinute(Number(e.target.value))} />
      </div>

      {/* Events */}
      <div className="grid grid-cols-2 gap-2">
        {EVENTS.map(({ type, label, className }) => (
          <button key={type} onClick={() => handleEvent(type)}
            className={`py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] ${className}`}>
            {label}
          </button>
        ))}
      </div>

      <button onClick={onComplete} className="w-full btn-danger py-3 justify-center">🏁 Full Time</button>
    </div>
  );
}

// ─── Generic Scorer (Volleyball, Basketball, Kabaddi, etc.) ──────────────────
function GenericScorer({ match, onEvent, onComplete, sport }) {
  const scoreA = match.scoreSummary?.teamA || 0;
  const scoreB = match.scoreSummary?.teamB || 0;

  const sportConfig = {
    volleyball: { unit: 'Point', events: [{ type: 'point', label: '+1 Point', points: 1 }], setMode: true },
    basketball: { unit: 'Points', events: [{ type: 'basket', label: '+2 Points', points: 2 }, { type: 'three_pointer', label: '+3 Points', points: 3 }, { type: 'free_throw', label: '+1 Free Throw', points: 1 }, { type: 'foul', label: 'Foul', points: 0 }] },
    kabaddi: { unit: 'Point', events: [{ type: 'raid_point', label: 'Raid Point', points: 1 }, { type: 'bonus', label: 'Bonus', points: 1 }, { type: 'tackle', label: 'Tackle', points: 1 }, { type: 'all_out', label: 'All Out (+2)', points: 2 }] },
    badminton: { unit: 'Point', events: [{ type: 'point', label: '+1 Point', points: 1 }], setMode: true },
    table_tennis: { unit: 'Point', events: [{ type: 'point', label: '+1 Point', points: 1 }], setMode: true },
    hockey: { unit: 'Goal', events: [{ type: 'goal', label: '⚽ Goal', points: 1 }, { type: 'penalty_stroke', label: 'Penalty Stroke', points: 1 }, { type: 'card', label: 'Card', points: 0 }] },
  };

  const config = sportConfig[sport] || { unit: 'Point', events: [{ type: 'point', label: '+1 Point', points: 1 }] };
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(config.events[0]);

  const handleScore = () => {
    if (!selectedTeam) return toast.error('Select a team');
    onEvent({ type: selectedEvent.type, teamId: selectedTeam, points: selectedEvent.points });
  };

  return (
    <div className="space-y-4">
      <div className="card text-center">
        <p className="text-4xl font-bold font-mono text-white">{scoreA} — {scoreB}</p>
        <p className="text-dark-100/50 text-sm mt-1 capitalize">{sport} • {match.teamA?.name} vs {match.teamB?.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[{ id: match.teamA?._id, name: match.teamA?.name }, { id: match.teamB?._id, name: match.teamB?.name }].map(t => (
          <button key={t.id} onClick={() => setSelectedTeam(t.id)}
            className={`py-3 rounded-xl font-medium text-sm border-2 transition-all ${selectedTeam === t.id ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-600 text-white'}`}>
            {t.name}
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs text-dark-100/50 mb-2 font-medium uppercase tracking-wider">Event</p>
        <div className="grid grid-cols-2 gap-2">
          {config.events.map(ev => (
            <button key={ev.type} onClick={() => setSelectedEvent(ev)}
              className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${selectedEvent.type === ev.type ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-600 text-white'}`}>
              {ev.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleScore} className="w-full btn-primary py-4 text-base font-bold justify-center">
        ✓ Add {config.unit}
      </button>

      <button onClick={onComplete} className="w-full btn-danger py-3 justify-center">🏁 End Match</button>
    </div>
  );
}

// ─── Player of Match modal ───────────────────────────────────────────────────
function PlayerOfMatchModal({ match, onSelect, onClose }) {
  const [playerId, setPlayerId] = useState('');
  // Get all players from both teams — simplified approach
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const teamIds = [match.teamA?._id, match.teamB?._id].filter(Boolean);
    Promise.all(teamIds.map(id => api.get(`/teams/${id}/players`)))
      .then(results => setPlayers(results.flatMap(r => r.data.data || [])))
      .catch(() => {});
  }, [match]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-dark-800 rounded-2xl p-6 w-80 space-y-4">
        <div className="text-center">
          <TrophyIcon className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
          <h3 className="font-bold text-white text-lg">Player of the Match</h3>
        </div>
        <select className="input" value={playerId} onChange={e => setPlayerId(e.target.value)}>
          <option value="">Select player…</option>
          {players.map(p => <option key={p._id} value={p._id}>{p.name} ({p.role})</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={() => onSelect(playerId)} disabled={!playerId} className="btn-primary flex-1">Confirm</button>
          <button onClick={onClose} className="btn-secondary flex-1">Skip</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main LiveScoreConsole ───────────────────────────────────────────────────
export default function LiveScoreConsole() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { user } = useAuthStore();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPOM, setShowPOM] = useState(false);

  const loadMatch = useCallback(async () => {
    try {
      const res = await api.get(`/matches/${id}`);
      setMatch(res.data.data);
    } catch { toast.error('Failed to load match'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    loadMatch();
    socket?.emit('match:join', id);
    socket?.on('match:update', (data) => {
      setMatch(prev => prev ? { ...prev, scoreSummary: data.scoreSummary, innings: data.innings || prev.innings } : prev);
    });
    socket?.on('match:innings_switch', (data) => {
      setMatch(prev => prev ? { ...prev, innings: data.innings, currentInning: data.currentInning } : prev);
    });
    return () => {
      socket?.emit('match:leave', id);
      socket?.off('match:update');
      socket?.off('match:innings_switch');
    };
  }, [id, socket, loadMatch]);

  const handleCricketBall = async (payload) => {
    try {
      const res = await api.post(`/scoring/${id}/cricket/ball`, payload);
      setMatch(prev => prev ? { ...prev, scoreSummary: res.data.data.scoreSummary, innings: res.data.data.innings } : prev);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to record ball'); }
  };

  const handleSwitchInnings = async () => {
    if (!window.confirm('End this inning and switch?')) return;
    try {
      const res = await api.post(`/scoring/${id}/cricket/switch-innings`);
      setMatch(res.data.data);
      toast.success('Innings switched!');
    } catch { toast.error('Failed to switch innings'); }
  };

  const handleFootballEvent = async (payload) => {
    try {
      const res = await api.post(`/scoring/${id}/football/event`, payload);
      setMatch(prev => prev ? { ...prev, scoreSummary: res.data.data.scoreSummary } : prev);
    } catch { toast.error('Failed to record event'); }
  };

  const handleGenericEvent = async (payload) => {
    try {
      const res = await api.post(`/scoring/${id}/event`, payload);
      setMatch(prev => prev ? { ...prev, scoreSummary: res.data.data.scoreSummary } : prev);
    } catch { toast.error('Failed to record event'); }
  };

  const handleComplete = async () => {
    if (!window.confirm('End this match?')) return;
    setShowPOM(true);
  };

  const handlePOM = async (playerId) => {
    try {
      if (playerId) await api.put(`/scoring/${id}/player-of-match`, { playerId });
      await api.post(`/matches/${id}/complete`, { finalScore: match.scoreSummary });
      toast.success('Match completed!');
      navigate(`/match/${id}/summary`);
    } catch { toast.error('Failed to complete match'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!match) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-dark-100/50">Match not found</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-white text-lg">{match.teamA?.name} vs {match.teamB?.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="badge-live badge text-xs">● LIVE</span>
            <span className="text-xs text-dark-100/50 capitalize">{match.sport} • {match.type}</span>
            {match.groundId && <span className="text-xs text-dark-100/40">📍 {match.groundId?.name}</span>}
          </div>
        </div>
        <button onClick={() => navigate(`/live/${id}`)} className="btn-ghost text-xs p-2">
          👁 View Mode
        </button>
      </div>

      {/* Sport-specific scorer */}
      {match.sport === 'cricket' && (
        <CricketScorer
          match={match}
          onBall={handleCricketBall}
          onSwitchInnings={handleSwitchInnings}
          onComplete={handleComplete}
        />
      )}
      {match.sport === 'football' && (
        <FootballScorer match={match} onEvent={handleFootballEvent} onComplete={handleComplete} />
      )}
      {['volleyball', 'basketball', 'kabaddi', 'badminton', 'table_tennis', 'hockey'].includes(match.sport) && (
        <GenericScorer match={match} onEvent={handleGenericEvent} onComplete={handleComplete} sport={match.sport} />
      )}
      {!['cricket', 'football', 'volleyball', 'basketball', 'kabaddi', 'badminton', 'table_tennis', 'hockey'].includes(match.sport) && (
        <GenericScorer match={match} onEvent={handleGenericEvent} onComplete={handleComplete} sport={match.sport} />
      )}

      {/* Player of Match modal */}
      {showPOM && (
        <PlayerOfMatchModal
          match={match}
          onSelect={handlePOM}
          onClose={() => { setShowPOM(false); handlePOM(null); }}
        />
      )}
    </div>
  );
}
