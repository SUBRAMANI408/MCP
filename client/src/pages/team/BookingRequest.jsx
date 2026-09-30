import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { captainApi } from '../../api/captainApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function BookingRequest() {
  const { user } = useAuthStore();
  const [team, setTeam] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [groundId, setGroundId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('practice');

  useEffect(() => {
    if (user?.teamId) {
      loadBookingData();
    }
  }, [user]);

  const loadBookingData = () => {
    setLoading(true);
    Promise.all([
      captainApi.getMyTeam().catch(() => null),
      captainApi.getBookings().catch(() => ({ data: { data: [] } })),
      api.get('/grounds?status=active').catch(() => ({ data: { data: [] } }))
    ])
      .then(([teamRes, bookingsRes, groundsRes]) => {
        if (teamRes) setTeam(teamRes.data.data);
        setBookings(bookingsRes.data.data || []);
        setGrounds(groundsRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load booking schedule'))
      .finally(() => setLoading(false));
  };

  const handleCreateBooking = (e) => {
    e.preventDefault();
    if (!groundId) return toast.error('Please choose a ground');

    const payload = {
      groundId,
      teamId: user.teamId,
      date,
      startTime,
      endTime,
      purpose
    };

    captainApi.createBooking(payload)
      .then(() => {
        toast.success('Ground booking request submitted successfully');
        setShowModal(false);
        setGroundId('');
        setDate('');
        setStartTime('');
        setEndTime('');
        setPurpose('practice');
        loadBookingData();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Booking submission failed'));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Ground Booking Requests</h1>
          <p className="text-dark-100/60 text-sm mt-1">Submit time slots requests on association grounds and inspect priority weights</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          Request Booking
        </button>
      </div>

      {/* Priority Indicator Alert */}
      {team && (
        <div className="card border-primary-500/30 bg-primary-950/10 py-3.5 px-4 flex justify-between items-center text-xs">
          <div>
            <span className="font-bold text-white block mb-0.5">Booking Priority Logic Active</span>
            <span className="text-dark-100/60">Priority is calculated using team matches played. Fewer matches played gets higher priority on conflicts.</span>
          </div>
          <div className="bg-dark-900 border border-dark-700/50 p-2 rounded-xl text-center min-w-[100px]">
            <span className="text-[10px] text-dark-100/40 font-bold block uppercase">Matches Played</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{team.matchesPlayed || 0}</span>
          </div>
        </div>
      )}

      {/* Booking Requests List */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-white">Your Ground Booking Logs</h3>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No booking requests submitted yet. Click "Request Booking" to start.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Ground Name</th>
                  <th>Purpose</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Conflict Rating</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td><span className="font-semibold text-white">{b.groundId?.name || 'Deleted Ground'}</span></td>
                    <td><span className="badge badge-info capitalize">{b.purpose}</span></td>
                    <td>{new Date(b.date).toLocaleDateString()}</td>
                    <td><span className="badge badge-success font-mono">{b.startTime} - {b.endTime}</span></td>
                    <td>
                      <span className="text-xs text-dark-100/60">
                        {b.priorityScore || 0} (matches played rating)
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        b.status === 'approved' ? 'badge-success' :
                        b.status === 'pending' ? 'badge-pending' :
                        b.status === 'conflict' ? 'badge-pending border border-yellow-500/30' : 'badge-danger'
                      } capitalize`}>
                        {b.status}
                      </span>
                      {b.rejectionReason && (
                        <div className="text-[9px] text-red-400 mt-1">Note: {b.rejectionReason}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="section-title text-white">Request Ground Booking</h3>
            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="label">Select Ground</label>
                <select className="input" required value={groundId} onChange={e => setGroundId(e.target.value)}>
                  <option value="">Choose Ground</option>
                  {grounds.map(g => (
                    <option key={g._id} value={g._id}>{g.name} ({g.location || 'No Location'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Booking Date</label>
                <input type="date" className="input" required value={date} onChange={e => setDate(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time</label>
                  <input type="time" className="input" required value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="time" className="input" required value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Booking Purpose</label>
                <select className="input" value={purpose} onChange={e => setPurpose(e.target.value)}>
                  <option value="practice">Practice Session</option>
                  <option value="friendly">Friendly Match</option>
                  <option value="tournament">Tournament Match</option>
                  <option value="other">Other Activity</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
