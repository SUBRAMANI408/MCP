import React, { useState, useEffect } from 'react';
import { bookingApi } from '../../api/bookingApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function BookingReports() {
  const [activeTab, setActiveTab] = useState('bookings'); // bookings, grounds, conflicts
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState('monthly'); // daily, weekly, monthly

  useEffect(() => {
    loadReports();
  }, [activeTab, range]);

  const loadReports = () => {
    setLoading(true);
    if (activeTab === 'bookings') {
      bookingApi.getReports({ range })
        .then(res => setData(res.data.data || []))
        .catch(() => toast.error('Failed to load reports'))
        .finally(() => setLoading(false));
    } else {
      // Fetch all bookings and aggregate locally for ground usage or conflicts
      bookingApi.getBookings({ limit: 100 })
        .then(res => {
          const list = res.data.data || [];
          if (activeTab === 'grounds') {
            // Group by ground
            const counts = {};
            list.forEach(b => {
              const name = b.groundId?.name || 'Unknown Ground';
              counts[name] = (counts[name] || 0) + 1;
            });
            setData(Object.entries(counts).map(([name, count]) => ({ name, count })));
          } else {
            // Conflicts
            const conflicts = list.filter(b => b.status === 'conflict' || b.status === 'rejected');
            setData(conflicts);
          }
        })
        .catch(() => toast.error('Failed to load logs'))
        .finally(() => setLoading(false));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Ground Booking Reports</h1>
          <p className="text-dark-100/60 text-sm mt-1">Audit reports for daily bookings, ground usage, and conflicting requests</p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-dark-700/50 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setActiveTab('bookings'); setData([]); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'bookings' ? 'bg-primary-600 text-white' : 'bg-dark-900 text-dark-100/60 hover:bg-dark-700/50'
              }`}
            >
              Booking Counts
            </button>
            <button
              onClick={() => { setActiveTab('grounds'); setData([]); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'grounds' ? 'bg-primary-600 text-white' : 'bg-dark-900 text-dark-100/60 hover:bg-dark-700/50'
              }`}
            >
              Ground Utilization
            </button>
            <button
              onClick={() => { setActiveTab('conflicts'); setData([]); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                activeTab === 'conflicts' ? 'bg-primary-600 text-white' : 'bg-dark-900 text-dark-100/60 hover:bg-dark-700/50'
              }`}
            >
              Conflict Logs
            </button>
          </div>

          {activeTab === 'bookings' && (
            <div className="flex gap-2">
              <select className="input py-1.5 px-3 text-xs w-32" value={range} onChange={e => setRange(e.target.value)}>
                <option value="daily">Daily Range</option>
                <option value="weekly">Weekly Range</option>
                <option value="monthly">Monthly Range</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No reports data compiled for current selection</p>
        ) : (
          <div className="table-container">
            {activeTab === 'bookings' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Status Category</th>
                    <th>Booking Volume Count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      <td><span className="font-semibold text-white capitalize">{row._id || 'Pending'}</span></td>
                      <td><span className="font-bold text-primary-400">{row.count} slots</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'grounds' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Ground Name</th>
                    <th>Total Scheduled Slots Filled</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      <td><span className="font-semibold text-white">{row.name}</span></td>
                      <td><span className="font-bold text-sport-500">{row.count} reservations</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'conflicts' && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Conflicting Team</th>
                    <th>Ground</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th>Conflict Description</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      <td><span className="font-semibold text-white">{row.teamId?.name || 'Unknown Team'}</span></td>
                      <td>{row.groundId?.name || 'Unknown Ground'}</td>
                      <td>{new Date(row.date).toLocaleDateString()} ({row.startTime} - {row.endTime})</td>
                      <td><span className="badge badge-danger capitalize">{row.status}</span></td>
                      <td><span className="text-xs text-dark-100/50">{row.rejectionReason || 'Overridden by higher priority team'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
