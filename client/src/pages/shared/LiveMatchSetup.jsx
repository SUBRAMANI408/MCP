import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { TrophyIcon, PlayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const SPORTS = ['cricket', 'football', 'volleyball', 'basketball', 'kabaddi', 'badminton', 'hockey', 'table_tennis'];
const BALL_TYPES = ['leather', 'tennis', 'rubber'];

export default function LiveMatchSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = basic info, 2 = sport config, 3 = toss
  const [teams, setTeams] = useState([]);
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    sport: 'cricket',
    type: 'friendly',
    teamAId: '',
    teamBId: '',
    groundId: '',
    scheduledAt: new Date().toISOString().slice(0, 16),
    // Cricket
    totalOvers: 20,
    ballType: 'leather',
    numPlayers: 11,
    // Toss
    tossWinner: '',
    tossDecision: 'bat',
  });

  useEffect(() => {
    api.get('/teams').then(r => setTeams(r.data.data || [])).catch(() => {});
    api.get('/grounds').then(r => setGrounds(r.data.data || [])).catch(() => {});
  }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleNext = () => {
    if (step === 1) {
      if (!form.teamAId || !form.teamBId) return toast.error('Select both teams');
      if (form.teamAId === form.teamBId) return toast.error('Teams must be different');
    }
    if (step === 2 && form.sport === 'cricket' && !form.totalOvers) return toast.error('Set number of overs');
    setStep(s => s + 1);
  };

  const handleStart = async () => {
    if (form.sport === 'cricket' && !form.tossWinner) return toast.error('Select toss winner');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.fixtureId) payload.fixtureId = null;
      if (!payload.friendlyMatchId) payload.friendlyMatchId = null;
      payload.refId = null;

      const res = await api.post('/scoring/setup', payload);
      const match = res.data.data;
      // Start the match
      await api.post(`/matches/${match._id}/start`);
      toast.success('Match started! Opening live scorer…');
      navigate(`/score/${match._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to setup match');
    } finally {
      setLoading(false);
    }
  };

  const teamA = teams.find(t => t._id === form.teamAId);
  const teamB = teams.find(t => t._id === form.teamBId);

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="relative text-center mb-8">
          <button onClick={() => navigate(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 btn-secondary p-2.5 rounded-xl animate-fade-in" title="Go Back">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-sport-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PlayIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Start Live Match</h1>
          <p className="text-dark-100/50 text-sm mt-1">Set up your match before scoring begins</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= step ? 'bg-primary-500' : 'bg-dark-700'}`} />
          ))}
        </div>

        <div className="card space-y-5">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <h2 className="font-semibold text-white">Match Details</h2>
              <div>
                <label className="label">Sport</label>
                <select className="input" value={form.sport} onChange={e => set('sport', e.target.value)}>
                  {SPORTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Match Type</label>
                <div className="flex gap-3">
                  {['friendly', 'tournament'].map(t => (
                    <button key={t} onClick={() => set('type', t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${form.type === t ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-dark-600 text-dark-100/60 hover:border-dark-500'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Team A</label>
                  <select className="input" value={form.teamAId} onChange={e => set('teamAId', e.target.value)}>
                    <option value="">Select team…</option>
                    {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Team B</label>
                  <select className="input" value={form.teamBId} onChange={e => set('teamBId', e.target.value)}>
                    <option value="">Select team…</option>
                    {teams.filter(t => t._id !== form.teamAId).map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Ground (optional)</label>
                <select className="input" value={form.groundId} onChange={e => set('groundId', e.target.value)}>
                  <option value="">No ground selected</option>
                  {grounds.map(g => <option key={g._id} value={g._id}>{g.name} — {g.location}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Scheduled Date & Time</label>
                <input type="datetime-local" className="input" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} />
              </div>
            </>
          )}

          {/* Step 2: Sport Config */}
          {step === 2 && (
            <>
              <h2 className="font-semibold text-white">Sport Configuration — {form.sport}</h2>
              {form.sport === 'cricket' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label">Total Overs</label>
                      <input type="number" className="input" min={1} max={50} value={form.totalOvers}
                        onChange={e => set('totalOvers', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="label">Players per Side</label>
                      <input type="number" className="input" min={5} max={11} value={form.numPlayers}
                        onChange={e => set('numPlayers', Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="label">Ball Type</label>
                      <select className="input" value={form.ballType} onChange={e => set('ballType', e.target.value)}>
                        {BALL_TYPES.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
              {['football', 'hockey'].includes(form.sport) && (
                <p className="text-dark-100/60 text-sm">Standard {form.sport} scoring: goals, assists, cards, substitutions</p>
              )}
              {form.sport === 'volleyball' && (
                <p className="text-dark-100/60 text-sm">Best of 5 sets — first to 3 sets wins</p>
              )}
              {form.sport === 'basketball' && (
                <p className="text-dark-100/60 text-sm">4 quarters with points, fouls, and timeouts tracking</p>
              )}
              {form.sport === 'kabaddi' && (
                <p className="text-dark-100/60 text-sm">Raid points, bonus, all-out scoring with 2 halves</p>
              )}
              {['badminton', 'table_tennis'].includes(form.sport) && (
                <p className="text-dark-100/60 text-sm">Set-based scoring — best of 3 or 5 games</p>
              )}
            </>
          )}

          {/* Step 3: Toss (cricket only) or confirm */}
          {step === 3 && (
            <>
              {form.sport === 'cricket' ? (
                <>
                  <h2 className="font-semibold text-white">Toss</h2>
                  {teamA && teamB ? (
                    <>
                      <div>
                        <label className="label">Toss Won By</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[{ id: form.teamAId, name: teamA?.name }, { id: form.teamBId, name: teamB?.name }].map(t => (
                            <button key={t.id} onClick={() => set('tossWinner', t.id)}
                              className={`py-3 rounded-xl text-sm font-medium border transition-all ${form.tossWinner === t.id ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' : 'border-dark-600 text-dark-100/60 hover:border-dark-500'}`}>
                              <TrophyIcon className={`w-5 h-5 mx-auto mb-1 ${form.tossWinner === t.id ? 'text-yellow-400' : 'opacity-30'}`} />
                              {t.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      {form.tossWinner && (
                        <div>
                          <label className="label">Elected to</label>
                          <div className="flex gap-3">
                            {['bat', 'bowl'].map(d => (
                              <button key={d} onClick={() => set('tossDecision', d)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border capitalize transition-all ${form.tossDecision === d ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-dark-600 text-dark-100/60'}`}>
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-red-400 text-sm">Please go back and select teams first</p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <h2 className="font-semibold text-white mb-2">Ready to Start!</h2>
                  <p className="text-dark-100/50 text-sm">{teamA?.name} vs {teamB?.name}</p>
                  <p className="text-dark-100/50 text-sm capitalize">{form.sport} • {form.type}</p>
                </div>
              )}
            </>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">Back</button>
            )}
            {step < 3 ? (
              <button onClick={handleNext} className="btn-primary flex-1">Next →</button>
            ) : (
              <button onClick={handleStart} disabled={loading} className="btn-primary flex-1">
                <PlayIcon className="w-4 h-4" />
                {loading ? 'Starting…' : 'Start Match'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
