import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon, DocumentArrowDownIcon, TableCellsIcon,
  CurrencyRupeeIcon, ArrowUpIcon, ArrowDownIcon
} from '@heroicons/react/24/outline';

export default function FinancialReports() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('monthly');
  const [exporting, setExporting] = useState(false);

  useEffect(() => { loadData(); }, [range]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txRes, dashRes] = await Promise.all([
        api.get('/funds', { params: { limit: 200 } }),
        api.get('/funds/dashboard'),
      ]);
      setTransactions(txRes.data.data || []);
      setSummary(dashRes.data.data);
    } catch { toast.error('Failed to load financial data'); }
    finally { setLoading(false); }
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      // Dynamic import for jspdf
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const now = new Date();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(59, 130, 246);
      doc.text('Financial Report', 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, 25);
      doc.text(`Period: ${range.charAt(0).toUpperCase() + range.slice(1)}`, 14, 31);

      // Summary
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary', 14, 42);
      autoTable(doc, {
        startY: 46,
        head: [['Metric', 'Amount']],
        body: [
          ['Total Income', `₹ ${(summary?.totalIncome || 0).toLocaleString()}`],
          ['Total Expenses', `₹ ${(summary?.totalExpenses || 0).toLocaleString()}`],
          ['Net Balance', `₹ ${(summary?.balance || 0).toLocaleString()}`],
          ['Pending Approvals', String(summary?.pendingExpenseRequests || 0)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      // Transactions table
      const tY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Transactions', 14, tY);
      autoTable(doc, {
        startY: tY + 4,
        head: [['Date', 'Type', 'Category', 'Description', 'Amount', 'Status']],
        body: transactions.map(t => [
          new Date(t.date || t.createdAt).toLocaleDateString(),
          t.type === 'income' ? '↑ Income' : '↓ Expense',
          t.category,
          (t.description || '').slice(0, 40),
          `₹ ${Number(t.amount || 0).toLocaleString()}`,
          t.status || 'N/A',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        bodyStyles: { fontSize: 8 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            data.cell.styles.textColor = data.cell.raw.startsWith('↑') ? [34, 197, 94] : [239, 68, 68];
          }
        },
      });

      doc.save(`financial-report-${range}-${now.toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('PDF export failed');
    } finally { setExporting(false); }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const { utils, writeFileXLSX } = await import('xlsx');

      // Summary sheet
      const summaryData = [
        ['Financial Report'],
        ['Generated', new Date().toLocaleString()],
        ['Period', range],
        [],
        ['Metric', 'Value'],
        ['Total Income', summary?.totalIncome || 0],
        ['Total Expenses', summary?.totalExpenses || 0],
        ['Net Balance', summary?.balance || 0],
        ['Pending Approvals', summary?.pendingExpenseRequests || 0],
      ];

      // Transactions sheet
      const txData = [
        ['Date', 'Type', 'Category', 'Description', 'Amount', 'Status', 'Collected By'],
        ...transactions.map(t => [
          new Date(t.date || t.createdAt).toLocaleDateString(),
          t.type,
          t.category,
          t.description || '',
          Number(t.amount || 0),
          t.status || '',
          t.collectedBy?.name || '',
        ]),
      ];

      const wb = utils.book_new();
      const wsSummary = utils.aoa_to_sheet(summaryData);
      const wsTx = utils.aoa_to_sheet(txData);

      utils.book_append_sheet(wb, wsSummary, 'Summary');
      utils.book_append_sheet(wb, wsTx, 'Transactions');

      writeFileXLSX(wb, `financial-report-${range}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Excel export failed');
    } finally { setExporting(false); }
  };

  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totalIncome = incomeTransactions.reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalExpenses = expenseTransactions.reduce((s, t) => s + Number(t.amount || 0), 0);

  // Category breakdown for income
  const incomeByCategory = incomeTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount || 0);
    return acc;
  }, {});
  const expenseByCategory = expenseTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount || 0);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Financial Reports</h1>
          <p className="text-dark-100/50 text-sm mt-0.5">{transactions.length} transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input py-2 text-sm w-36" value={range} onChange={e => setRange(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button onClick={exportPDF} disabled={exporting} className="btn-primary">
            <DocumentArrowDownIcon className="w-4 h-4" />
            {exporting ? 'Exporting…' : 'PDF'}
          </button>
          <button onClick={exportExcel} disabled={exporting} className="btn-secondary">
            <TableCellsIcon className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <ArrowUpIcon className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-dark-100/50 text-xs">Total Income</p>
            <p className="text-xl font-bold text-green-400">₹ {totalIncome.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <ArrowDownIcon className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-dark-100/50 text-xs">Total Expenses</p>
            <p className="text-xl font-bold text-red-400">₹ {totalExpenses.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
            <CurrencyRupeeIcon className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <p className="text-dark-100/50 text-xs">Net Balance</p>
            <p className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₹ {(totalIncome - totalExpenses).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <h3 className="font-semibold text-white">Income by Category</h3>
          {Object.keys(incomeByCategory).length === 0 ? (
            <p className="text-dark-100/40 text-sm">No income data</p>
          ) : Object.entries(incomeByCategory).map(([cat, amt]) => {
            const pct = totalIncome > 0 ? (amt / totalIncome * 100).toFixed(0) : 0;
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs text-dark-100/70 mb-1">
                  <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
                  <span className="text-green-400 font-medium">₹ {amt.toLocaleString()} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="card space-y-3">
          <h3 className="font-semibold text-white">Expenses by Category</h3>
          {Object.keys(expenseByCategory).length === 0 ? (
            <p className="text-dark-100/40 text-sm">No expense data</p>
          ) : Object.entries(expenseByCategory).map(([cat, amt]) => {
            const pct = totalExpenses > 0 ? (amt / totalExpenses * 100).toFixed(0) : 0;
            return (
              <div key={cat}>
                <div className="flex justify-between text-xs text-dark-100/70 mb-1">
                  <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
                  <span className="text-red-400 font-medium">₹ {amt.toLocaleString()} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction table */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">All Transactions</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-dark-100/40 py-8">No transactions</td></tr>
              ) : transactions.map(t => (
                <tr key={t._id}>
                  <td className="text-xs">{new Date(t.date || t.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge text-xs capitalize ${t.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                      {t.type === 'income' ? '↑' : '↓'} {t.type}
                    </span>
                  </td>
                  <td className="text-xs capitalize">{t.category?.replace(/_/g, ' ')}</td>
                  <td className="text-xs text-dark-100/70 max-w-48 truncate">{t.description}</td>
                  <td className={`font-mono font-medium ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    ₹ {Number(t.amount || 0).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge text-xs capitalize ${t.status === 'approved' ? 'badge-success' : t.status === 'pending' ? 'badge-pending' : 'badge-danger'}`}>
                      {t.status || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
