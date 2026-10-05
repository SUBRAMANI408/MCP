import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { fundApi } from '../../api/fundApi';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/validators';
import FileUpload from '../../components/common/FileUpload';
import {
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CreditCardIcon,
  PaperClipIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export default function ExpenseRequests() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'payments'
  const [expenses, setExpenses] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('ground_maintenance');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Modals
  const [rejectModalExpense, setRejectModalExpense] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [payModalExpense, setPayModalExpense] = useState(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Payment history states
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const isHeadOrAdmin = user?.role === 'association_head' || user?.role === 'admin';
  const isFundsOfficerOrAdmin = user?.role === 'funds_officer' || user?.role === 'admin';

  useEffect(() => {
    loadExpenseRequests();
  }, [statusFilter]);

  const loadExpenseRequests = () => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    fundApi.getExpenses(params)
      .then(res => setExpenses(res.data.data || []))
      .catch(() => toast.error('Failed to load expense requests'))
      .finally(() => setLoading(false));
  };

  const loadPaymentHistory = () => {
    setLoadingPayments(true);
    fundApi.getPaymentHistory()
      .then(res => setPayments(res.data.data || []))
      .catch(() => toast.error('Failed to load payment history'))
      .finally(() => setLoadingPayments(false));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'payments') {
      loadPaymentHistory();
    } else {
      loadExpenseRequests();
    }
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Specify a valid amount');
    if (!purpose.trim()) return toast.error('Specify purpose of expenditure');

    setSaving(true);
    const payload = {
      purpose: purpose.trim(),
      category,
      amount: Number(amount),
      notes: notes.trim(),
      attachments: attachmentUrl ? [attachmentUrl] : [],
    };

    fundApi.createExpense(payload)
      .then(() => {
        toast.success('Expense proposal submitted successfully');
        setAmount('');
        setPurpose('');
        setNotes('');
        setAttachmentUrl('');
        loadExpenseRequests();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Submission failed'))
      .finally(() => setSaving(false));
  };

  const handleReview = (id, status, reason = '') => {
    fundApi.reviewExpense(id, { status, rejectionReason: reason })
      .then(() => {
        toast.success(`Expense request ${status}`);
        setRejectModalExpense(null);
        setRejectionReason('');
        loadExpenseRequests();
      })
      .catch((err) => toast.error(err.response?.data?.message || `Failed to ${status} expense`));
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!payModalExpense) return;

    fundApi.payExpense(payModalExpense._id, { paymentRef, notes: payNotes })
      .then(() => {
        toast.success('Expense marked as paid & posted to Fund ledger');
        setPayModalExpense(null);
        setPaymentRef('');
        setPayNotes('');
        loadExpenseRequests();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Payment recording failed'));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="section-title gradient-text">Expense Requests & Payments</h1>
          <p className="text-dark-100/60 text-sm mt-1">
            Manage association expenditure lifecycle (Proposal → Head Approval → Payout) and audit online payments.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-dark-800 p-1 rounded-xl border border-dark-700/60 self-start md:self-auto">
          <button
            onClick={() => handleTabChange('expenses')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'expenses'
                ? 'bg-primary-600 text-white shadow'
                : 'text-dark-100/60 hover:text-white'
            }`}
          >
            Expense Requests
          </button>
          <button
            onClick={() => handleTabChange('payments')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'payments'
                ? 'bg-primary-600 text-white shadow'
                : 'text-dark-100/60 hover:text-white'
            }`}
          >
            Online Payments Audit
          </button>
        </div>
      </div>

      {activeTab === 'expenses' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submission Form Panel */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <BanknotesIcon className="w-5 h-5 text-primary-400" />
              Create Expense Proposal
            </h3>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="label">Proposed Payout Amount (Rs.)</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  required
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Expenditure Category</label>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
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
                <label className="label">Expense Purpose / Title</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Pitch grass seeds and roller service"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Detailed Justification / Notes</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="Explain why funds are required..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Attach Invoice / Bill Receipt (Optional)</label>
                <FileUpload
                  folder="expenses"
                  accept="image/*,.pdf"
                  value={attachmentUrl}
                  onChange={setAttachmentUrl}
                  label="Upload Invoice / Bill"
                />
              </div>

              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                {saving ? 'Submitting Proposal...' : 'Dispatch Request to Head'}
              </button>
            </form>
          </div>

          {/* Expense Tracking Table */}
          <div className="card lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-semibold text-white">Expense Requests Registry</h3>
              <div className="flex gap-1 bg-dark-700/60 p-1 rounded-lg border border-dark-600/50">
                {['', 'pending', 'approved', 'paid', 'rejected'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 text-xs rounded capitalize transition-all ${
                      statusFilter === s ? 'bg-primary-500 text-white font-medium' : 'text-dark-100/60 hover:text-white'
                    }`}
                  >
                    {s || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
              </div>
            ) : expenses.length === 0 ? (
              <p className="text-xs text-dark-100/40 py-12 text-center">No expense requests found for this filter</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Requester</th>
                      <th>Purpose & Category</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr key={exp._id}>
                        <td className="text-xs text-dark-100/60">{new Date(exp.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="text-xs font-semibold text-white">{exp.requestedBy?.name || 'User'}</div>
                          <span className="text-[10px] text-dark-100/40 capitalize">{exp.requestedBy?.role?.replace('_', ' ')}</span>
                        </td>
                        <td>
                          <div className="text-xs font-semibold text-white max-w-[200px] truncate">{exp.purpose}</div>
                          <span className="badge badge-info text-[10px] capitalize mt-0.5">{exp.category?.replace('_', ' ')}</span>
                          {exp.attachments && exp.attachments.length > 0 && (
                            <a
                              href={exp.attachments[0]}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-primary-400 hover:underline flex items-center gap-1 mt-1"
                            >
                              <PaperClipIcon className="w-3 h-3" /> View Attachment
                            </a>
                          )}
                          {exp.rejectionReason && (
                            <div className="text-[10px] text-red-400 mt-1 italic">Reason: {exp.rejectionReason}</div>
                          )}
                          {exp.paymentRef && (
                            <div className="text-[10px] text-green-400 mt-1">Ref: {exp.paymentRef}</div>
                          )}
                        </td>
                        <td className="font-bold text-red-400">{formatCurrency(exp.amount)}</td>
                        <td>
                          <span
                            className={`badge ${
                              exp.status === 'paid'
                                ? 'badge-success'
                                : exp.status === 'approved'
                                ? 'badge-info'
                                : exp.status === 'pending'
                                ? 'badge-pending'
                                : 'badge-danger'
                            } capitalize`}
                          >
                            {exp.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            {/* Head/Admin Review Actions */}
                            {isHeadOrAdmin && exp.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleReview(exp._id, 'approved')}
                                  className="btn-ghost p-1.5 text-green-400 hover:bg-green-500/20 rounded-lg"
                                  title="Approve Request"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setRejectModalExpense(exp)}
                                  className="btn-ghost p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg"
                                  title="Reject Request"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {/* Funds Officer Mark as Paid Action */}
                            {isFundsOfficerOrAdmin && exp.status === 'approved' && (
                              <button
                                onClick={() => setPayModalExpense(exp)}
                                className="btn-primary text-xs py-1 px-2.5 flex items-center gap-1 whitespace-nowrap"
                              >
                                <CreditCardIcon className="w-3.5 h-3.5" /> Mark Paid
                              </button>
                            )}

                            {exp.status === 'paid' && (
                              <span className="text-[10px] text-green-400 font-medium">Disbursed</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Online Payments Audit Tab */
        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <CreditCardIcon className="w-5 h-5 text-sport-400" />
              Incoming Online Payments (Gateway & Mock Audit)
            </h3>
            <button onClick={loadPaymentHistory} className="btn-secondary text-xs py-1.5 px-3">
              Refresh
            </button>
          </div>

          {loadingPayments ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-xs text-dark-100/40 py-12 text-center">No payment transactions recorded</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Payer</th>
                    <th>Order ID / Payment ID</th>
                    <th>Purpose</th>
                    <th>Gateway</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id}>
                      <td className="text-xs text-dark-100/60">{new Date(p.createdAt).toLocaleString()}</td>
                      <td>
                        <div className="text-xs font-semibold text-white">{p.payerUserId?.name || 'User'}</div>
                        <div className="text-[10px] text-dark-100/40">{p.payerUserId?.email}</div>
                      </td>
                      <td className="text-xs font-mono">
                        <div className="text-white">{p.orderId}</div>
                        <div className="text-dark-100/40 text-[10px]">{p.paymentId || 'Pending Verification'}</div>
                      </td>
                      <td>
                        <span className="badge badge-info text-xs capitalize">
                          {p.purpose?.replace('_', ' ') || 'General'}
                        </span>
                      </td>
                      <td className="text-xs uppercase font-medium text-dark-100/70">{p.gateway}</td>
                      <td className="font-bold text-green-400">{formatCurrency(p.amount)}</td>
                      <td>
                        <span
                          className={`badge ${
                            p.status === 'captured' || p.status === 'completed'
                              ? 'badge-success'
                              : p.status === 'pending'
                              ? 'badge-pending'
                              : 'badge-danger'
                          } capitalize`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-white">Reject Expense Proposal</h3>
            <p className="text-xs text-dark-100/60">
              Provide a rationale for turning down the request for "{rejectModalExpense.purpose}" ({formatCurrency(rejectModalExpense.amount)}).
            </p>
            <textarea
              className="input min-h-[80px]"
              placeholder="e.g. Budget exhausted for this quarter or improper quotation..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setRejectModalExpense(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReview(rejectModalExpense._id, 'rejected', rejectionReason)}
                className="btn-danger text-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal for Funds Officer */}
      {payModalExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={handlePay} className="bg-dark-800 border border-dark-700 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-semibold text-white">Disburse / Mark Expense as Paid</h3>
            <p className="text-xs text-dark-100/60">
              Confirm payment of <strong className="text-white">{formatCurrency(payModalExpense.amount)}</strong> for "{payModalExpense.purpose}".
              This will automatically post an expense entry to the association's central Fund ledger.
            </p>
            <div>
              <label className="label">Payment Reference / UTR Number</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. UTR-982348123 or CHQ-0012"
                required
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Disbursement Remarks / Notes (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="Paid via NetBanking / Cashier"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-dark-700/50">
              <button
                type="button"
                onClick={() => setPayModalExpense(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs">
                Confirm & Record Ledger Payout
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
