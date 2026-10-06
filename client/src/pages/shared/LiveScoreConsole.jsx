import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuthStore } from '../../app/store';
import { getDashboardRoute } from '../../utils/permissions';
import toast from 'react-hot-toast';
import {
  PlayIcon, StopIcon, TrophyIcon, UserIcon,
  CheckCircleIcon, XMarkIcon, ArrowPathRoundedSquareIcon,
  ArrowUturnLeftIcon, ExclamationTriangleIcon, TableCellsIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

// ─── Full Scorecard Modal ──────────────────────────────────────────────────
function ScorecardModal({ matchId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeInning, setActiveInning] = useState(0);

  useEffect(() => {
    api.get(`/scoring/${matchId}/scorecard`)
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load scorecard'))
      .finally(() => setLoading(false));
  }, [matchId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <div className="flex items-center gap-2">
            <TableCellsIcon className="w-5 h-5 text-primary-400" />
            <h3 className="font-bold text-white text-base">Match Scorecard</h3>
          </div>
          <button onClick={onClose} className="p-1 text-dark-100/60 hover:text-white rounded-lg">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : !data ? (
            <p className="text-center text-dark-100/50 py-8">Scorecard not available</p>
          ) : (
            <>
              {/* Inning Switcher */}
              <div className="flex gap-2 border-b border-dark-700 pb-2">
                {data.innings.map((inn, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveInning(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeInning === idx
                        ? 'bg-primary-500 text-white'
                        : 'bg-dark-700 text-dark-100/60 hover:text-white'
                    }`}
                  >
                    {inn.battingTeam?.name || `Innings ${idx + 1}`} ({inn.totalRuns}/{inn.wickets} in {inn.overs} ov)
                  </button>
                ))}
              </div>

              {data.innings[activeInning] && (
                <div className="space-y-4 text-xs">
                  {/* Batting Table */}
                  <div>
                    <h4 className="font-semibold text-dark-100/80 uppercase tracking-wider mb-2">Batting</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-dark-700 text-dark-100/50 text-[11px]">
                            <th className="py-2">Batter</th>
                            <th>Dismissal</th>
                            <th className="text-right">R</th>
                            <th className="text-right">B</th>
                            <th className="text-right">4s</th>
                            <th className="text-right">6s</th>
                            <th className="text-right">SR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.innings[activeInning].battingTable?.map((b, i) => (
                            <tr key={i} className="border-b border-dark-700/50 text-white">
                              <td className="py-2 font-medium">{b.name}</td>
                              <td className="text-dark-100/50">{b.dismissal}</td>
                              <td className="text-right font-mono font-bold">{b.runs}</td>
                              <td className="text-right font-mono text-dark-100/60">{b.balls}</td>
                              <td className="text-right font-mono text-dark-100/60">{b.fours}</td>
                              <td className="text-right font-mono text-dark-100/60">{b.sixes}</td>
                              <td className="text-right font-mono text-dark-100/60">{b.strikeRate}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bowling Table */}
                  <div>
                    <h4 className="font-semibold text-dark-100/80 uppercase tracking-wider mb-2">Bowling</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-dark-700 text-dark-100/50 text-[11px]">
                            <th className="py-2">Bowler</th>
                            <th className="text-right">O</th>
                            <th className="text-right">M</th>
                            <th className="text-right">R</th>
                            <th className="text-right">W</th>
                            <th className="text-right">ECON</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.innings[activeInning].bowlingTable?.map((bw, i) => (
                            <tr key={i} className="border-b border-dark-700/50 text-white">
                              <td className="py-2 font-medium">{bw.name}</td>
                              <td className="text-right font-mono">{bw.overs}</td>
                              <td className="text-right font-mono text-dark-100/60">{bw.maidens}</td>
                              <td className="text-right font-mono">{bw.runs}</td>
                              <td className="text-right font-mono font-bold text-red-400">{bw.wickets}</td>
                              <td className="text-right font-mono text-dark-100/60">{bw.economy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Extras and Fall of Wickets */}
                  <div className="bg-dark-900/60 p-3 rounded-xl space-y-2 text-dark-100/70">
                    <p><span className="text-dark-100/40 font-medium">Extras:</span> {data.innings[activeInning].extras?.total || 0} (wd {data.innings[activeInning].extras?.wide || 0}, nb {data.innings[activeInning].extras?.noBall || 0}, b {data.innings[activeInning].extras?.bye || 0}, lb {data.innings[activeInning].extras?.legBye || 0})</p>
                    {data.innings[activeInning].fallOfWickets?.length > 0 && (
                      <p><span className="text-dark-100/40 font-medium">Fall of Wickets:</span> {data.innings[activeInning].fallOfWickets.map((f, i) => `${f.runs}/${f.wicket} (${f.batsmanName || 'Batter'}, ${f.over} ov)`).join(', ')}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Abandon Match Modal ───────────────────────────────────────────────────
function AbandonModal({ onConfirm, onClose }) {
  const [reason, setReason] = useState('Rain / Wet Outfield');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-dark-800 rounded-2xl p-5 w-full max-w-sm space-y-4 border border-dark-700">
        <h3 className="font-bold text-white text-base">Abandon Match</h3>
        <p className="text-xs text-dark-100/60">Match status will be set to abandoned and recorded without points penalty.</p>
        <select className="input text-xs" value={reason} onChange={e => setReason(e.target.value)}>
          <option value="Rain / Wet Outfield">Rain / Wet Outfield</option>
          <option value="Bad Light">Bad Light</option>
          <option value="Technical Issue">Technical / Equipment Issue</option>
          <option value="Mutual Agreement">Mutual Agreement</option>
          <option value="Medical Emergency">Medical Emergency</option>
        </select>
        <div className="flex gap-2">
          <button onClick={() => onConfirm(reason)} className="btn-danger flex-1 py-2 text-xs">Confirm Abandon</button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2 text-xs">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Cricket Scorer ──────────────────────────────────────────────────────────
function CricketScorer({
  match,
  onBall,
  onSwitchInnings,
  onComplete,
  onSelectBatsman,
  onSelectBowler,
  onSwapStrike,
  onUndoBall,
  onAbandon,
  onOpenScorecard,
  disabled
}) {
  const [runs, setRuns] = useState(0);
  const [extras, setExtras] = useState({ type: null, runs: 0 });
  const [wicket, setWicket] = useState({ isWicket: false, type: null });
  const [battingPlayers, setBattingPlayers] = useState([]);
  const [bowlingPlayers, setBowlingPlayers] = useState([]);
  const [showAbandon, setShowAbandon] = useState(false);

  const inningIdx = match.currentInning || 0;
  const inning = match.innings?.[inningIdx];
  const isSecondInning = inningIdx === 1;
  const target = inning?.targetRuns;
  const runsNeeded = target ? target - (inning?.totalRuns || 0) : null;
  const ballsLeft = isSecondInning ? (match.totalOvers * 6) - (inning?.balls?.length || 0) : null;

  // Load team player rosters for striker/bowler selectors
  useEffect(() => {
    if (inning?.battingTeamId) {
      api.get(`/teams/${inning.battingTeamId}/players`)
        .then(res => setBattingPlayers(res.data.data || []))
        .catch(() => {});
    }
    if (inning?.bowlingTeamId) {
      api.get(`/teams/${inning.bowlingTeamId}/players`)
        .then(res => setBowlingPlayers(res.data.data || []))
        .catch(() => {});
    }
  }, [inning?.battingTeamId, inning?.bowlingTeamId]);

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
      batsmanId: match.currentBatsmen?.strikerId || null,
      bowlerId: match.currentBowlerId || null,
    };
    onBall(payload);
    setRuns(0);
    setExtras({ type: null, runs: 0 });
    setWicket({ isWicket: false, type: null });
  };

  const teamAScore = match.scoreSummary?.teamA;
  const teamBScore = match.scoreSummary?.teamB;
  const oversDisplay = `${Math.floor((inning?.balls?.length || 0) / 6)}.${(inning?.balls?.length || 0) % 6}`;
  const recentBalls = (inning?.balls || []).slice(-6);

  const strikerName = battingPlayers.find(p => p._id === match.currentBatsmen?.strikerId)?.name || 'Select Striker';
  const nonStrikerName = battingPlayers.find(p => p._id === match.currentBatsmen?.nonStrikerId)?.name || 'Select Non-Striker';
  const bowlerName = bowlingPlayers.find(p => p._id === match.currentBowlerId)?.name || 'Select Bowler';

  return (
    <div className="space-y-4">
      {/* Scoreboard */}
      <div className="card bg-gradient-to-br from-dark-800 to-dark-700 p-4 border border-dark-600">
        <div className="flex items-center justify-between mb-3">
          <div className="text-center">
            <p className="text-xs text-dark-100/50">{match.teamA?.name}</p>
            <p className="text-2xl font-bold font-mono text-white">
              {teamAScore ? `${teamAScore.runs}/${teamAScore.wickets}` : '0/0'}
              <span className="text-sm font-normal text-dark-100/60 ml-1">({teamAScore?.overs || 0})</span>
            </p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center mx-auto">
              <span className="text-xs font-bold text-dark-100/60">VS</span>
            </div>
            {isSecondInning && target && (
              <p className="text-xs text-yellow-400 mt-1 font-semibold">Target: {target}</p>
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
        <div className="flex items-center justify-between text-xs text-dark-100/60 bg-dark-900/60 rounded-lg px-3 py-1.5">
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

      {/* Active Lineup & Scorer Controls Widget */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-white uppercase tracking-wider">Active Lineup</p>
          <div className="flex gap-2">
            <button
              onClick={onSwapStrike}
              disabled={disabled}
              className="px-2 py-1 bg-dark-700 hover:bg-dark-600 text-primary-400 border border-dark-600 rounded text-xs flex items-center gap-1"
            >
              <ArrowPathRoundedSquareIcon className="w-3.5 h-3.5" />
              Swap Strike
            </button>
            <button
              onClick={onUndoBall}
              disabled={disabled}
              className="px-2 py-1 bg-dark-700 hover:bg-dark-600 text-yellow-400 border border-dark-600 rounded text-xs flex items-center gap-1"
            >
              <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
              Undo Ball
            </button>
            <button
              onClick={onOpenScorecard}
              className="px-2 py-1 bg-dark-700 hover:bg-dark-600 text-dark-100/70 border border-dark-600 rounded text-xs flex items-center gap-1"
            >
              <TableCellsIcon className="w-3.5 h-3.5" />
              Scorecard
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Striker Picker */}
          <div>
            <label className="text-dark-100/50 block mb-1">🏏 Striker (*)</label>
            <select
              className="input py-1 text-xs"
              value={match.currentBatsmen?.strikerId || ''}
              onChange={e => onSelectBatsman(e.target.value, match.currentBatsmen?.nonStrikerId)}
              disabled={disabled}
            >
              <option value="">Choose Striker...</option>
              {battingPlayers.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Non-Striker Picker */}
          <div>
            <label className="text-dark-100/50 block mb-1">Non-Striker</label>
            <select
              className="input py-1 text-xs"
              value={match.currentBatsmen?.nonStrikerId || ''}
              onChange={e => onSelectBatsman(match.currentBatsmen?.strikerId, e.target.value)}
              disabled={disabled}
            >
              <option value="">Choose Non-Striker...</option>
              {battingPlayers.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Bowler Picker */}
          <div>
            <label className="text-dark-100/50 block mb-1">🎯 Bowler</label>
            <select
              className="input py-1 text-xs"
              value={match.currentBowlerId || ''}
              onChange={e => onSelectBowler(e.target.value)}
              disabled={disabled}
            >
              <option value="">Choose Bowler...</option>
              {bowlingPlayers.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Run buttons */}
      <div>
        <p className="text-xs text-dark-100/50 mb-2 font-medium uppercase tracking-wider">Runs Scored</p>
        <div className="grid grid-cols-6 gap-2">
          {[0, 1, 2, 3, 4, 6].map(r => (
            <button key={r} onClick={() => setRuns(r)} disabled={disabled}
              className={`py-3 rounded-xl font-bold text-lg border-2 transition-all ${
                runs === r ? (r === 4 ? 'border-green-500 bg-green-500/20 text-green-400' : r === 6 ? 'border-purple-500 bg-purple-500/20 text-purple-400' : 'border-primary-500 bg-primary-500/20 text-primary-400') : 'border-dark-600 text-white hover:border-dark-500'
              }`}>
              {r === 4 ? '4🏏' : r === 6 ? '6⭐' : r}
            </button>
          ))}
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
            <button key={key} onClick={() => setExtras(p => ({ type: p.type === key ? null : key, runs: 1 }))} disabled={disabled}
              className={`py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${extras.type === key ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' : 'border-dark-600 text-dark-100/60 hover:border-dark-500'}`}>
              {label}
            </button>
          ))}
        </div>
        {extras.type && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-dark-100/50">Extra runs:</span>
            {[1, 2, 3, 4].map(r => (
              <button key={r} onClick={() => setExtras(p => ({ ...p, runs: r }))} disabled={disabled}
                className={`w-8 h-8 rounded-lg text-sm border transition-all ${extras.runs === r ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' : 'border-dark-600 text-white'}`}>{r}</button>
            ))}
          </div>
        )}
      </div>

      {/* Wicket */}
      <div>
        <p className="text-xs text-dark-100/50 mb-2 font-medium uppercase tracking-wider">Wicket</p>
        <button onClick={() => setWicket(p => ({ isWicket: !p.isWicket, type: null }))} disabled={disabled}
          className={`w-full py-3 rounded-xl font-bold border-2 transition-all ${wicket.isWicket ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-dark-600 text-white hover:border-red-500/50'}`}>
          {wicket.isWicket ? '🔴 WICKET!' : 'Mark as Wicket'}
        </button>
        {wicket.isWicket && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {['bowled', 'caught', 'lbw', 'run_out', 'stumped', 'hit_wicket'].map(t => (
              <button key={t} onClick={() => setWicket(p => ({ ...p, type: t }))} disabled={disabled}
                className={`py-1.5 rounded-lg text-xs border capitalize transition-all ${wicket.type === t ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-dark-600 text-dark-100/60'}`}>
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirm ball button */}
      <button onClick={handleBall} disabled={disabled}
        className="w-full btn-primary py-4 text-base font-bold justify-center disabled:opacity-50">
        ✓ Confirm Ball
      </button>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        {inningIdx === 0 && (
          <button onClick={onSwitchInnings} disabled={disabled} className="btn-secondary py-2.5 justify-center text-xs">
            🔄 Switch Innings
          </button>
        )}
        <button onClick={() => setShowAbandon(true)} disabled={disabled} className="btn-secondary text-yellow-400 py-2.5 justify-center text-xs">
          ⚠️ Abandon
        </button>
        <button onClick={onComplete} disabled={disabled} className="btn-danger py-2.5 justify-center text-xs">
          🏁 End Match
        </button>
      </div>

      {showAbandon && (
        <AbandonModal onConfirm={(reason) => { setShowAbandon(false); onAbandon(reason); }} onClose={() => setShowAbandon(false)} />
      )}
    </div>
  );
}

// ─── Football Scorer ─────────────────────────────────────────────────────────
function FootballScorer({ match, onEvent, onComplete, disabled }) {
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
      <div className="card text-center">
        <p className="text-4xl font-bold font-mono text-white">{teamAScore} — {teamBScore}</p>
        <p className="text-dark-100/50 text-sm mt-1">{match.teamA?.name} vs {match.teamB?.name}</p>
      </div>

      <div>
        <p className="text-xs text-dark-100/50 mb-2 font-medium uppercase tracking-wider">Team</p>
        <div className="grid grid-cols-2 gap-3">
          {[{ id: match.teamA?._id, name: match.teamA?.name }, { id: match.teamB?._id, name: match.teamB?.name }].map(t => (
            <button key={t.id} onClick={() => setSelectedTeam(t.id)} disabled={disabled}
              className={`py-3 rounded-xl font-medium text-sm border-2 transition-all ${selectedTeam === t.id ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-600 text-white'}`}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Minute</label>
        <input type="number" className="input" min={1} max={120} value={minute} onChange={e => setMinute(Number(e.target.value))} disabled={disabled} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {EVENTS.map(({ type, label, className }) => (
          <button key={type} onClick={() => handleEvent(type)} disabled={disabled}
            className={`py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02] ${className}`}>
            {label}
          </button>
        ))}
      </div>

      <button onClick={onComplete} disabled={disabled} className="w-full btn-danger py-3 justify-center">🏁 Full Time</button>
    </div>
  );
}

// ─── Generic Scorer ──────────────────────────────────────────────────────────
function GenericScorer({ match, onEvent, onComplete, sport, disabled }) {
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
          <button key={t.id} onClick={() => setSelectedTeam(t.id)} disabled={disabled}
            className={`py-3 rounded-xl font-medium text-sm border-2 transition-all ${selectedTeam === t.id ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-600 text-white'}`}>
            {t.name}
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs text-dark-100/50 mb-2 font-medium uppercase tracking-wider">Event</p>
        <div className="grid grid-cols-2 gap-2">
          {config.events.map(ev => (
            <button key={ev.type} onClick={() => setSelectedEvent(ev)} disabled={disabled}
              className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${selectedEvent.type === ev.type ? 'border-primary-500 bg-primary-500/20 text-primary-400' : 'border-dark-600 text-white'}`}>
              {ev.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleScore} disabled={disabled} className="w-full btn-primary py-4 text-base font-bold justify-center">
        ✓ Add {config.unit}
      </button>

      <button onClick={onComplete} disabled={disabled} className="w-full btn-danger py-3 justify-center">🏁 End Match</button>
    </div>
  );
}

// ─── Player of Match Modal ───────────────────────────────────────────────────
function PlayerOfMatchModal({ match, onSelect, onClose }) {
  const [playerId, setPlayerId] = useState('');
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const teamIds = [match.teamA?._id, match.teamB?._id].filter(Boolean);
    Promise.all(teamIds.map(id => api.get(`/teams/${id}/players`)))
      .then(results => setPlayers(results.flatMap(r => r.data.data || [])))
      .catch(() => {});
  }, [match]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-dark-800 rounded-2xl p-6 w-full max-w-sm space-y-4 border border-dark-700">
        <div className="text-center">
          <TrophyIcon className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
          <h3 className="font-bold text-white text-lg">Player of the Match</h3>
        </div>
        <select className="input text-xs" value={playerId} onChange={e => setPlayerId(e.target.value)}>
          <option value="">Select player…</option>
          {players.map(p => <option key={p._id} value={p._id}>{p.name} ({p.role})</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={() => onSelect(playerId)} disabled={!playerId} className="btn-primary flex-1 py-2 text-xs">Confirm</button>
          <button onClick={onClose} className="btn-secondary flex-1 py-2 text-xs">Skip</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main LiveScoreConsole ───────────────────────────────────────────────────
export default function LiveScoreConsole() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuthStore();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPOM, setShowPOM] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [isTakingOver, setIsTakingOver] = useState(false);

  const loadMatch = useCallback(async () => {
    try {
      const res = await api.get(`/matches/${id}`);
      const m = res.data.data;
      setMatch(m);

      // Check if match is locked to another scorer within last 5 minutes
      const matchScorerId = m.scorerId?._id ? m.scorerId._id.toString() : m.scorerId ? m.scorerId.toString() : null;
      const currentUserId = user?._id?.toString();
      if (matchScorerId && currentUserId && matchScorerId !== currentUserId) {
        if (m.scorerLockedAt && (new Date() - new Date(m.scorerLockedAt) < 5 * 60 * 1000)) {
          setIsLockedByOther(true);
        } else {
          setIsLockedByOther(false);
        }
      } else {
        setIsLockedByOther(false);
      }
    } catch { toast.error('Failed to load match'); }
    finally { setLoading(false); }
  }, [id, user?._id]);

  useEffect(() => {
    loadMatch();
    socket?.emit('match:join', id);
    socket?.on('match:update', (data) => {
      setMatch(prev => prev ? { ...prev, scoreSummary: data.scoreSummary, innings: data.innings || prev.innings } : prev);
    });
    socket?.on('match:innings_switch', (data) => {
      setMatch(prev => prev ? { ...prev, innings: data.innings, currentInning: data.currentInning } : prev);
    });
    socket?.on('match:batsmen_updated', (data) => {
      setMatch(prev => prev ? { ...prev, currentBatsmen: data.currentBatsmen } : prev);
    });
    socket?.on('match:bowler_updated', (data) => {
      setMatch(prev => prev ? { ...prev, currentBowlerId: data.currentBowlerId } : prev);
    });
    socket?.on('match:takeover', (data) => {
      setMatch(prev => prev ? { ...prev, scorerId: data.scorerId, scorerLockedAt: data.scorerLockedAt } : prev);
      const incomingScorerId = data.scorerId?._id ? data.scorerId._id.toString() : data.scorerId?.toString();
      const myId = user?._id?.toString();
      if (incomingScorerId && myId && incomingScorerId !== myId) {
        setIsLockedByOther(true);
        toast('Another official has taken over scoring for this match.', { icon: 'ℹ️' });
      } else if (incomingScorerId && myId && incomingScorerId === myId) {
        setIsLockedByOther(false);
      }
    });
    return () => {
      socket?.emit('match:leave', id);
      socket?.off('match:update');
      socket?.off('match:innings_switch');
      socket?.off('match:batsmen_updated');
      socket?.off('match:bowler_updated');
      socket?.off('match:takeover');
    };
  }, [id, socket, loadMatch, user?._id]);

  const handleCricketBall = async (payload) => {
    try {
      const res = await api.post(`/scoring/${id}/cricket/ball`, payload);
      setMatch(prev => prev ? { ...prev, scoreSummary: res.data.data.scoreSummary, innings: res.data.data.innings } : prev);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.message?.includes('locked to another scorer')) {
        setIsLockedByOther(true);
      }
      toast.error(err.response?.data?.message || 'Failed to record ball');
    }
  };

  const handleSelectBatsman = async (strikerId, nonStrikerId) => {
    try {
      const res = await api.post(`/scoring/${id}/cricket/select-batsman`, { strikerId, nonStrikerId });
      setMatch(prev => prev ? { ...prev, currentBatsmen: res.data.data } : prev);
      toast.success('Batsmen updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update batsmen');
    }
  };

  const handleSelectBowler = async (bowlerId) => {
    try {
      const res = await api.post(`/scoring/${id}/cricket/select-bowler`, { bowlerId });
      setMatch(prev => prev ? { ...prev, currentBowlerId: res.data.data.currentBowlerId } : prev);
      toast.success('Bowler selected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to select bowler');
    }
  };

  const handleSwapStrike = async () => {
    try {
      const res = await api.post(`/scoring/${id}/cricket/swap-strike`);
      setMatch(prev => prev ? { ...prev, currentBatsmen: res.data.data } : prev);
      toast.success('Strike swapped');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to swap strike');
    }
  };

  const handleUndoBall = async () => {
    if (!window.confirm('Undo the last recorded ball?')) return;
    try {
      const res = await api.delete(`/scoring/${id}/cricket/last-ball`);
      setMatch(prev => prev ? { ...prev, scoreSummary: res.data.data.scoreSummary, innings: res.data.data.innings } : prev);
      toast.success('Last ball undone');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to undo ball');
    }
  };

  const handleTakeover = async () => {
    setIsTakingOver(true);
    try {
      await api.post(`/scoring/${id}/takeover`);
      setIsLockedByOther(false);
      toast.success('You have taken over the active scoring session');
      await loadMatch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to take over scoring');
    } finally {
      setIsTakingOver(false);
    }
  };

  const handleAbandon = async (reason) => {
    try {
      await api.post(`/scoring/${id}/abandon`, { reason });
      toast.success('Match marked as abandoned');
      navigate(`/match/${id}/summary`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to abandon match');
    }
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
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to record event'); }
  };

  const handleGenericEvent = async (payload) => {
    try {
      const res = await api.post(`/scoring/${id}/event`, payload);
      setMatch(prev => prev ? { ...prev, scoreSummary: res.data.data.scoreSummary } : prev);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to record event'); }
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
    <div className="flex items-center justify-center h-screen bg-dark-900">
      <div className="animate-spin w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!match) return (
    <div className="flex items-center justify-center h-screen bg-dark-900">
      <div className="text-center">
        <p className="text-dark-100/50">Match not found</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 p-4 max-w-2xl mx-auto">
      {/* Read-Only Lock Banner */}
      {isLockedByOther && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 text-yellow-300 text-xs">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>Scoring is locked to another official. This device is in Read-Only mode.</span>
          </div>
          <button
            onClick={handleTakeover}
            disabled={isTakingOver}
            className="btn-primary text-xs py-1.5 px-3.5 flex-shrink-0 font-bold shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
          >
            {isTakingOver ? (
              <>
                <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                <span>Taking Over...</span>
              </>
            ) : (
              <span>Take Over</span>
            )}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-dark-700/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate(getDashboardRoute(user?.role));
            }}
            className="btn-secondary p-2 rounded-xl text-dark-100/80 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Go Back"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="font-bold text-white text-lg">{match.teamA?.name} vs {match.teamB?.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="badge-live badge text-xs">● LIVE</span>
              <span className="text-xs text-dark-100/50 capitalize">{match.sport} • {match.type}</span>
              {match.groundId && <span className="text-xs text-dark-100/40">📍 {match.groundId?.name}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowScorecard(true)} className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1">
            <TableCellsIcon className="w-4 h-4" /> Scorecard
          </button>
          <button onClick={() => navigate(`/live/${id}`)} className="btn-ghost text-xs p-2">
            👁 View Mode
          </button>
        </div>
      </div>

      {/* Sport-specific scorer */}
      {match.sport === 'cricket' && (
        <CricketScorer
          match={match}
          onBall={handleCricketBall}
          onSwitchInnings={handleSwitchInnings}
          onComplete={handleComplete}
          onSelectBatsman={handleSelectBatsman}
          onSelectBowler={handleSelectBowler}
          onSwapStrike={handleSwapStrike}
          onUndoBall={handleUndoBall}
          onAbandon={handleAbandon}
          onOpenScorecard={() => setShowScorecard(true)}
          disabled={isLockedByOther}
        />
      )}
      {match.sport === 'football' && (
        <FootballScorer match={match} onEvent={handleFootballEvent} onComplete={handleComplete} disabled={isLockedByOther} />
      )}
      {!['cricket', 'football'].includes(match.sport) && (
        <GenericScorer match={match} onEvent={handleGenericEvent} onComplete={handleComplete} sport={match.sport} disabled={isLockedByOther} />
      )}

      {/* Player of Match modal */}
      {showPOM && (
        <PlayerOfMatchModal
          match={match}
          onSelect={handlePOM}
          onClose={() => { setShowPOM(false); handlePOM(null); }}
        />
      )}

      {/* Scorecard Modal */}
      {showScorecard && (
        <ScorecardModal matchId={id} onClose={() => setShowScorecard(false)} />
      )}
    </div>
  );
}
