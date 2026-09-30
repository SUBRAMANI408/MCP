import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('medium');
  const [type, setType] = useState('general');
  const [associationId, setAssociationId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => {
    loadAnnouncements();
    loadAssociations();
  }, []);

  const loadAnnouncements = () => {
    setLoading(true);
    api.get('/announcements')
      .then(res => setAnnouncements(res.data.data))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  };

  const loadAssociations = () => {
    adminApi.getAssociations({ limit: 100 })
      .then(res => setAssociations(res.data.data))
      .catch(() => {});
  };

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setTitle('');
    setBody('');
    setPriority('medium');
    setType('general');
    setAssociationId('');
    setScheduledAt('');
    setShowModal(true);
  };

  const handleOpenEdit = (ann) => {
    setEditingAnnouncement(ann);
    setTitle(ann.title || '');
    setBody(ann.body || '');
    setPriority(ann.priority || 'medium');
    setType(ann.type || 'general');
    setAssociationId(ann.associationId?._id || ann.associationId || '');
    setScheduledAt(ann.scheduledAt ? new Date(ann.scheduledAt).toISOString().split('T')[0] : '');
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();

    const payload = {
      title,
      body,
      priority,
      type,
      associationId: associationId || null,
      scheduledAt: scheduledAt || null
    };

    const request = editingAnnouncement
      ? api.put(`/announcements/${editingAnnouncement._id}`, payload)
      : api.post('/announcements', payload);

    request
      .then(() => {
        toast.success(editingAnnouncement ? 'Announcement updated' : 'Announcement published');
        setShowModal(false);
        loadAnnouncements();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to save announcement'));
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this announcement?')) {
      api.delete(`/announcements/${id}`)
        .then(() => {
          toast.success('Announcement deleted');
          loadAnnouncements();
        })
        .catch(() => toast.error('Delete action failed'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Announcements</h1>
          <p className="text-dark-100/60 text-sm mt-1">Publish bulletins, global alerts, system maintenance, or holiday events</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary">
          Publish Announcement
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No announcements published</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Scope / Association</th>
                  <th>Posted By</th>
                  <th>Post Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map(a => (
                  <tr key={a._id}>
                    <td>
                      <span className="font-semibold text-white">{a.title}</span>
                      <div className="text-xs text-dark-100/40 truncate max-w-xs">{a.body}</div>
                    </td>
                    <td><span className="badge badge-info">{a.type || 'general'}</span></td>
                    <td>
                      <span className={`badge ${
                        a.priority === 'high' ? 'badge-danger' :
                        a.priority === 'medium' ? 'badge-pending' : 'badge-success'
                      }`}>{a.priority}</span>
                    </td>
                    <td>{a.associationId?.name || 'Global (All)'}</td>
                    <td>{a.postedBy?.name || 'Admin'}</td>
                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="text-right space-x-2">
                      <button onClick={() => handleOpenEdit(a)} className="btn-ghost py-1 text-xs">Edit</button>
                      <button onClick={() => handleDelete(a._id)} className="btn-ghost py-1 text-xs text-red-500">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Announcement View (displayed inline instead of floating modal) */}
      {showModal && (
        <div className="card space-y-6 p-6 sm:p-8 md:p-10 border border-dark-600/50 shadow-2xl relative w-full mt-6">
          <div className="max-w-4xl">
            <h3 className="section-title text-2xl font-bold text-white border-b border-dark-700/50 pb-4 mb-6">{editingAnnouncement ? 'Edit Announcement' : 'Publish Announcement'}</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="label">Title</label>
                <input type="text" className="input" placeholder="e.g. System Upgrade Underway" required value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={type} onChange={e => setType(e.target.value)}>
                    <option value="general">General Bulletin</option>
                    <option value="maintenance">System Maintenance</option>
                    <option value="holiday">Holiday Notice</option>
                    <option value="sports_event">Sports Event Alert</option>
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Target Scope</label>
                  <select className="input" value={associationId} onChange={e => setAssociationId(e.target.value)}>
                    <option value="">Global (All Associations)</option>
                    {associations.map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Schedule Date (Optional)</label>
                  <input type="date" className="input" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Content Body</label>
                <textarea className="input min-h-[120px]" placeholder="Add announcements content details here..." required value={body} onChange={e => setBody(e.target.value)} />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
