import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/validators';

// ─── Simple SVG Donut Chart Sub-component ────────────────────────────
const DonutChart = ({ data }) => {
  const total = data.reduce((acc, curr) => acc + (curr.count || 0), 0);
  let accumulatedAngle = 0;

  if (total === 0) return <div className="text-center text-xs text-dark-100/40">No data available</div>;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4" />
        {data.map((item, idx) => {
          const percentage = ((item.count || 0) / total) * 100;
          const strokeDash = `${percentage} ${100 - percentage}`;
          const strokeOffset = 100 - accumulatedAngle;
          accumulatedAngle += percentage;

          // Cycle through premium color strokes
          const colors = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899', '#3b82f6'];
          const strokeColor = colors[idx % colors.length];

          return (
            <circle
              key={idx}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={strokeColor}
              strokeWidth="4"
              strokeDasharray={strokeDash}
              strokeDashoffset={strokeOffset}
            />
          );
        })}
      </svg>

      <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
        {data.map((item, idx) => {
          const colors = ['bg-primary-500', 'bg-sport-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]} flex-shrink-0`} />
              <span className="text-dark-100/70 capitalize truncate max-w-[100px]">{item.name || item._id}</span>
              <span className="text-white font-bold">{item.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Simple SVG Bar Chart Sub-component ─────────────────────────────
const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.count || 0), 1);

  if (data.length === 0) return <div className="text-center text-xs text-dark-100/40">No data available</div>;

  return (
    <svg className="w-full h-48" viewBox="0 0 400 200">
      {/* Background Grid Lines */}
      <line x1="40" y1="40" x2="380" y2="40" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
      <line x1="40" y1="90" x2="380" y2="90" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
      <line x1="40" y1="140" x2="380" y2="140" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
      
      {data.map((item, idx) => {
        const x = 50 + idx * (320 / Math.max(data.length, 1));
        const val = item.count || 0;
        const height = (val / max) * 120;
        const y = 160 - height;
        const monthLabel = item._id?.month ? `${item._id.month}/${String(item._id.year).substring(2)}` : (item.name || item._id || '');

        return (
          <g key={idx} className="group cursor-pointer">
            {/* Bar */}
            <defs>
              <linearGradient id={`grad-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <rect
              x={x}
              y={y}
              width={20}
              height={height}
              fill={`url(#grad-${idx})`}
              rx="4"
              className="transition-all duration-300 hover:opacity-80"
            />
            {/* Value tooltip label */}
            <text x={x + 10} y={y - 8} textAnchor="middle" fill="#fff" className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {val}
            </text>
            {/* Month / Label */}
            <text x={x + 10} y="180" textAnchor="middle" fill="#94a3b8" className="text-[9px] capitalize">
              {monthLabel.length > 8 ? `${monthLabel.substring(0, 7)}..` : monthLabel}
            </text>
          </g>
        );
      })}
      
      {/* Bottom Axis Line */}
      <line x1="40" y1="160" x2="380" y2="160" stroke="#334155" strokeWidth="2" />
    </svg>
  );
};

// ─── Simple SVG Line Chart Sub-component ────────────────────────────
const LineChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.total || 0), 1);
  const totalPoints = data.length;

  if (totalPoints === 0) return <div className="text-center text-xs text-dark-100/40">No data available</div>;

  const points = data.map((d, idx) => {
    const x = 50 + idx * (320 / Math.max(totalPoints - 1, 1));
    const val = d.total || 0;
    const y = 160 - (val / max) * 120;
    return { x, y, label: d._id?.month ? `${d._id.month}/${String(d._id.year).substring(2)}` : (d.name || d._id || ''), val };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y} `;
  }, '');

  return (
    <svg className="w-full h-48" viewBox="0 0 400 200">
      <line x1="40" y1="40" x2="380" y2="40" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
      <line x1="40" y1="90" x2="380" y2="90" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
      <line x1="40" y1="140" x2="380" y2="140" stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />

      {/* Line path */}
      {points.length > 0 && (
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Dots and Tooltips */}
      {points.map((p, idx) => (
        <g key={idx} className="group cursor-pointer">
          <circle cx={p.x} cy={p.y} r="5" fill="#3b82f6" stroke="#0f172a" strokeWidth="2" />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#fff" className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {formatCurrency(p.val)}
          </text>
          <text x={p.x} y="180" textAnchor="middle" fill="#94a3b8" className="text-[9px]">
            {p.label}
          </text>
        </g>
      ))}

      <line x1="40" y1="160" x2="380" y2="160" stroke="#334155" strokeWidth="2" />
    </svg>
  );
};

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAnalytics()
      .then(res => setAnalytics(res.data.data))
      .catch(() => toast.error('Failed to load system analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Analytics Engine</h1>
          <p className="text-dark-100/60 text-sm mt-1">Platform analytics, user growth vectors, sports participation, and revenue streams</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly User Growth */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Monthly User Growth (12 Months)</h3>
          <BarChart data={analytics?.monthlyUserGrowth || []} />
        </div>

        {/* Association-wise Users */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Association Users Distribution</h3>
          <BarChart data={analytics?.associationWiseUsers || []} />
        </div>

        {/* Sport-wise Participation */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Sport-wise Teams Distribution</h3>
          <DonutChart data={analytics?.sportParticipation || []} />
        </div>

        {/* Revenue Trends */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Financial Operating Revenue Streams</h3>
          <LineChart data={analytics?.revenueTrends || []} />
        </div>
      </div>
    </div>
  );
}
