import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getSocket } from '../../utils/socket';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RotateCw, 
  Phone, 
  Pill, 
  Heart, 
  Calendar,
  Send,
  UserCheck,
  Award,
  MessageSquare,
  ExternalLink,
  X,
  ShieldCheck,
  XCircle
} from 'lucide-react';

interface DashboardViewProps {
  onOpenSeniorProfile?: () => void;
  onNavigateToProfessionals?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenSeniorProfile, onNavigateToProfessionals }) => {
  const { activeSenior } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [activeHelpRequests, setActiveHelpRequests] = useState<any[]>([]);

  // Professional Caregivers (LL ProCare Network)
  const [proCaregivers, setProCaregivers] = useState<any[]>([]);
  const [loadingCaregivers, setLoadingCaregivers] = useState(false);
  const [activeChatCaregiver, setActiveChatCaregiver] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  const loadTodayEvents = async () => {
    if (!activeSenior) return;
    try {
      setLoading(true);
      const res = await api.get(`/medication-events/today/${activeSenior._id}`);
      if (res.success) {
        setEvents(res.data.events || []);
      }
    } catch (err: any) {
      console.error('[DashboardView] Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHelpRequests = async () => {
    try {
      const res = await api.get('/assistance');
      if (res.success && res.data.requests) {
        const active = res.data.requests.filter((r: any) =>
          !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.status)
        );
        setActiveHelpRequests(active);
      }
    } catch {
      // ignore
    }
  };

  const loadProCaregivers = async () => {
    try {
      setLoadingCaregivers(true);
      const res = await api.get('/professional-caregivers');
      if (res.success && res.data?.caregivers) {
        setProCaregivers(res.data.caregivers);
      }
    } catch (err: any) {
      console.error('[DashboardView] Failed to load caregivers:', err);
    } finally {
      setLoadingCaregivers(false);
    }
  };

  const handleReviewCaregiver = async (caregiverId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await api.post(`/professional-caregivers/${caregiverId}/review`, { action });
      if (res.success) {
        setActionMessage(action === 'APPROVE' ? 'Caregiver verified and accepted!' : 'Caregiver application rejected.');
        loadProCaregivers();
        setTimeout(() => setActionMessage(null), 3500);
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert('Error updating review: ' + err.message);
    }
  };

  const handleOpenChat = async (caregiver: any) => {
    setActiveChatCaregiver(caregiver);
    try {
      const res = await api.get(`/professional-caregivers/${caregiver._id}/messages`);
      if (res.success) {
        setChatMessages(res.data?.messages || []);
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatCaregiver || !chatInput.trim()) return;
    try {
      setSendingChat(true);
      const res = await api.post(`/professional-caregivers/${activeChatCaregiver._id}/messages`, {
        text: chatInput.trim(),
        senderRole: 'family_monitor',
        senderName: 'Family Caregiver / Monitor',
        senderPhone: '+91 98400 12345'
      });
      if (res.success) {
        setChatMessages(prev => [...prev, res.data.message]);
        setChatInput('');
      }
    } catch (err: any) {
      alert('Error sending message: ' + err.message);
    } finally {
      setSendingChat(false);
    }
  };

  useEffect(() => {
    loadTodayEvents();
    loadHelpRequests();
    loadProCaregivers();

    const socket = getSocket();
    if (activeSenior?._id) {
      socket.emit('subscribe_patient', activeSenior._id);
    }

    const handlePatientUpdate = (data: any) => {
      console.log('[DashboardView] Real-time patient update received:', data);
      loadTodayEvents();
      loadHelpRequests();
      loadProCaregivers();
    };

    const handleCaregiverMsg = (data: any) => {
      if (activeChatCaregiver && data.caregiverId === activeChatCaregiver._id) {
        setChatMessages(prev => [...prev, data.message]);
      }
    };

    socket.on('patient_update', handlePatientUpdate);
    socket.on('notification', handlePatientUpdate);
    socket.on('caregiver_message', handleCaregiverMsg);
    socket.on('caregiver_registered', loadProCaregivers);

    const helpPoll = setInterval(() => {
      loadHelpRequests();
      loadProCaregivers();
    }, 4500);

    return () => {
      socket.off('patient_update', handlePatientUpdate);
      socket.off('notification', handlePatientUpdate);
      socket.off('caregiver_message', handleCaregiverMsg);
      socket.off('caregiver_registered', loadProCaregivers);
      clearInterval(helpPoll);
    };
  }, [activeSenior?._id, activeChatCaregiver?._id]);

  const handleAcceptHelp = async (requestId: string) => {
    try {
      const res = await api.post(`/assistance/${requestId}/respond`, { action: 'ACCEPT' });
      if (res.success) {
        setActionMessage('You accepted the assistance request! Patient and Care Circle notified.');
        loadHelpRequests();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Error accepting request: ' + err.message);
    }
  };

  const handleDeclineHelp = async (requestId: string) => {
    try {
      const res = await api.post(`/assistance/${requestId}/respond`, {
        action: 'DECLINE',
        declineReason: 'Primary caregiver currently away from home'
      });
      if (res.success) {
        setActionMessage('Request escalated to Care Circle neighbours.');
        loadHelpRequests();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Error escalating request: ' + err.message);
    }
  };

  const handleAcceptOffer = async (requestId: string, offerId: string) => {
    try {
      const res = await api.post(`/assistance/${requestId}/offers/${offerId}/accept`);
      if (res.success) {
        setActionMessage('Professional caregiver offer accepted! Contact & address shared.');
        loadHelpRequests();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Error accepting offer: ' + err.message);
    }
  };

  const handleRejectOffer = async (requestId: string, offerId: string) => {
    try {
      const res = await api.post(`/assistance/${requestId}/offers/${offerId}/reject`);
      if (res.success) {
        setActionMessage('Offer declined.');
        loadHelpRequests();
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err: any) {
      alert('Error declining offer: ' + err.message);
    }
  };

  const handleResendReminder = async (eventId: string) => {
    try {
      setResendingId(eventId);
      const res = await api.post(`/medication-events/${eventId}/resend-reminder`);
      if (res.success) {
        setActionMessage('Reminder successfully resent to senior’s phone!');
        setTimeout(() => setActionMessage(null), 3500);
        loadTodayEvents();
      }
    } catch (err: any) {
      alert('Error resending reminder: ' + err.message);
    } finally {
      setResendingId(null);
    }
  };

  if (!activeSenior) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <Heart size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
        <h3>No Senior Profile Selected</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Please create or link a senior profile from the Senior Profiles tab.
        </p>
      </div>
    );
  }

  // Calculate statistics
  const total = events.length;
  const taken = events.filter(e => ['TAKEN', 'LATE'].includes(e.status)).length;
  const pendingConfirmation = events.filter(e => e.status === 'PENDING_CONFIRMATION');
  const upcoming = events.filter(e => ['UPCOMING', 'DUE'].includes(e.status));
  const progressPercent = total > 0 ? Math.round((taken / total) * 100) : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Real-time Physical Assistance Alerts from Patient Mode */}
      {activeHelpRequests.map(help => (
        <div
          key={help._id}
          className="card pulse-emergency"
          style={{
            backgroundColor: '#FEF2F2',
            border: '2px solid #EF4444',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            padding: '1.25rem',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🚨</span>
              <div>
                <h4 style={{ color: '#B91C1C', margin: 0, fontWeight: 800, fontSize: '1.15rem' }}>
                  Physical Assistance Needed by {activeSenior.preferredName || activeSenior.fullName}!
                </h4>
                <p style={{ color: '#991B1B', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                  Status: <strong style={{ textTransform: 'uppercase' }}>{help.status.replace(/_/g, ' ')}</strong>
                </p>
              </div>
            </div>
            <span style={{ backgroundColor: '#DC2626', color: '#FFFFFF', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800 }}>
              Live Help Request
            </span>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
            <div style={{ color: '#1F2937', fontWeight: 600 }}>
              <strong>Reason / Help Description:</strong> {help.reason}
            </div>
            {help.medicineLocationNotes && (
              <div style={{ marginTop: '4px', fontSize: '0.85rem', color: '#4B5563' }}>
                <strong>Medicine Location in House:</strong> {help.medicineLocationNotes}
              </div>
            )}
          </div>

          {/* Incoming Professional Nurse Offers */}
          {help.offers && help.offers.length > 0 && (
            <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🩺 Professional Caregiver Offers ({help.offers.length})</span>
                <span style={{ fontSize: '0.75rem', background: '#E0E7FF', color: '#3730A3', padding: '2px 8px', borderRadius: '4px' }}>From LL ProCare Network</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {help.offers.map((offer: any) => (
                  <div
                    key={offer._id || offer.caregiverId}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: offer.status === 'ACCEPTED' ? '2px solid #22C55E' : '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0F172A' }}>
                        <span>{offer.caregiverName}</span>
                        <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                          🏥 {offer.hospital || 'Hospital Caregiver'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: '#CA8A04' }}>★ {offer.rating || 4.9}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                        Dept: {offer.department || 'Geriatric Care'} • Exp: {offer.experienceYears || 3} yrs • ETA: {offer.estimatedArrival || '15 mins'}
                      </div>
                      {offer.notes && (
                        <div style={{ fontSize: '0.8rem', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                          "{offer.notes}"
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem', marginRight: '4px' }}>
                        ₹{offer.offeredFee}
                      </div>
                      {offer.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleAcceptOffer(help._id, offer._id || offer.caregiverId)}
                            className="btn btn-primary"
                            style={{ backgroundColor: '#16A34A', border: 'none', padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }}
                          >
                            ✅ Accept Nurse (₹{offer.offeredFee})
                          </button>
                          <button
                            onClick={() => handleRejectOffer(help._id, offer._id || offer.caregiverId)}
                            className="btn btn-outline"
                            style={{ color: '#64748B', borderColor: '#CBD5E1', padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                          >
                            Decline
                          </button>
                        </>
                      ) : offer.status === 'ACCEPTED' ? (
                        <span style={{ background: '#22C55E', color: '#FFFFFF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                          ✅ Accepted • Address Unlocked
                        </span>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Declined</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleAcceptHelp(help._id)}
              className="btn btn-primary"
              style={{ backgroundColor: '#16A34A', border: 'none', padding: '0.65rem 1.25rem' }}
            >
              ✅ I Will Assist (Family Accept)
            </button>
            <button
              onClick={() => handleDeclineHelp(help._id)}
              className="btn btn-outline"
              style={{ color: '#DC2626', borderColor: '#DC2626', backgroundColor: '#FFFFFF', padding: '0.65rem 1.25rem' }}
            >
              ⏩ Escalate to Care Circle Neighbors
            </button>
          </div>
        </div>
      ))}

      {/* Toast Notification */}
      {actionMessage && (
        <div style={{
          backgroundColor: 'var(--success-bg)',
          color: 'var(--success)',
          border: '1px solid var(--success)',
          padding: '0.9rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Senior Overview Card & Adherence Progress Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Profile Card */}
        {/* Enhanced Senior Profile Home Card */}
        <div className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.9rem',
            flexShrink: 0,
            boxShadow: '0 6px 18px rgba(255, 122, 0, 0.25)',
            border: '3px solid #FFFFFF'
          }}>
            {activeSenior.preferredName ? activeSenior.preferredName[0] : activeSenior.fullName[0]}
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.35rem', margin: 0, color: 'var(--text-main)' }}>
                {activeSenior.preferredName || activeSenior.fullName}
              </h2>
              <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
                {activeSenior.age} yrs
              </span>
              <span className={`badge ${activeSenior.linkedUserId ? 'badge-taken' : 'badge-pending'}`}>
                {activeSenior.linkedUserId ? 'Phone Paired' : 'Awaiting Pairing'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Care Status: <strong style={{ color: 'var(--text-main)' }}>{activeSenior.mobilityStatus || 'Walks with support'}</strong>
              {activeSenior.visionStatus && ` • ${activeSenior.visionStatus}`}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
              Next Medication: <strong style={{ color: 'var(--primary)' }}>{upcoming.length > 0 ? (upcoming[0].medicationId?.name || 'Scheduled Dose') : 'All done for now'}</strong>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              {onOpenSeniorProfile && (
                <button
                  onClick={onOpenSeniorProfile}
                  className="btn btn-primary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', fontWeight: 700 }}
                >
                  <UserCheck size={14} />
                  <span>Quick Profile & QR</span>
                </button>
              )}
              <a
                href={`tel:${activeSenior.emergencyContactPhone}`}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
              >
                <Phone size={14} color="var(--primary)" />
                <span>Call Phone</span>
              </a>
              <button
                onClick={loadTodayEvents}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                title="Refresh schedule"
              >
                <RotateCw size={14} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Adherence Progress Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
              Today's Medication Progress
            </span>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
              {progressPercent}%
            </span>
          </div>

          {/* Progress Bar */}
          <div style={{
            height: '12px',
            backgroundColor: 'var(--bg-warm)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: progressPercent === 100 ? 'var(--success)' : 'var(--primary)',
              borderRadius: '999px',
              transition: 'width 0.5s ease'
            }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)' }}>{taken}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TAKEN</div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--warning)' }}>{pendingConfirmation.length}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>PENDING ALERT</div>
            </div>
            <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{upcoming.length}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>UPCOMING</div>
            </div>
          </div>
        </div>
      </div>

      {/* URGENT 5-MINUTE NO RESPONSE ALERT BANNER */}
      {pendingConfirmation.length > 0 && (
        <div style={{
          backgroundColor: '#FEF2F2',
          border: '2px solid #EF4444',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <AlertCircle color="#DC2626" size={24} />
            <h3 style={{ color: '#DC2626', margin: 0, fontSize: '1.15rem' }}>
              Action Needed: Senior has not confirmed medication ({pendingConfirmation.length} dose)
            </h3>
          </div>
          <p style={{ color: '#7F1D1D', fontSize: '0.92rem', marginBottom: '1rem' }}>
            More than 5 minutes have elapsed since the scheduled reminder time without confirmation from {activeSenior.preferredName || activeSenior.fullName}. Please call to check in or resend the phone notification.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingConfirmation.map(ev => {
              const med = ev.medicationId;
              const schedTime = new Date(ev.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={ev._id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid #FCA5A5'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Pill size={20} color="#DC2626" />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {med?.name} ({med?.dose} {med?.unit})
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Scheduled for {schedTime} • Instructions: {med?.foodRelation || 'After food'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                      href={`tel:${activeSenior.emergencyContactPhone}`}
                      className="btn btn-primary"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                    >
                      <Phone size={14} />
                      <span>Call Senior</span>
                    </a>
                    <button
                      onClick={() => handleResendReminder(ev._id)}
                      disabled={resendingId === ev._id}
                      className="btn btn-secondary"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                    >
                      <Send size={14} />
                      <span>{resendingId === ev._id ? 'Sending...' : 'Resend Reminder'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PROFESSIONAL CAREGIVER NETWORK (LL ProCare Applicants) */}
      <div className="card" style={{
        border: '1px solid #CBD5E1',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{
                backgroundColor: '#CCFBF1',
                color: '#0F766E',
                padding: '6px',
                borderRadius: '8px',
                display: 'inline-flex'
              }}>
                <Award size={20} />
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Professional Caregiver Network
              </h3>
              <span style={{
                backgroundColor: '#E0F2FE',
                color: '#0369A1',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                LL ProCare Synced (Port 3001)
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', color: '#64748B', fontSize: '0.86rem', maxWidth: '800px' }}>
              Nurses and caregivers who registered their clinical profiles and visiting rates on <strong>LL ProCare</strong>. Review their credentials below, <strong>Accept</strong> or <strong>Reject</strong> them for senior home care, or chat directly.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {onNavigateToProfessionals && (
              <button
                onClick={onNavigateToProfessionals}
                className="btn btn-outline"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }}
              >
                View Full Network Directory →
              </button>
            )}
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <span>LL ProCare Portal</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {loadingCaregivers ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>
            Loading professional caregivers...
          </div>
        ) : proCaregivers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
            No registered professional caregivers yet. Caregivers can upload their profile and rates on LL ProCare.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {proCaregivers.map((cg) => {
              const isApproved = cg.verificationStatus === 'VERIFIED';
              const isPending = cg.verificationStatus === 'PENDING_VERIFICATION' || !cg.verificationStatus;
              const isRejected = cg.verificationStatus === 'REJECTED';

              return (
                <div
                  key={cg._id}
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: `1.5px solid ${isApproved ? '#86EFAC' : isPending ? '#FCD34D' : '#FCA5A5'}`,
                    borderRadius: '14px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                  }}
                >
                  <div>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          backgroundColor: '#0D9488',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {cg.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>
                            {cg.fullName}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#0D9488', fontWeight: 700 }}>
                            🏥 {cg.hospital || 'Apollo Hospitals'}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F172A' }}>
                          ₹{cg.fixedAssistanceFee || 350}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                          per home visit
                        </div>
                      </div>
                    </div>

                    {/* Details row */}
                    <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                      <strong>Role:</strong> {cg.professionalRole || 'Geriatric Nurse'} • <strong>Exp:</strong> {cg.experienceYears || 5} yrs<br />
                      <strong>Area:</strong> {cg.serviceArea || 'Chennai'} ({cg.serviceRadiusKm || 10} km radius)<br />
                      <strong>Phone:</strong> {cg.phone}
                    </div>

                    {cg.credentialsSummary && (
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#64748B',
                        backgroundColor: '#FFFFFF',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        marginBottom: '0.75rem'
                      }}>
                        📄 {cg.credentialsSummary}
                      </div>
                    )}

                    {/* Status Badge */}
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        backgroundColor: isApproved ? '#DCFCE7' : isPending ? '#FEF3C7' : '#FEE2E2',
                        color: isApproved ? '#166534' : isPending ? '#92400E' : '#991B1B'
                      }}>
                        {isApproved && <CheckCircle2 size={13} />}
                        {isPending && <Clock size={13} />}
                        {isRejected && <XCircle size={13} />}
                        <span>
                          {isApproved ? 'Approved & Authorized' : isPending ? 'Pending Family Review' : 'Application Rejected'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}>
                    {!isApproved && (
                      <button
                        onClick={() => handleReviewCaregiver(cg._id, 'APPROVE')}
                        className="btn btn-primary"
                        style={{
                          backgroundColor: '#16A34A',
                          border: 'none',
                          padding: '0.45rem 0.85rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          flex: 1
                        }}
                      >
                        ✅ Accept
                      </button>
                    )}

                    {isApproved && (
                      <button
                        onClick={() => handleReviewCaregiver(cg._id, 'REJECT')}
                        className="btn btn-outline"
                        style={{
                          borderColor: '#EF4444',
                          color: '#DC2626',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.82rem',
                          fontWeight: 700
                        }}
                      >
                        Revoke / Reject
                      </button>
                    )}

                    {!isApproved && !isRejected && (
                      <button
                        onClick={() => handleReviewCaregiver(cg._id, 'REJECT')}
                        className="btn btn-outline"
                        style={{
                          borderColor: '#EF4444',
                          color: '#DC2626',
                          padding: '0.45rem 0.75rem',
                          fontSize: '0.82rem',
                          fontWeight: 700
                        }}
                      >
                        Reject
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenChat(cg)}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.45rem 0.85rem',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>Chat / Message</span>
                    </button>

                    <a
                      href={`tel:${cg.phone}`}
                      className="btn btn-secondary"
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                      title="Call phone directly"
                    >
                      <Phone size={13} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIRECT CHAT & MESSAGING MODAL */}
      {activeChatCaregiver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💬 Direct Message:</span>
                  <span>{activeChatCaregiver.fullName}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '2px' }}>
                  🏥 {activeChatCaregiver.hospital || 'Apollo Hospitals'} • Visiting Rate: ₹{activeChatCaregiver.fixedAssistanceFee || 350}
                </div>
              </div>
              <button
                onClick={() => setActiveChatCaregiver(null)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Feed */}
            <div style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              backgroundColor: '#F1F5F9',
              minHeight: '280px',
              maxHeight: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: '#64748B', fontSize: '0.88rem' }}>
                  No messages yet. Send a message to coordinate senior assistance, timings, or visiting rates with {activeChatCaregiver.fullName}!
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMonitor = msg.senderRole === 'family_monitor';
                  return (
                    <div
                      key={msg._id || i}
                      style={{
                        alignSelf: isMonitor ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        backgroundColor: isMonitor ? '#0284C7' : '#FFFFFF',
                        color: isMonitor ? '#FFFFFF' : '#0F172A',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.06)'
                      }}
                    >
                      <div style={{
                        fontSize: '0.72rem',
                        color: isMonitor ? '#BAE6FD' : '#64748B',
                        fontWeight: 700,
                        marginBottom: '2px'
                      }}>
                        {msg.senderName} ({isMonitor ? 'You / Monitor' : 'Caregiver'})
                      </div>
                      <div style={{ fontSize: '0.92rem', lineHeight: '1.4' }}>
                        {msg.text}
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        color: isMonitor ? '#E0F2FE' : '#94A3B8',
                        textAlign: 'right',
                        marginTop: '4px'
                      }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              gap: '0.6rem'
            }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Message ${activeChatCaregiver.fullName}...`}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  fontSize: '0.92rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 1.25rem',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Send size={15} />
                <span>{sendingChat ? 'Sending...' : 'Send'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TODAY'S MEDICATION SCHEDULE LIST */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Today's Scheduled Medication Events</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Real-time synchronization with senior's mobile device
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading schedule updates...
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No medication events scheduled for today. Add medications or schedules in the Medications tab.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {events.map(ev => {
              const med = ev.medicationId;
              const timeStr = new Date(ev.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              let badgeClass = 'badge-due';
              if (ev.status === 'TAKEN' || ev.status === 'LATE') badgeClass = 'badge-taken';
              if (ev.status === 'PENDING_CONFIRMATION') badgeClass = 'badge-pending';
              if (ev.status === 'MISSED' || ev.status === 'NOT_TAKEN') badgeClass = 'badge-missed';

              return (
                <div
                  key={ev._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-warm)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)',
                      flexShrink: 0
                    }}>
                      <Pill size={22} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                          {med?.name}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {med?.dose} {med?.unit}
                        </span>
                        <span className={`badge ${badgeClass}`}>
                          {ev.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Scheduled: <strong>{timeStr}</strong> • Food: {med?.foodRelation || 'After food'}
                        {ev.takenAt && ` • Taken at: ${new Date(ev.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        {ev.resendCount > 0 && ` • Resent (${ev.resendCount}x)`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {ev.status === 'TAKEN' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem' }}>
                        <CheckCircle2 size={18} />
                        <span>Confirmed Taken</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleResendReminder(ev._id)}
                        disabled={resendingId === ev._id}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem' }}
                        title="Resend notification to senior's phone"
                      >
                        <Send size={13} />
                        <span>{resendingId === ev._id ? 'Sending...' : 'Resend'}</span>
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
};
