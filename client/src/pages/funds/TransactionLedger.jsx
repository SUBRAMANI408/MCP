import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { fundApi } from '../../api/fundApi';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/validators';

export default function TransactionLedger() {
  const { user } = useAuthStore();
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (user?.associationId) {
      loadLedger();
    }
  }, [user, type, category, status]);

  const loadLedger = () => {
    setLoading(true);
    const params = {
      associationId: user.associationId,
      limit: 100
    };
    if (type) params.type = type;
    if (category) params.category = category;
    if (status) params.status = status;

    fundApi.getFunds(params)
      .then(res => setLedger(res.data.data || []))
      .catch(() => toast.error('Failed to load transaction ledger'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Transaction Ledger</h1>
          <p className="text-dark-100/60 text-sm mt-1">Advanced search, category filters, and receipt downloads for complete transparency</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="card grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Flow Type</label>
          <select className="input" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All Transactions</option>
            <option value="income">Income Collections</option>
            <option value="expense">Expense Payouts</option>
          </select>
        </div>

        <div>
          <label className="label">Category</label>
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="membership_fee">Membership Fees</option>
            <option value="tournament_fee">Tournament Fees</option>
            <option value="sponsorship">Sponsorships</option>
            <option value="donation">Donations</option>
            <option value="ground_maintenance">Ground Maintenance</option>
            <option value="tournament_expenses">Tournament Expenses</option>
            <option value="equipment_purchase">Equipment Purchases</option>
            <option value="refreshments">Match Refreshments</option>
          </select>
        </div>

        <div>
          <label className="label">Approval Status</label>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : ledger.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No transaction logs match current filters</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Narrative Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-right">Receipt File</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map(row => (
                  <tr key={row._id}>
                    <td className="font-mono text-[10px] text-dark-100/40">{row._id}</td>
                    <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${row.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                        {row.type}
                      </span>
                    </td>
                    <td><span className="font-semibold text-white capitalize">{row.category?.replace('_', ' ')}</span></td>
                    <td><span className="text-xs text-dark-100/70">{row.description}</span></td>
                    <td className={`font-bold ${row.type === 'income' ? 'text-sport-500' : 'text-red-400'}`}>
                      {formatCurrency(row.amount)}
                    </td>
                    <td>
                      <span className={`badge ${
                        row.status === 'completed' || row.status === 'approved' ? 'badge-success' :
                        row.status === 'pending' ? 'badge-pending' : 'badge-danger'
                      } capitalize`}>{row.status}</span>
                    </td>
                    <td className="text-right">
                      {row.receiptId?.pdfUrl ? (
                        <a href={row.receiptId.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-400 hover:underline">
                          View Receipt
                        </a>
                      ) : (
                        <span className="text-[10px] text-dark-100/40">N/A</span>
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
