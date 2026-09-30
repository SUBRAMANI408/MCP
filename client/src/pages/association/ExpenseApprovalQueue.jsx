import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/validators';

export default function ExpenseApprovalQueue() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.associationId) {
      loadExpenses();
    }
  }, [user]);

  const loadExpenses = () => {
    setLoading(true);
    // Fetch funds with query filter type=expense
    api.get(`/funds?associationId=${user.associationId}&type=expense`)
      .then(res => {
        setRequests(res.data.data);
      })
      .catch(() => toast.error('Failed to load expense request list'))
      .finally(() => setLoading(false));
  };

  const handleApprove = (id) => {
    if (window.confirm('Approve this expense request?')) {
      api.put(`/funds/expenses/${id}/approve`)
        .then(() => {
          toast.success('Expense request approved successfully');
          loadExpenses();
        })
        .catch(() => toast.error('Approval failed'));
    }
  };

  const handleReject = (id) => {
    if (window.confirm('Reject this expense request?')) {
      api.put(`/funds/expenses/${id}/reject`)
        .then(() => {
          toast.success('Expense request marked as rejected');
          loadExpenses();
        })
        .catch(() => toast.error('Rejection failed'));
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'completed'); // 'completed' is default for funds sometimes, but 'pending' is standard for requests. Let's list all and filter/sort.

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Expense Requests Approval</h1>
          <p className="text-dark-100/60 text-sm mt-1">Review and approve budget allocations, operational expenses, or tournament cash flows requested by officers</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No expense requests logged</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Requested By</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r._id}>
                    <td>
                      <div className="font-semibold text-white">{r.requestedBy?.name}</div>
                      <div className="text-[10px] text-dark-100/40">{r.requestedBy?.email}</div>
                    </td>
                    <td>{r.description}</td>
                    <td className="font-bold text-red-400">{formatCurrency(r.amount)}</td>
                    <td><span className="badge badge-info capitalize">{r.category?.replace('_', ' ')}</span></td>
                    <td>
                      <span className={`badge ${
                        r.status === 'approved' ? 'badge-success' :
                        r.status === 'pending' ? 'badge-pending' : 'badge-danger'
                      }`}>{r.status}</span>
                    </td>
                    <td className="text-right space-x-2">
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(r._id)} className="btn-success py-1 px-3 text-xs">
                            Approve
                          </button>
                          <button onClick={() => handleReject(r._id)} className="btn-danger py-1 px-3 text-xs">
                            Reject
                          </button>
                        </>
                      )}
                      {r.status !== 'pending' && (
                        <span className="text-xs text-dark-100/40">Action Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
