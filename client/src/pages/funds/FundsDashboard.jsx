import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { fundApi } from '../../api/fundApi';
import {
  BanknotesIcon, ArrowDownRightIcon, ArrowUpRightIcon,
  DocumentTextIcon, ClockIcon, CreditCardIcon, SparklesIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/validators';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="card hover:border-dark-600/50 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-dark-100/60 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value ?? '-'}</p>
        {subtitle && <p className="text-xs text-dark-100/40 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export default function FundsDashboard() {
  const { user } = useAuthStore();
  const [balance, setBalance] = useState(null);
  const [reports, setReports] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.associationId) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = () => {
    setLoading(true);
    Promise.all([
      fundApi.getDashboard().catch(() => null),
      fundApi.getReports(user.associationId).catch(() => null)
    ])
      .then(([dashRes, repRes]) => {
        if (dashRes) {
          setBalance(dashRes.data.data);
          setRecent(dashRes.data.data.recentTransactions || []);
        }
        if (repRes) setReports(repRes.data.data);
      })
      .catch(() => toast.error('Failed to load dashboard financials'))
      .finally(() => setLoading(false));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  // Group categories from reports
  const getCatTotal = (type, category) => {
    if (!reports?.byCategory) return 0;
    const found = reports.byCategory.find(c => c._id?.type === type && c._id?.category === category);
    return found ? found.total : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Association Funds Console</h1>
          <p className="text-dark-100/60 text-sm mt-1">Review balance sheets, record cash flow inputs, and submit spending proposals</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <h2 className="text-lg font-bold text-white mb-2">Fund Allocation Balance</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Current Fund Balance" value={formatCurrency(balance?.balance || 0)} icon={BanknotesIcon} color="bg-primary-600" />
        <StatCard title="Total Income Collected" value={formatCurrency(balance?.totalIncome || 0)} icon={ArrowDownRightIcon} color="bg-sport-600" />
        <StatCard title="Total Expenses Disbursed" value={formatCurrency(balance?.totalExpenses || 0)} icon={ArrowUpRightIcon} color="bg-red-600" />
      </div>

      <h2 className="text-lg font-bold text-white mb-2">Income Category Breakdown</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Membership Fees" value={formatCurrency(getCatTotal('income', 'membership_fee'))} icon={CreditCardIcon} color="bg-blue-600" />
        <StatCard title="Tournament Fees" value={formatCurrency(getCatTotal('income', 'tournament_fee'))} icon={DocumentTextIcon} color="bg-pink-600" />
        <StatCard title="Sponsorships" value={formatCurrency(getCatTotal('income', 'sponsorship'))} icon={SparklesIcon} color="bg-teal-600" />
        <StatCard title="Donations" value={formatCurrency(getCatTotal('income', 'donation'))} icon={ArrowDownRightIcon} color="bg-indigo-600" />
      </div>

      {/* Main columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Financial Transactions Ledger */}
        <div className="card lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-white">Recent Transactions Ledger</h3>
          
          {recent.length === 0 ? (
            <p className="text-xs text-dark-100/40 py-12 text-center">No transactions ledger entries logged</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Payee Details / Description</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(r => (
                    <tr key={r._id}>
                      <td>
                        <span className={`badge ${r.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                          {r.type}
                        </span>
                      </td>
                      <td><span className="font-semibold text-white capitalize">{r.category?.replace('_', ' ')}</span></td>
                      <td>
                        <div className="text-xs font-semibold text-white truncate max-w-[200px]">{r.description}</div>
                        <div className="text-[10px] text-dark-100/40 mt-0.5">{new Date(r.createdAt).toDateString()}</div>
                      </td>
                      <td className={`font-bold ${r.type === 'income' ? 'text-sport-500' : 'text-red-400'}`}>
                        {formatCurrency(r.amount)}
                      </td>
                      <td>
                        <span className={`badge ${
                          r.status === 'approved' || r.status === 'completed' ? 'badge-success' :
                          r.status === 'pending' ? 'badge-pending' : 'badge-danger'
                        } capitalize`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Operating Balance overview */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Monthly Analytics Summary</h3>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-dark-900 rounded-xl border border-dark-700/30">
              <span className="text-[10px] text-dark-100/40 block font-bold uppercase">Average monthly income</span>
              <span className="text-xl font-bold text-white mt-1 block">{formatCurrency((balance?.totalIncome || 0) / 12)}</span>
            </div>

            <div className="p-3 bg-dark-900 rounded-xl border border-dark-700/30">
              <span className="text-[10px] text-dark-100/40 block font-bold uppercase">Average monthly expenses</span>
              <span className="text-xl font-bold text-white mt-1 block">{formatCurrency((balance?.totalExpenses || 0) / 12)}</span>
            </div>

            <div className="p-3 bg-dark-900 rounded-xl border border-dark-700/30">
              <span className="text-[10px] text-dark-100/40 block font-bold uppercase">Operational Surplus Rate</span>
              <span className="text-xl font-bold text-sport-500 mt-1 block">
                {balance?.totalIncome > 0 ? (((balance.totalIncome - balance.totalExpenses) / balance.totalIncome) * 100).toFixed(1) : '0'}%
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
