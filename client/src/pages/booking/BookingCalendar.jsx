import React, { useState, useEffect } from 'react';
import { bookingApi } from '../../api/bookingApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function BookingCalendar() {
  const [grounds, setGrounds] = useState([]);
  const [selectedGroundId, setSelectedGroundId] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Block slots form state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('17:00');
  const [blockReason, setBlockReason] = useState('Scheduled Maintenance / Booking Blockout');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    loadGrounds();
  }, []);

  useEffect(() => {
    if (selectedGroundId) {
      loadCalendarBookings();
    }
  }, [selectedGroundId, currentMonth, currentYear]);

  const loadGrounds = () => {
    api.get('/grounds')
      .then(res => {
        const data = res.data.data || [];
        setGrounds(data);
        if (data.length > 0) setSelectedGroundId(data[0]._id);
      })
      .catch(() => {});
  };

  const loadCalendarBookings = () => {
    setLoading(true);
    bookingApi.getCalendar({
      groundId: selectedGroundId,
      month: currentMonth,
      year: currentYear
    })
      .then(res => setBookings(res.data.data || []))
      .catch(() => toast.error('Failed to load calendar slots'))
      .finally(() => setLoading(false));
  };

  const handleBlockSlot = (e) => {
    e.preventDefault();
    if (!selectedGroundId) return toast.error('Please select a ground first');

    // Create a mock booking for blockout
    const payload = {
      groundId: selectedGroundId,
      date: blockDate,
      startTime: blockStartTime,
      endTime: blockEndTime,
      purpose: 'other',
      status: 'approved',
      rejectionReason: blockReason // Use this field to store blockout description if needed
    };

    // Submitting through axios directly to avoid role checks on standard captain endpoints
    api.post('/bookings', payload)
      .then(() => {
        toast.success('Ground slots successfully blocked');
        setShowBlockModal(false);
        setBlockDate('');
        loadCalendarBookings();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Block slot failed'));
  };

  // Helper calculations for calendar grids
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayIndex = (month, year) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayIndex = getFirstDayIndex(currentMonth, currentYear);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Ground Allocations Calendar</h1>
          <p className="text-dark-100/60 text-sm mt-1">Calendar overview of ground time slots, friendly matches, and tournament schedules</p>
        </div>
        <div className="flex gap-2">
          <select className="input max-w-xs" value={selectedGroundId} onChange={e => setSelectedGroundId(e.target.value)}>
            {grounds.map(g => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>
          <button onClick={() => setShowBlockModal(true)} className="btn-primary">
            Block Slots
          </button>
        </div>
      </div>

      <div className="card space-y-4">
        {/* Calendar Nav */}
        <div className="flex justify-between items-center border-b border-dark-700/50 pb-4">
          <button onClick={prevMonth} className="btn-secondary py-1 text-xs">
            Previous Month
          </button>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            {months[currentMonth]} {currentYear}
          </h2>
          <button onClick={nextMonth} className="btn-secondary py-1 text-xs">
            Next Month
          </button>
        </div>

        {/* Days grid headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-dark-100/50 uppercase tracking-widest pb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Days */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Blank padding slots */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`blank-${idx}`} className="bg-dark-900/20 min-h-[90px] rounded-xl border border-transparent" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              // Find matches/bookings on this date
              const dayBookings = bookings.filter(b => {
                const bDate = new Date(b.date).toISOString().split('T')[0];
                return bDate === dateStr;
              });

              return (
                <div key={day} className="bg-dark-900 border border-dark-700/30 min-h-[90px] p-2 rounded-xl flex flex-col justify-between hover:border-dark-600 transition-colors">
                  <span className="text-xs font-bold text-dark-100/40">{day}</span>
                  <div className="space-y-1 mt-1 max-h-[60px] overflow-y-auto pr-0.5">
                    {dayBookings.map(b => (
                      <div key={b._id} className="text-[9px] font-medium py-0.5 px-1.5 bg-primary-600/10 border border-primary-500/20 rounded-md text-primary-400 truncate">
                        {b.startTime} - {b.teamId?.name || 'Block'}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Block Slot Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md space-y-4">
            <h3 className="section-title text-white">Block Ground Time Slots</h3>
            <form onSubmit={handleBlockSlot} className="space-y-4">
              <div>
                <label className="label">Blockout Date</label>
                <input type="date" className="input" required value={blockDate} onChange={e => setBlockDate(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Time</label>
                  <input type="time" className="input" required value={blockStartTime} onChange={e => setBlockStartTime(e.target.value)} />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input type="time" className="input" required value={blockEndTime} onChange={e => setBlockEndTime(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label">Blockout Reason</label>
                <textarea className="input min-h-[80px]" required value={blockReason} onChange={e => setBlockReason(e.target.value)} />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-dark-700/50">
                <button type="button" onClick={() => setShowBlockModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Block Slots</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
