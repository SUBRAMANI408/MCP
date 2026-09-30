import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function SendNotifications() {
  const [associations, setAssociations] = useState([]);
  const [target, setTarget] = useState('all'); // all, association, roles
  const [selectedAssociationIds, setSelectedAssociationIds] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [sending, setSending] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const rolesList = [
    { value: 'association_head', label: 'Association Heads' },
    { value: 'tournament_organizer', label: 'Tournament Organizers' },
    { value: 'ground_officer', label: 'Booking Officers' },
    { value: 'funds_officer', label: 'Funds Officers' },
    { value: 'captain', label: 'Team Captains' },
    { value: 'vice_captain', label: 'Team Vice Captains' },
    { value: 'player', label: 'Players' }
  ];

  useEffect(() => {
    loadAssociations();
    loadRecentSent();
  }, []);

  const loadAssociations = () => {
    adminApi.getAssociations({ limit: 100 })
      .then(res => setAssociations(res.data.data))
      .catch(() => {});
  };

  const loadRecentSent = () => {
    adminApi.getAuditLogs({ limit: 10, action: 'notification_sent' })
      .then(res => setRecentNotifications(res.data.data))
      .catch(() => {});
  };

  const handleRoleToggle = (role) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(x => x !== role) : [...prev, role]);
  };

  const handleAssociationToggle = (id) => {
    setSelectedAssociationIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error('Message content cannot be empty');

    const targetIds = target === 'association' ? selectedAssociationIds : target === 'roles' ? selectedRoles : [];
    if (target !== 'all' && targetIds.length === 0) {
      return toast.error('Please select at least one recipient association/role filter');
    }

    if (!window.confirm('Dispatch this notification broadcast?')) return;

    setSending(true);
    adminApi.sendNotification({
      target,
      targetIds,
      message,
      type
    })
      .then(res => {
        toast.success(`Notification broadcast dispatched to ${res.data.data.count} users successfully`);
        setMessage('');
        setSelectedAssociationIds([]);
        setSelectedRoles([]);
        loadRecentSent();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to dispatch notification broadcast'))
      .finally(() => setSending(false));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Send Notifications</h1>
          <p className="text-dark-100/60 text-sm mt-1">Broadcast targeted notification alerts, push alerts, or emails across the system</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Form */}
        <div className="card lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-white">Broadcast Composer</h3>
          <form onSubmit={handleSend} className="space-y-4">
            
            {/* Target Select */}
            <div>
              <label className="label">Select Target Audience</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-dark-100/80 cursor-pointer">
                  <input type="radio" name="target" checked={target === 'all'} onChange={() => setTarget('all')} />
                  <span>All Users</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-dark-100/80 cursor-pointer">
                  <input type="radio" name="target" checked={target === 'association'} onChange={() => setTarget('association')} />
                  <span>Target Associations</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-dark-100/80 cursor-pointer">
                  <input type="radio" name="target" checked={target === 'roles'} onChange={() => setTarget('roles')} />
                  <span>Target Roles</span>
                </label>
              </div>
            </div>

            {/* Target association checkbox select */}
            {target === 'association' && (
              <div className="space-y-2 border border-dark-700/50 rounded-xl p-3 bg-dark-900">
                <label className="text-xs text-dark-100/50 block mb-1">Audience Associations</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {associations.map(a => (
                    <label key={a._id} className="flex items-center gap-2 text-xs text-dark-100/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAssociationIds.includes(a._id)}
                        onChange={() => handleAssociationToggle(a._id)}
                      />
                      <span>{a.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Target roles checkbox select */}
            {target === 'roles' && (
              <div className="space-y-2 border border-dark-700/50 rounded-xl p-3 bg-dark-900">
                <label className="text-xs text-dark-100/50 block mb-1">Audience Roles</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {rolesList.map(r => (
                    <label key={r.value} className="flex items-center gap-2 text-xs text-dark-100/70 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(r.value)}
                        onChange={() => handleRoleToggle(r.value)}
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Alert Category</label>
                <select className="input" value={type} onChange={e => setType(e.target.value)}>
                  <option value="general">General Notification</option>
                  <option value="announcement">Announcement Notice</option>
                  <option value="match_started">Live Score Alert</option>
                  <option value="friendly_request">Match System Notification</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Notification Message</label>
              <textarea
                className="input min-h-[120px]"
                placeholder="Compose a broadcast message here..."
                required
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            <button type="submit" disabled={sending} className="btn-primary w-full justify-center">
              {sending ? 'Dispatching Broadcast...' : 'Dispatch Broadcast'}
            </button>
          </form>
        </div>

        {/* History Log */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Broadcast History</h3>
          {recentNotifications.length === 0 ? (
            <p className="text-xs text-dark-100/40 py-6 text-center">No recent broadcasts recorded</p>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
              {recentNotifications.map(n => (
                <div key={n._id} className="card-sm bg-dark-900 space-y-2 border border-dark-700/30">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="badge badge-info">{n.details?.target || 'all'}</span>
                    <span className="text-dark-100/40">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-dark-50 line-clamp-2">{n.details?.message}</p>
                  <div className="text-[10px] text-dark-100/40 flex justify-between">
                    <span>Broadcast Sent</span>
                    <span className="font-semibold text-white">{n.details?.count || 0} users</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
