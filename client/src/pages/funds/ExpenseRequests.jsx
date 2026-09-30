import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { fundApi } from '../../api/fundApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/validators';

export default function ExpenseRequests() {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('ground_maintenance');
  const [description, setDescription] = useState('');
  const [relatedTeamId, setRelatedTeamId] = useState('');

  useEffect(() => {
    if (user?.associationId) {
      loadExpenseRequests();
    }
  }, [user]);

  const loadExpenseRequests = () => {
    setLoading(true);
    Promise.all([
      fundApi.getFunds({ associationId: user.associationId, type: 'expense', limit: 20 }).catch(() => ({ data: { data: [] } })),
      api.get(`/teams?associationId=${user.associationId}&status=approved`).catch(() => ({ data: { data: [] } }))
    ])
      .then(([expRes, teamsRes]) => {
        setExpenses(expRes.data.data || []);
        setTeams(teamsRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load expense logs'))
      .finally(() => setLoading(false));
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Specify a valid amount');
    if (!description.trim()) return toast.error('Specify expense narrative');

    setSaving(true);
    const payload = {
      associationId: user.associationId,
      category,
      amount: Number(amount),
      description,
      relatedTeamId: relatedTeamId || null
    };

    fundApi.createExpenseRequest(payload)
      .then(() => {
        toast.success('Expense approval request dispatched to Head');
        setAmount('');
        setDescription('');
        setRelatedTeamId('');
        loadExpenseRequests();
      })
      .catch(() => toast.error('Request dispatch failed'))
      .finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Expense Requests</h1>
          <p className="text-dark-100/60 text-sm mt-1">Submit budget proposals to the Association Head and audit recent payouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Panel */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Create Expense Proposal</h3>
          <form onSubmit={handleSubmitRequest} className="space-y-4">
            <div>
              <label className="label">Proposed Payout Amount (Rs.)</label>
              <input type="number" className="input" min="1" required value={amount} onChange={e => setAmount(e.target.value)} />
            </div>

            <div>
              <label className="label">Expenditure Category</label>
              <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="ground_maintenance">Ground Maintenance</option>
                <option value="tournament_expenses">Tournament Expenses</option>
                <option value="equipment_purchase">Sports Equipment Purchase</option>
                <option value="equipment_repair">Equipment Repairs</option>
                <option value="refreshments">Match Refreshments</option>
                <option value="travel_expense">Team Travel Expenses</option>
                <option value="prize_distribution">Prizes & Trophies</option>
                <option value="office_expense">Office / Administrative Bills</option>
                <option value="other">Other Approved Expenditures</option>
              </select>
            </div>

            <div>
              <label className="label">Related Team Allocation (Optional)</label>
              <select className="input" value={relatedTeamId} onChange={e => setRelatedTeamId(e.target.value)}>
                <option value="">None / General</option>
                {teams.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Expense Purpose Details</label>
              <textarea className="input min-h-[100px]" placeholder="Explain why funds are needed..." required value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
              {saving ? 'Submitting Request...' : 'Dispatch Request to Head'}
            </button>
          </form>
        </div>

        {/* History tracking list */}
        <div className="card lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-white">Your Payout Proposals Logs</h3>
          
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-xs text-dark-100/40 py-12 text-center">No expenditure proposals logged</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Narrative Details</th>
                    <th>Sum Amount</th>
                    <th>Approval Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp._id}>
                      <td>{new Date(exp.createdAt).toLocaleDateString()}</td>
                      <td><span className="badge badge-info capitalize">{exp.category?.replace('_', ' ')}</span></td>
                      <td>
                        <div className="text-xs font-semibold text-white truncate max-w-[200px]">{exp.description}</div>
                        {exp.approvedBy && <div className="text-[10px] text-dark-100/40 mt-0.5">Reviewed by {exp.approvedBy?.name}</div>}
                      </td>
                      <td className="font-bold text-red-400">{formatCurrency(exp.amount)}</td>
                      <td>
                        <span className={`badge ${
                          exp.status === 'approved' ? 'badge-success' :
                          exp.status === 'pending' ? 'badge-pending' : 'badge-danger'
                        } capitalize`}>{exp.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
