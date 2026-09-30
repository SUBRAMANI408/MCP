import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { fundApi } from '../../api/fundApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/validators';

export default function CollectIncome() {
  const { user } = useAuthStore();
  const [incomes, setIncomes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('membership_fee');
  const [description, setDescription] = useState('');
  const [issuedTo, setIssuedTo] = useState('');
  const [relatedTeamId, setRelatedTeamId] = useState('');

  useEffect(() => {
    if (user?.associationId) {
      loadIncomeData();
    }
  }, [user]);

  const loadIncomeData = () => {
    setLoading(true);
    Promise.all([
      fundApi.getFunds({ associationId: user.associationId, type: 'income', limit: 20 }).catch(() => ({ data: { data: [] } })),
      api.get(`/teams?associationId=${user.associationId}&status=approved`).catch(() => ({ data: { data: [] } }))
    ])
      .then(([incRes, teamsRes]) => {
        setIncomes(incRes.data.data || []);
        setTeams(teamsRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load income records'))
      .finally(() => setLoading(false));
  };

  const handleRecordIncome = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Specify a valid amount');
    if (!issuedTo.trim()) return toast.error('Specify payee name');

    setSaving(true);
    const payload = {
      associationId: user.associationId,
      category,
      amount: Number(amount),
      description,
      issuedTo,
      relatedTeamId: relatedTeamId || null
    };

    fundApi.collectIncome(payload)
      .then((res) => {
        toast.success('Income transaction logged successfully');
        // Clear forms
        setAmount('');
        setCategory('membership_fee');
        setDescription('');
        setIssuedTo('');
        setRelatedTeamId('');
        loadIncomeData();
        
        // Open receipt PDF link if available
        if (res.data.data?.receipt?.pdfUrl) {
          window.open(res.data.data.receipt.pdfUrl, '_blank');
        }
      })
      .catch(() => toast.error('Logging income entry failed'))
      .finally(() => setSaving(false));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Record Income Collected</h1>
          <p className="text-dark-100/60 text-sm mt-1">Audit sponsorships, membership fees, registrations, and download PDF receipts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Panel */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Record Income Transaction</h3>
          
          <form onSubmit={handleRecordIncome} className="space-y-4">
            <div>
              <label className="label">Amount (Rs.)</label>
              <input type="number" className="input" min="1" required value={amount} onChange={e => setAmount(e.target.value)} />
            </div>

            <div>
              <label className="label">Income Category</label>
              <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="membership_fee">Membership Fees</option>
                <option value="tournament_fee">Tournament Registration Fees</option>
                <option value="sponsorship">Sponsorship Funds</option>
                <option value="donation">Donations</option>
                <option value="other">Other Association Revenue</option>
              </select>
            </div>

            <div>
              <label className="label">Payee Name (Issued To)</label>
              <input type="text" className="input" placeholder="e.g. Captain Name, Sponsor Org" required value={issuedTo} onChange={e => setIssuedTo(e.target.value)} />
            </div>

            <div>
              <label className="label">Related Team (Optional)</label>
              <select className="input" value={relatedTeamId} onChange={e => setRelatedTeamId(e.target.value)}>
                <option value="">None / General</option>
                {teams.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Transaction Narrative</label>
              <textarea className="input min-h-[80px]" placeholder="Add description details..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
              {saving ? 'Recording Entry...' : 'Record Entry & Generate PDF'}
            </button>
          </form>
        </div>

        {/* History Panel */}
        <div className="card lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-white">Recent Income Collected</h3>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : incomes.length === 0 ? (
            <p className="text-xs text-dark-100/40 py-12 text-center">No income collections logged yet</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Payee</th>
                    <th>Volume Amount</th>
                    <th className="text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {incomes.map(inc => (
                    <tr key={inc._id}>
                      <td>{new Date(inc.createdAt).toLocaleDateString()}</td>
                      <td><span className="badge badge-info capitalize">{inc.category?.replace('_', ' ')}</span></td>
                      <td>{inc.description || 'N/A'}</td>
                      <td className="font-bold text-sport-500">{formatCurrency(inc.amount)}</td>
                      <td className="text-right">
                        {inc.receiptId?.pdfUrl ? (
                          <a href={inc.receiptId.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-primary-400 hover:underline">
                            Download PDF
                          </a>
                        ) : (
                          <span className="text-[10px] text-dark-100/40">No Receipt</span>
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
    </div>
  );
}
