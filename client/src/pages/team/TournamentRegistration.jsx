import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../app/store';
import { captainApi } from '../../api/captainApi';
import toast from 'react-hot-toast';

export default function TournamentRegistration() {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [payingTournamentId, setPayingTournamentId] = useState(null);
  const [feeStatuses, setFeeStatuses] = useState({});

  useEffect(() => {
    if (user?.associationId) {
      loadTournaments();
    }
  }, [user]);

  const loadTournaments = () => {
    setLoading(true);
    // Fetch tournaments for current association
    captainApi.getTournaments({ associationId: user.associationId })
      .then(res => {
        const tours = res.data.data || [];
        setTournaments(tours);
      })
      .catch(() => toast.error('Failed to load tournament registries'))
      .finally(() => setLoading(false));
  };

  const handleRegister = (id) => {
    if (window.confirm('Register your team for this tournament?')) {
      captainApi.registerTournament(id)
        .then(() => {
          toast.success('Team registered successfully');
          loadTournaments();
        })
        .catch(err => toast.error(err.response?.data?.message || 'Registration failed'));
    }
  };

  const handlePayFee = async (tournament) => {
    setPayingTournamentId(tournament._id);
    try {
      const orderRes = await captainApi.createPaymentOrder({
        amount: tournament.registrationFee,
        purpose: 'tournament_fee',
        associationId: user.associationId,
        relatedId: tournament._id,
      });

      const orderData = orderRes.data.data;
      const orderId = orderData.orderId;

      // Handle Mock Mode or Live Gateway
      if (orderData.keyId === 'rzp_test_mock_mode') {
        const verifyRes = await captainApi.verifyPayment({
          orderId,
          paymentId: `pay_mock_${Date.now()}`,
          signature: `mock_sig_${orderId}`,
        });
        if (verifyRes.data.success) {
          toast.success('Tournament fee paid successfully (Mock Mode)');
          setFeeStatuses(prev => ({ ...prev, [tournament._id]: 'paid' }));
          loadTournaments();
        }
      } else if (window.Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: Math.round(tournament.registrationFee * 100),
          currency: 'INR',
          name: tournament.name,
          description: 'Tournament Registration Fee',
          order_id: orderId,
          handler: async (response) => {
            try {
              await captainApi.verifyPayment({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              toast.success('Payment verified successfully!');
              setFeeStatuses(prev => ({ ...prev, [tournament._id]: 'paid' }));
              loadTournaments();
            } catch {
              toast.error('Payment verification failed');
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
          },
          theme: { color: '#0ea5e9' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback simulated payment for dev
        const verifyRes = await captainApi.verifyPayment({
          orderId,
          paymentId: `pay_sim_${Date.now()}`,
          signature: `mock_sig_${orderId}`,
        });
        if (verifyRes.data.success) {
          toast.success('Registration fee processed');
          setFeeStatuses(prev => ({ ...prev, [tournament._id]: 'paid' }));
          loadTournaments();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed');
    } finally {
      setPayingTournamentId(null);
    }
  };

  const handleUnregister = (id) => {
    if (window.confirm('Withdraw/unregister your team from this tournament?')) {
      captainApi.unregisterTournament(id)
        .then(() => {
          toast.success('Team unregistered successfully');
          loadTournaments();
        })
        .catch(err => toast.error(err.response?.data?.message || 'Withdrawal failed'));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Tournament Registries</h1>
          <p className="text-dark-100/60 text-sm mt-1">Review upcoming tournaments in your association and register your team roster</p>
        </div>
      </div>

      <div className="card space-y-4">
        <h3 className="font-semibold text-white">Upcoming & Ongoing Tournaments</h3>

        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : tournaments.length === 0 ? (
          <p className="text-center py-12 text-dark-100/50">No tournaments scheduled in this association</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournaments.map(t => {
              const isRegistered = t.registeredTeams?.some(teamId => teamId === user.teamId || teamId._id === user.teamId);
              const maxCap = t.maxTeams || 16;
              const currentRegCount = t.registeredTeams?.length || 0;
              const hasPassedDeadline = t.registrationDeadline ? new Date(t.registrationDeadline) < new Date() : false;
              const feeAmount = t.registrationFee || 0;
              const feeStatus = feeStatuses[t._id] || (feeAmount === 0 ? 'exempt' : (isRegistered ? 'unpaid' : 'due'));

              return (
                <div key={t._id} className="card bg-dark-900 border border-dark-700/40 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-base font-bold text-white leading-tight">{t.name}</h4>
                      <span className={`badge ${
                        t.status === 'approved' ? 'badge-success' :
                        t.status === 'ongoing' ? 'badge-live' : 'badge-info'
                      } capitalize`}>{t.status}</span>
                    </div>
                    {t.description && <p className="text-xs text-dark-100/50 mt-1 line-clamp-2">{t.description}</p>}
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-dark-100/40 mt-3 pt-3 border-t border-dark-700/30">
                      <div>Sport: <span className="text-white font-medium capitalize">{t.sport}</span></div>
                      <div>Format: <span className="text-white font-medium capitalize">{t.format?.replace('_', ' ')}</span></div>
                      <div>Deadline: <span className="text-white font-medium">{t.registrationDeadline ? new Date(t.registrationDeadline).toLocaleDateString() : 'N/A'}</span></div>
                      <div>Registered Capacity: <span className="text-white font-medium">{currentRegCount} / {maxCap} teams</span></div>
                      <div>Fee: <span className="text-white font-medium">Rs. {feeAmount}</span></div>
                      <div>Fee Status: <span className={`font-semibold capitalize ${
                        feeStatus === 'paid' ? 'text-green-400' : feeStatus === 'exempt' ? 'text-blue-400' : 'text-yellow-400'
                      }`}>{feeStatus}</span></div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-4">
                    {isRegistered ? (
                      <>
                        {feeAmount > 0 && feeStatus !== 'paid' && (
                          <button
                            onClick={() => handlePayFee(t)}
                            disabled={payingTournamentId === t._id}
                            className="btn-primary w-full justify-center text-xs py-2 bg-emerald-600 hover:bg-emerald-500"
                          >
                            {payingTournamentId === t._id ? 'Processing...' : `Pay Fee (Rs. ${feeAmount})`}
                          </button>
                        )}
                        <button
                          onClick={() => handleUnregister(t._id)}
                          disabled={t.status === 'ongoing' || t.status === 'completed'}
                          className="btn-danger w-full justify-center text-xs py-2 disabled:opacity-50"
                        >
                          Withdraw Team
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleRegister(t._id)}
                        disabled={currentRegCount >= maxCap || hasPassedDeadline || t.status !== 'approved'}
                        className="btn-primary w-full justify-center text-xs py-2 disabled:opacity-50"
                      >
                        {hasPassedDeadline ? 'Deadline Passed' : currentRegCount >= maxCap ? 'Capacity Full' : 'Register Team'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
