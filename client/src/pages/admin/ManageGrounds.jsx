import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function ManageGrounds() {
  const [grounds, setGrounds] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGround, setEditingGround] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [associationId, setAssociationId] = useState('');
  const [location, setLocation] = useState('');
  const [sportsSupported, setSportsSupported] = useState('');
  const [capacity, setCapacity] = useState(0);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    loadGrounds();
    loadAssociations();
  }, []);

  const loadGrounds = () => {
    setLoading(true);
    api.get('/grounds')
      .then(res => setGrounds(res.data.data))
      .catch(() => toast.error('Failed to load grounds list'))
      .finally(() => setLoading(false));
  };

  const loadAssociations = () => {
    adminApi.getAssociations({ limit: 100 })
      .then(res => setAssociations(res.data.data))
      .catch(() => {});
  };

  const handleOpenCreate = () => {
    setEditingGround(null);
    setName('');
    setAssociationId('');
    setLocation('');
    setSportsSupported('');
    setCapacity(0);
    setDescription('');
    setStatus('active');
    setShowModal(true);
  };

  const handleOpenEdit = (ground) => {
    setEditingGround(ground);
    setName(ground.name || '');
    setAssociationId(ground.associationId?._id || ground.associationId || '');
    setLocation(ground.location || '');
    setSportsSupported(ground.sportsSupported?.join(', ') || '');
    setCapacity(ground.capacity || 0);
    setDescription(ground.description || '');
    setStatus(ground.status || 'active');
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();

    const sportsList = sportsSupported.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      name,
      associationId,
      location,
      sportsSupported: sportsList,
      capacity,
      description,
      status
    };

    const request = editingGround
      ? api.put(`/grounds/${editingGround._id}`, payload)
      : api.post('/grounds', payload);

    request
      .then(() => {
        toast.success(editingGround ? 'Ground details updated' : 'Ground created');
        setShowModal(false);
        loadGrounds();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to save ground details'));
  };

  const handleToggleBooking = (id) => {
    api.patch(`/grounds/${id}/toggle-booking`)
      .then(() => {
        toast.success('Ground booking toggle status updated');
        loadGrounds();
      })
      .catch(() => toast.error('Failed to update booking status'));
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this ground record?')) {
      api.delete(`/grounds/${id}`)
        .then(() => {
          toast.success('Ground deleted successfully');
          loadGrounds();
        })
        .catch(() => toast.error('Delete action failed'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Ground Management</h1>
          <p className="text-dark-100/60 text-sm mt-1">Configure grounds, sports support, and booking configurations</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          Add Ground
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : grounds.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No grounds registered in the system</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ground Name</th>
                  <th>Association</th>
                  <th>Sports Supported</th>
                  <th>Capacity</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Booking Enabled</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {grounds.map(g => (
                  <tr key={g._id}>
                    <td>
                      <span className="font-semibold text-white">{g.name}</span>
                      {g.description && <div className="text-xs text-dark-100/40 truncate max-w-xs">{g.description}</div>}
                    </td>
                    <td>{g.associationId?.name || '-'}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {g.sportsSupported?.map((s, idx) => (
                          <span key={idx} className="badge badge-info text-[10px] py-0.5">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td>{g.capacity || 'N/A'}</td>
                    <td>{g.location || '-'}</td>
                    <td>
                      <span className={`badge ${g.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                        {g.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleBooking(g._id)}
                        className={`badge ${g.bookingEnabled ? 'badge-success' : 'badge-danger'}`}
                      >
                        {g.bookingEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="text-right space-x-2">
                      <button onClick={() => handleOpenEdit(g)} className="btn-ghost py-1 text-xs">Edit</button>
                      <button onClick={() => handleDelete(g._id)} className="btn-ghost py-1 text-xs text-red-500">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ground Create / Edit View (displayed inline instead of floating modal) */}
      {showModal && (
        <div className="card space-y-6 p-6 sm:p-8 md:p-10 border border-dark-600/50 shadow-2xl relative w-full mt-6">
          <div className="max-w-4xl">
            <h3 className="section-title text-2xl font-bold text-white border-b border-dark-700/50 pb-4 mb-6">{editingGround ? 'Edit Ground Details' : 'Add Ground Details'}</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="label">Ground Name</label>
                <input type="text" className="input" placeholder="e.g. Cricket Ground A" required value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Link Association</label>
                  <select className="input" required value={associationId} onChange={e => setAssociationId(e.target.value)}>
                    <option value="">Select Association</option>
                    {associations.map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input type="text" className="input" placeholder="e.g. Sector 5, Block B" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Capacity</label>
                  <input type="number" className="input" min="0" value={capacity} onChange={e => setCapacity(Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Sports Supported (comma separated)</label>
                <input type="text" className="input" placeholder="e.g. Cricket, Football" required value={sportsSupported} onChange={e => setSportsSupported(e.target.value)} />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px]" placeholder="Add pitch type, seating details, equipment info..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Ground Info</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
