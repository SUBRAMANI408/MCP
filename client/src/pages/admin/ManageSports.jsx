import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const PREDEFINED_SPORTS = [
  { name: 'Football', icon: '⚽' },
  { name: 'Basketball', icon: '🏀' },
  { name: 'Cricket', icon: '🏏' },
  { name: 'Tennis', icon: '🎾' },
  { name: 'Volleyball', icon: '🏐' },
  { name: 'Baseball', icon: '⚾' },
  { name: 'Rugby', icon: '🏉' },
  { name: 'Hockey', icon: '🏑' },
  { name: 'Table Tennis', icon: '🏓' },
  { name: 'Badminton', icon: '🏸' },
  { name: 'Golf', icon: '⛳' },
  { name: 'Swimming', icon: '🏊' },
  { name: 'Athletics', icon: '🏃' },
  { name: 'Boxing', icon: '🥊' },
  { name: 'Cycling', icon: '🚴' },
];

export default function ManageSports() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSport, setEditingSport] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState([]);
  const [rules, setRules] = useState('');

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    
    // Auto-fill icon if sport matches predefined list
    const matchedSport = PREDEFINED_SPORTS.find(s => s.name.toLowerCase() === newName.toLowerCase());
    if (matchedSport && (!icon || editingSport === null)) {
      setIcon(matchedSport.icon);
    }
  };

  useEffect(() => {
    loadSports();
  }, []);

  const loadSports = () => {
    setLoading(true);
    api.get('/sports')
      .then(res => setSports(res.data.data))
      .catch(() => toast.error('Failed to load sports list'))
      .finally(() => setLoading(false));
  };

  const handleOpenCreate = () => {
    setEditingSport(null);
    setName('');
    setIcon('');
    setIsActive(true);
    setFields([]);
    setRules('');
    setShowModal(true);
  };

  const handleOpenEdit = (sport) => {
    setEditingSport(sport);
    setName(sport.name || '');
    setIcon(sport.icon || '');
    setIsActive(sport.isActive !== undefined ? sport.isActive : true);
    setFields(sport.scoringSchema?.fields || []);
    setRules(sport.scoringSchema?.rules || '');
    setShowModal(true);
  };

  const addField = () => {
    setFields([...fields, { key: '', label: '', type: 'number', options: '', required: false }]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, idx) => idx !== index));
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const handleSave = (e) => {
    e.preventDefault();

    // Map options back to array
    const cleanFields = fields.map(f => ({
      ...f,
      options: typeof f.options === 'string' ? f.options.split(',').map(x => x.trim()).filter(Boolean) : f.options
    }));

    const payload = {
      name,
      icon,
      isActive,
      scoringSchema: {
        fields: cleanFields,
        rules
      }
    };

    const request = editingSport
      ? api.put(`/sports/${editingSport._id}`, payload)
      : api.post('/sports', payload);

    request
      .then(() => {
        toast.success(editingSport ? 'Sport updated' : 'Sport created');
        setShowModal(false);
        loadSports();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to save sport'));
  };

  const handleToggle = (id) => {
    api.patch(`/sports/${id}/toggle`)
      .then(() => {
        toast.success('Sport toggle status updated');
        loadSports();
      })
      .catch(() => toast.error('Failed to update status'));
  };

  const handleDelete = (id, hard = false) => {
    if (window.confirm(hard ? 'Permanently delete this sport?' : 'Deactivate this sport?')) {
      const request = hard ? api.delete(`/sports/${id}/hard`) : api.delete(`/sports/${id}`);
      request
        .then(() => {
          toast.success(hard ? 'Sport permanently deleted' : 'Sport deactivated');
          loadSports();
        })
        .catch(() => toast.error('Deactivation action failed'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Sports Master List</h1>
          <p className="text-dark-100/60 text-sm mt-1">Configure sports details and custom match scoring schemas</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          Add Sport
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : sports.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No sports registered in the system</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Sport Name</th>
                  <th>Icon</th>
                  <th>Scoring fields</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sports.map(s => (
                  <tr key={s._id}>
                    <td><span className="font-semibold text-white">{s.name}</span></td>
                    <td><span className="text-xl">{s.icon || '🏆'}</span></td>
                    <td>{s.scoringSchema?.fields?.length || 0} fields configured</td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right space-x-2">
                      <button onClick={() => handleOpenEdit(s)} className="btn-ghost py-1 text-xs">Edit</button>
                      <button onClick={() => handleToggle(s._id)} className="btn-ghost py-1 text-xs text-yellow-500">
                        {s.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => handleDelete(s._id, false)} className="btn-ghost py-1 text-xs text-orange-500">Deactivate</button>
                      <button onClick={() => handleDelete(s._id, true)} className="btn-ghost py-1 text-xs text-red-500">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sport configuration edit view (displayed inline instead of floating modal) */}
      {showModal && (
        <div className="card space-y-6 p-6 sm:p-8 md:p-10 border border-dark-600/50 shadow-2xl relative w-full mt-6">
          <div className="max-w-4xl">
            <h3 className="section-title text-2xl font-bold text-white border-b border-dark-700/50 pb-4 mb-6">{editingSport ? 'Edit Sport Configuration' : 'Add Sport Configuration'}</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Sport Name</label>
                  <input type="text" className="input" placeholder="e.g. Football" required value={name} onChange={handleNameChange} list="sports-list" />
                  <datalist id="sports-list">
                    {PREDEFINED_SPORTS.map(s => (
                      <option key={s.name} value={s.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="label">Icon (Emoji/Text)</label>
                  <input type="text" className="input" placeholder="e.g. ⚽" value={icon} onChange={e => setIcon(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sportActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                />
                <label htmlFor="sportActive" className="text-sm font-medium text-dark-100/70">Sport is Active and enabled for tournament creation</label>
              </div>

              {/* Scoring schema builder */}
              <div className="space-y-3 border-t border-dark-700/50 pt-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Custom Scoring Fields</h4>
                  <button type="button" onClick={addField} className="btn-secondary py-1.5 text-xs">Add Field</button>
                </div>

                <div className="space-y-3">
                  {fields.map((f, idx) => (
                    <div key={idx} className="card-sm bg-dark-900 border border-dark-700/50 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-primary-400">Field #{idx + 1}</span>
                        <button type="button" onClick={() => removeField(idx)} className="text-xs text-red-500 hover:underline">Remove</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-dark-100/50 block mb-1">Field Key (JSON Key)</label>
                          <input type="text" className="input py-1.5 text-xs" required placeholder="e.g. goals" value={f.key} onChange={e => updateField(idx, 'key', e.target.value)} />
                        </div>
                        <div>
                          <label className="text-xs text-dark-100/50 block mb-1">User Label</label>
                          <input type="text" className="input py-1.5 text-xs" required placeholder="e.g. Total Goals" value={f.label} onChange={e => updateField(idx, 'label', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-3">
                          <label className="text-xs text-dark-100/50 block mb-2">Field Type</label>
                          <div className="flex gap-4">
                            {[
                              { value: 'number', label: 'Number' },
                              { value: 'text', label: 'Text' },
                              { value: 'boolean', label: 'Boolean (Toggle)' }
                            ].map(opt => (
                              <label key={opt.value} className="flex items-center gap-2 text-xs text-white cursor-pointer">
                                <input
                                  type="radio"
                                  name={`fieldType-${idx}`}
                                  value={opt.value}
                                  checked={f.type === opt.value}
                                  onChange={() => updateField(idx, 'type', opt.value)}
                                  className="text-primary-500 focus:ring-primary-500 bg-dark-800 border-dark-600"
                                />
                                {opt.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id={`required-${idx}`}
                          checked={f.required}
                          onChange={e => updateField(idx, 'required', e.target.checked)}
                        />
                        <label htmlFor={`required-${idx}`} className="text-xs text-dark-100/60">Scorers must fill this field</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Scoring Logic / Guidelines</label>
                <textarea className="input min-h-[80px]" placeholder="Explain scoring calculation rules for referee guidelines..." value={rules} onChange={e => setRules(e.target.value)} />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Sport Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
