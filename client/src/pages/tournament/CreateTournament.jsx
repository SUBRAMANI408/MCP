import React, { useState, useEffect } from 'react';
import { tournamentApi } from '../../api/tournamentApi';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import FileUpload from '../../components/common/FileUpload';

export default function CreateTournament() {
  const navigate = useNavigate();
  const [sports, setSports] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [associationId, setAssociationId] = useState('');
  const [format, setFormat] = useState('round_robin');
  const [maxTeams, setMaxTeams] = useState('16');
  const [registrationFee, setRegistrationFee] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [prizeDetails, setPrizeDetails] = useState('');
  const [banner, setBanner] = useState('');

  useEffect(() => {
    // Fetch sports and associations
    Promise.all([
      api.get('/sports/active').catch(() => ({ data: { data: [] } })),
      api.get('/associations').catch(() => ({ data: { data: [] } }))
    ])
      .then(([sportsRes, assocRes]) => {
        setSports(sportsRes.data.data || []);
        setAssociations(assocRes.data.data || []);
        if (assocRes.data.data?.length > 0) setAssociationId(assocRes.data.data[0]._id);
      })
      .catch(() => {});
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!sport) return toast.error('Please choose a sport category');

    setLoading(true);
    const payload = {
      name,
      sport,
      associationId,
      format,
      maxTeams: Number(maxTeams),
      registrationFee: Number(registrationFee),
      startDate,
      endDate,
      registrationDeadline,
      description,
      rules,
      prizeDetails,
      banner,
    };

    tournamentApi.createTournament(payload)
      .then(() => {
        toast.success('Tournament drafted successfully');
        navigate('/tournament/dashboard');
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to create tournament'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/tournament/dashboard')} className="btn-secondary p-2 rounded-xl text-dark-100/80 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold" title="Go Back">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="section-title gradient-text">Create Tournament</h1>
            <p className="text-dark-100/60 text-sm mt-1">Configure registrations, match formatting brackets, and timelines</p>
          </div>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Tournament Title</label>
              <input type="text" className="input" placeholder="e.g. Summer Championship 2026" required value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div>
              <label className="label">Link Association</label>
              <select className="input" required value={associationId} onChange={e => setAssociationId(e.target.value)}>
                {associations.map(a => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Sport Category</label>
              <select className="input" required value={sport} onChange={e => setSport(e.target.value)}>
                <option value="">Select Sport</option>
                {sports.map(s => (
                  <option key={s._id} value={s.name.toLowerCase()}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tournament Format</label>
              <select className="input" value={format} onChange={e => setFormat(e.target.value)}>
                <option value="round_robin">Round Robin / League</option>
                <option value="knockout">Single Elimination (Knockout)</option>
              </select>
            </div>

            <div>
              <label className="label">Max Roster Teams Limit</label>
              <input type="number" className="input" min="2" max="64" required value={maxTeams} onChange={e => setMaxTeams(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Start Schedule Date</label>
              <input type="date" className="input" required value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            <div>
              <label className="label">End Schedule Date</label>
              <input type="date" className="input" required value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            <div>
              <label className="label">Registration Deadline</label>
              <input type="date" className="input" required value={registrationDeadline} onChange={e => setRegistrationDeadline(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Registration Entry Fee (Rs.)</label>
            <input type="number" className="input" min="0" required value={registrationFee} onChange={e => setRegistrationFee(e.target.value)} />
          </div>

          <div>
            <label className="label">Tournament Banner / Poster Image</label>
            <FileUpload
              type="image"
              value={banner}
              onChange={setBanner}
              label="Upload Tournament Banner"
              folder="tournaments"
            />
          </div>

          <div>
            <label className="label">Description / Guidelines</label>
            <textarea className="input min-h-[80px]" placeholder="Brief narrative detailing rules or registration guidelines..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Special Rules / Match Specs</label>
              <textarea className="input min-h-[100px]" placeholder="Standard rules, overtime policy, etc..." value={rules} onChange={e => setRules(e.target.value)} />
            </div>
            <div>
              <label className="label">Prize Details / Ranks Pool</label>
              <textarea className="input min-h-[100px]" placeholder="Explain prize pool splits..." value={prizeDetails} onChange={e => setPrizeDetails(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
            <button type="button" onClick={() => navigate('/tournament/dashboard')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Drafting Tournament...' : 'Save & Draft Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
