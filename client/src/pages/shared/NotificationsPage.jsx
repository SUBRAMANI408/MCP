import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { BellIcon, CheckIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    setLoading(true);
    api.get('/notifications', { params: { limit: 50 } })
      .then(res => setNotifications(res.data.data || []))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  };

  const markRead = (id) => {
    api.put(`/notifications/${id}/read`)
      .then(() => setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n)))
      .catch(() => {});
  };

  const markAllRead = () => {
    api.put('/notifications/read-all')
      .then(() => { setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); toast.success('All notifications marked as read'); })
      .catch(() => {});
  };

  const typeColors = {
    general: 'bg-blue-500',
    team_invite: 'bg-green-500',
    tournament_approved: 'bg-purple-500',
    tournament_rejected: 'bg-red-500',
    match_update: 'bg-orange-500',
    booking_update: 'bg-yellow-500',
    expense_approved: 'bg-emerald-500',
    expense_rejected: 'bg-red-500',
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary p-2.5 rounded-xl" title="Go Back">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="section-title gradient-text flex items-center gap-2">
              <BellIcon className="w-6 h-6" />
              Notifications
              {unreadCount > 0 && (
                <span className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-dark-100/60 text-sm mt-1">Stay up to date with all your activities</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm gap-2">
            <CheckIcon className="w-4 h-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-dark-800 rounded-xl p-1 w-fit">
        {[
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read', label: 'Read' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === tab.key ? 'bg-primary-600 text-white' : 'text-dark-100/60 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <BellIcon className="w-12 h-12 text-dark-100/20 mx-auto mb-3" />
            <p className="text-dark-100/50">No notifications to show</p>
          </div>
        ) : (
          filtered.map(n => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`card cursor-pointer flex items-start gap-4 transition-all hover:border-dark-600/50 ${
                !n.isRead ? 'border-primary-500/20 bg-primary-500/5' : 'opacity-70'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                !n.isRead ? 'bg-primary-400' : 'bg-dark-600'
              }`} />
              <div className="flex-1">
                <p className="text-sm text-white">{n.message}</p>
                
                {/* Invitation Action Buttons */}
                {n.type === 'team_invite' && n.refId && (
                  <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={async () => {
                        try {
                          const res = await api.put(`/teams/invitations/${n.refId}/accept`);
                          toast.success('Invitation accepted!');
                          markRead(n._id);
                          
                          // Refresh current user cache with new teamId and role details
                          const userRes = await api.get('/auth/me');
                          useAuthStore.getState().updateUser(userRes.data.data);
                          
                          loadNotifications();
                          setTimeout(() => window.location.reload(), 1000);
                        } catch (err) {
                          console.error(err);
                          toast.error('Failed to accept invitation');
                        }
                      }}
                      className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold"
                    >
                      Accept
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await api.put(`/teams/invitations/${n.refId}/reject`);
                          toast.success('Invitation rejected');
                          markRead(n._id);
                          loadNotifications();
                        } catch {
                          toast.error('Failed to reject invitation');
                        }
                      }}
                      className="px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeColors[n.type] || 'bg-gray-500'}`} />
                  <span className="text-xs text-dark-100/40 capitalize">{n.type?.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-dark-100/30">•</span>
                  <span className="text-xs text-dark-100/40">{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
              {!n.isRead && (
                <button
                  onClick={e => { e.stopPropagation(); markRead(n._id); }}
                  className="btn-ghost p-1 text-xs text-primary-400"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
