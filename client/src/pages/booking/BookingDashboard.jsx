import React, { useState, useEffect } from 'react';
import { bookingApi } from '../../api/bookingApi';
import api from '../../api/axios';
import {
  MapPinIcon, ClipboardDocumentListIcon, CheckCircleIcon,
  XMarkIcon, ClockIcon, PlayIcon, ShieldExclamationIcon, AdjustmentsHorizontalIcon,
  WrenchScrewdriverIcon, ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="card hover:border-dark-600/50 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-dark-100/60 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value ?? '-'}</p>
        {subtitle && <p className="text-xs text-dark-100/40 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export default function BookingDashboard() {
  const [stats, setStats] = useState(null);
  const [grounds, setGrounds] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Maintenance scheduling state
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceGround, setMaintenanceGround] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({ startDate: '', endDate: '', reason: '' });

  // Suggest alternate modal state
  const [showAlternateModal, setShowAlternateModal] = useState(false);
  const [alternateBooking, setAlternateBooking] = useState(null);
  const [alternateGroundId, setAlternateGroundId] = useState('');
  const [alternateTime, setAlternateTime] = useState({ startTime: '', endTime: '' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    setLoading(true);
    Promise.all([
      bookingApi.getDashboard().catch(() => null),
      api.get('/grounds').catch(() => ({ data: { data: [] } })),
      bookingApi.getBookings({ status: 'pending' }).catch(() => ({ data: { data: [] } }))
    ])
      .then(([statsRes, groundsRes, bookingsRes]) => {
        if (statsRes) setStats(statsRes.data.data);
        setGrounds(groundsRes.data.data || []);
        setRequests(bookingsRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load telemetry stats'))
      .finally(() => setLoading(false));
  };

  const handleUpdateStatus = (groundId, status) => {
    bookingApi.updateGroundStatus(groundId, status)
      .then(() => {
        toast.success(`Ground status updated to ${status}`);
        loadDashboardData();
      })
      .catch(() => toast.error('Status override failed'));
  };

  const handleApprove = (id) => {
    if (window.confirm('Approve this ground booking slot request?')) {
      bookingApi.approveBooking(id)
        .then(() => {
          toast.success('Ground booking slot allocated');
          loadDashboardData();
        })
        .catch(err => {
          if (err.response?.status === 409) {
            toast.error(err.response.data.message || 'Priority conflict detected');
          } else {
            toast.error('Booking approval failed');
          }
        });
    }
  };

  const handleOpenReject = (booking) => {
    setSelectedBooking(booking);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return toast.error('Please specify a rejection reason');

    bookingApi.rejectBooking(selectedBooking._id, { reason: rejectionReason })
      .then(() => {
        toast.success('Ground booking slot request rejected');
        setShowRejectModal(false);
        loadDashboardData();
      })
      .catch(() => toast.error('Rejection request failed'));
  };

  const handleMaintenance = (ground) => {
    setMaintenanceGround(ground);
    setMaintenanceForm({ startDate: '', endDate: '', reason: '' });
    setShowMaintenanceModal(true);
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    if (!maintenanceForm.startDate || !maintenanceForm.endDate) return toast.error('Select dates');
    try {
      await bookingApi.updateGroundStatus(maintenanceGround._id, 'maintenance');
      toast.success(`${maintenanceGround.name} scheduled for maintenance`);
      setShowMaintenanceModal(false);
      loadDashboardData();
    } catch { toast.error('Maintenance scheduling failed'); }
  };

  const handleSuggestAlternate = (booking) => {
    setAlternateBooking(booking);
    setAlternateGroundId('');
    setAlternateTime({ startTime: '', endTime: '' });
    setShowAlternateModal(true);
  };

  const handleAlternateSubmit = async (e) => {
    e.preventDefault();
    if (!alternateGroundId) return toast.error('Select an alternate ground');
    // Reject current with reason that includes alternate info
    const reason = `Conflict on requested ground. Suggested alternate: Ground ID ${alternateGroundId} at ${alternateTime.startTime}–${alternateTime.endTime}`;
    try {
      await bookingApi.rejectBooking(alternateBooking._id, { reason });
      toast.success('Booking rejected with alternate suggestion sent');
      setShowAlternateModal(false);
      loadDashboardData();
    } catch { toast.error('Failed to send alternate suggestion'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Ground Allocations Console</h1>
          <p className="text-dark-100/60 text-sm mt-1">Review bookings, manage ground statuses, and check priority scores</p>
        </div>
      </div>

      {/* Grid status cards */}
      <h2 className="text-lg font-bold text-white mb-2">Ground Telemetry</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Grounds" value={stats?.totalGrounds} icon={MapPinIcon} color="bg-primary-600" />
        <StatCard title="Available Grounds" value={stats?.availableGrounds} icon={CheckCircleIcon} color="bg-sport-600" />
        <StatCard title="Occupied Grounds" value={stats?.occupiedGrounds} icon={ClockIcon} color="bg-orange-600" />
        <StatCard title="Under Maintenance" value={stats?.groundsUnderMaintenance} icon={ShieldExclamationIcon} color="bg-red-600" />
      </div>

      <h2 className="text-lg font-bold text-white mb-2">Booking Telemetry</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={stats?.totalBookingRequests} icon={ClipboardDocumentListIcon} color="bg-primary-600" subtitle={`Approved: ${stats?.approvedBookings}`} />
        <StatCard title="Pending Requests" value={stats?.pendingBookingRequests} icon={ClockIcon} color="bg-yellow-600" />
        <StatCard title="Rejected Requests" value={stats?.rejectedBookings} icon={XMarkIcon} color="bg-red-600" />
        <StatCard title="Utilization Rate" value={`${stats?.utilizationRate || 0}%`} icon={AdjustmentsHorizontalIcon} color="bg-teal-600" />
      </div>

      <h2 className="text-lg font-bold text-white mb-2">Detailed Statistics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Bookings" value={stats?.todayBookings} icon={ClockIcon} color="bg-blue-600" />
        <StatCard title="Upcoming Bookings" value={stats?.upcomingBookings} icon={ClockIcon} color="bg-indigo-600" />
        <StatCard title="Friendly Bookings" value={stats?.friendlyMatchBookings} icon={PlayIcon} color="bg-purple-600" />
        <StatCard title="Tournament Bookings" value={stats?.tournamentBookings} icon={ClipboardDocumentListIcon} color="bg-pink-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="card-sm bg-dark-900 border border-dark-700/30">
          <p className="text-xs text-dark-100/40 font-medium">Most Used Ground</p>
          <p className="text-lg font-bold text-white mt-1 truncate">{stats?.mostUsedGround || 'N/A'}</p>
        </div>
        <div className="card-sm bg-dark-900 border border-dark-700/30">
          <p className="text-xs text-dark-100/40 font-medium">Least Used Ground</p>
          <p className="text-lg font-bold text-white mt-1 truncate">{stats?.leastUsedGround || 'N/A'}</p>
        </div>
      </div>

      {/* Main interface area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pending Requests Column */}
        <div className="card lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-white">Pending Allocation Requests ({requests.length})</h3>
          
          {requests.length === 0 ? (
            <p className="text-xs text-dark-100/40 py-12 text-center">No pending allocation requests</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Team Details</th>
                    <th>Ground Details</th>
                    <th>Time Slot</th>
                    <th>Priority Score</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r._id}>
                      <td>
                        <div className="font-semibold text-white">{r.teamId?.name || 'Deleted Team'}</div>
                        <div className="text-[10px] text-dark-100/40 capitalize">{r.teamId?.sport || 'General'}</div>
                      </td>
                      <td>
                        <div className="text-xs font-semibold text-white">{r.groundId?.name || 'Deleted Ground'}</div>
                        <div className="text-[10px] text-dark-100/40">{new Date(r.date).toLocaleDateString()} — {r.purpose}</div>
                      </td>
                      <td>
                        <span className="badge badge-success font-mono">{r.startTime} - {r.endTime}</span>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-white">{r.priorityScore || 0}</span>
                      </td>
                      <td className="text-right space-x-2">
                        <button onClick={() => handleApprove(r._id)} className="btn-ghost py-1 text-xs text-green-500">Approve</button>
                        <button onClick={() => handleOpenReject(r)} className="btn-ghost py-1 text-xs text-red-500">Reject</button>
                        <button onClick={() => handleSuggestAlternate(r)} className="btn-ghost py-1 text-xs text-yellow-500">Suggest Alt.</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Grounds Status Management Column */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Ground Status Controls</h3>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {grounds.map(g => (
              <div key={g._id} className="card-sm bg-dark-900 border border-dark-700/30 p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-white text-xs block">{g.name}</span>
                    <span className="text-[10px] text-dark-100/40">{g.location || 'No location info'}</span>
                  </div>
                  <span className={`badge ${
                    g.status === 'active' ? 'badge-success' :
                    g.status === 'maintenance' ? 'badge-danger' : 'badge-pending'
                  } capitalize`}>{g.status}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-1 pt-1">
                  <button onClick={() => handleUpdateStatus(g._id, 'active')} className="btn-ghost py-1 text-[10px] hover:bg-sport-600/10 hover:text-sport-500">
                    Available
                  </button>
                  <button onClick={() => handleUpdateStatus(g._id, 'unavailable')} className="btn-ghost py-1 text-[10px] hover:bg-yellow-600/10 hover:text-yellow-500">
                    Block
                  </button>
                  <button onClick={() => handleMaintenance(g)} className="btn-ghost py-1 text-[10px] hover:bg-red-600/10 hover:text-red-500">
                    Schedule Maint.
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="section-title text-white">Reject Allocation Slot</h3>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="label">Rejection / Conflict Reason</label>
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Specify the reason or propose alternative slots..."
                  required
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowRejectModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary btn-danger">Reject Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suggest Alternate Modal */}
      {showAlternateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="section-title text-white">Suggest Alternate Ground</h3>
            <p className="text-xs text-dark-100/50">This will reject the current request and notify the team of an alternate option.</p>
            <form onSubmit={handleAlternateSubmit} className="space-y-4">
              <div>
                <label className="label">Alternate Ground</label>
                <select className="input" value={alternateGroundId} onChange={e => setAlternateGroundId(e.target.value)} required>
                  <option value="">Select ground…</option>
                  {grounds.filter(g => g.status === 'active' && g._id !== alternateBooking?.groundId?._id).map(g => (
                    <option key={g._id} value={g._id}>{g.name} — {g.location}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Time</label>
                  <input type="time" className="input" value={alternateTime.startTime} onChange={e => setAlternateTime(p => ({ ...p, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="time" className="input" value={alternateTime.endTime} onChange={e => setAlternateTime(p => ({ ...p, endTime: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowAlternateModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Send Suggestion</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Scheduling Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md space-y-4">
            <div className="flex items-center gap-3">
              <WrenchScrewdriverIcon className="w-6 h-6 text-yellow-400" />
              <h3 className="font-semibold text-white">Schedule Maintenance — {maintenanceGround?.name}</h3>
            </div>
            <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input" value={maintenanceForm.startDate} onChange={e => setMaintenanceForm(p => ({ ...p, startDate: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" className="input" value={maintenanceForm.endDate} onChange={e => setMaintenanceForm(p => ({ ...p, endDate: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="label">Reason</label>
                <input className="input" placeholder="e.g. Pitch resurfacing" value={maintenanceForm.reason} onChange={e => setMaintenanceForm(p => ({ ...p, reason: e.target.value }))} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowMaintenanceModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary"><WrenchScrewdriverIcon className="w-4 h-4" /> Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
