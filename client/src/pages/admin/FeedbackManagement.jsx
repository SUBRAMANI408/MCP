import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadFeedback();
  }, [page, statusFilter]);

  const loadFeedback = () => {
    setLoading(true);
    adminApi.getFeedback({
      page,
      limit: 10,
      status: statusFilter
    })
      .then(res => {
        setFeedbacks(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
      })
      .catch(() => toast.error('Failed to load user feedback logs'))
      .finally(() => setLoading(false));
  };

  const handleOpenReply = (item) => {
    setSelectedFeedback(item);
    setReplyText(item.adminReply || '');
    setShowReplyModal(true);
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return toast.error('Reply content cannot be empty');

    adminApi.replyToFeedback(selectedFeedback._id, { adminReply: replyText })
      .then(() => {
        toast.success('Response submitted successfully');
        setShowReplyModal(false);
        loadFeedback();
      })
      .catch(() => toast.error('Failed to submit response'));
  };

  const handleResolve = (id) => {
    if (window.confirm('Mark this feedback thread as resolved?')) {
      adminApi.resolveFeedback(id)
        .then(() => {
          toast.success('Feedback marked as resolved');
          loadFeedback();
        })
        .catch(() => toast.error('Action failed'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">User Feedback</h1>
          <p className="text-dark-100/60 text-sm mt-1">Review user feedback submissions, issue tickets, and dispatch replies</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card flex items-center justify-between py-4">
        <div className="flex gap-2">
          {['', 'pending', 'in_progress', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${
                statusFilter === status ? 'bg-primary-600 text-white' : 'bg-dark-900 text-dark-100/60 hover:bg-dark-700/50'
              }`}
            >
              {status === '' ? 'All Tickets' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Feedbacks list */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : feedbacks.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No feedback submissions found</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Subject</th>
                  <th>Message Preview</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map(f => (
                  <tr key={f._id}>
                    <td>
                      <div className="font-semibold text-white">{f.userId?.name}</div>
                      <div className="text-[10px] text-dark-100/40 capitalize">{f.userId?.role?.replace('_', ' ')}</div>
                    </td>
                    <td><span className="font-medium text-white">{f.subject}</span></td>
                    <td className="max-w-xs truncate text-xs text-dark-100/70">{f.message}</td>
                    <td>
                      <span className={`badge ${
                        f.status === 'resolved' ? 'badge-success' :
                        f.status === 'in_progress' ? 'badge-info' : 'badge-pending'
                      }`}>{f.status?.replace('_', ' ')}</span>
                    </td>
                    <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td className="text-right space-x-2">
                      <button onClick={() => handleOpenReply(f)} className="btn-ghost py-1 text-xs">
                        {f.adminReply ? 'Edit Reply' : 'Reply'}
                      </button>
                      {f.status !== 'resolved' && (
                        <button onClick={() => handleResolve(f._id)} className="btn-ghost py-1 text-xs text-green-500">
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(prev => prev - 1)}
              className="btn-secondary py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-dark-100/60">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(prev => prev + 1)}
              className="btn-secondary py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-lg space-y-4">
            <h3 className="section-title text-white">Feedback Ticket Response</h3>
            <div className="bg-dark-900 p-3 rounded-xl border border-dark-700/30 text-xs space-y-2">
              <div>
                <span className="text-dark-100/50 block">Subject:</span>
                <span className="font-semibold text-white">{selectedFeedback?.subject}</span>
              </div>
              <div>
                <span className="text-dark-100/50 block">Original Message:</span>
                <p className="text-white whitespace-pre-wrap">{selectedFeedback?.message}</p>
              </div>
            </div>
            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="label">Admin Reply Response</label>
                <textarea
                  className="input min-h-[120px]"
                  placeholder="Type your reply to the user here..."
                  required
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setShowReplyModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit Reply</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
