import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertTriangle, 
  UserCheck, 
  Play, 
  Navigation, 
  CheckSquare, 
  RefreshCw,
  Phone,
  FileText,
  CreditCard
} from 'lucide-react';

interface AssistanceRequestItem {
  _id: string;
  patientId: {
    _id: string;
    fullName: string;
    preferredName: string;
    phone: string;
    address: string;
  };
  medicationEventId?: {
    _id: string;
    medicationId?: {
      name: string;
      dosage: string;
      instructions: string;
    };
  };
  currentEscalationStage: string;
  status: string;
  priority: string;
  reason: string;
  medicineLocationNotes?: string;
  acceptedBy?: {
    helperName: string;
    helperPhone: string;
    helperType: string;
  };
  approximateArea?: string;
  offers?: Array<{
    _id: string;
    caregiverId: string;
    caregiverName: string;
    caregiverPhone: string;
    hospital?: string;
    department?: string;
    experienceYears?: number;
    rating?: number;
    offeredFee: number;
    estimatedArrival?: string;
    notes?: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    offeredAt: string;
  }>;
  patientConfirmation: boolean;
  caregiverConfirmation: boolean;
  paymentRequired: boolean;
  fee: number;
  createdAt: string;
  updatedAt: string;
}

export const AssistanceMonitoringView: React.FC = () => {
  const [requests, setRequests] = useState<AssistanceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedAuditRequest, setSelectedAuditRequest] = useState<AssistanceRequestItem | null>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);

  const token = typeof window !== 'undefined' ? (localStorage.getItem('ll_token') || localStorage.getItem('token')) : null;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:5000/api/assistance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.data.requests || []);
      } else {
        setError(data.message || 'Failed to fetch assistance requests');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeRequest = requests.find(r => 
    !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.status)
  ) || requests[0];

  const handleRespond = async (requestId: string, action: 'ACCEPT' | 'DECLINE') => {
    try {
      setActionLoading(true);
      const res = await fetch(`http://localhost:5000/api/assistance/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          declineReason: action === 'DECLINE' ? 'Primary caregiver currently unavailable in person' : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        fetchRequests();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvanceState = async (requestId: string, endpoint: string, body: any = {}) => {
    try {
      setActionLoading(true);
      const res = await fetch(`http://localhost:5000/api/assistance/${requestId}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        fetchRequests();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptOffer = async (requestId: string, offerId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`http://localhost:5000/api/assistance/${requestId}/offers/${offerId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Professional caregiver offer accepted! Patient address unlocked for nurse.');
        fetchRequests();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOffer = async (requestId: string, offerId: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`http://localhost:5000/api/assistance/${requestId}/offers/${offerId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Offer declined.');
        fetchRequests();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const viewAuditLogs = async (req: AssistanceRequestItem) => {
    setSelectedAuditRequest(req);
    try {
      const res = await fetch(`http://localhost:5000/api/assistance/${req._id}/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAuditEvents(data.data.events || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const stages = [
    { key: 'PRIMARY_CAREGIVER_ALERTED', label: '1. Primary Alert', color: '#FF7A00' },
    { key: 'ALTERNATIVE_CONTACTS_ALERTED', label: '2. Care Circle', color: '#F59E0B' },
    { key: 'PROFESSIONAL_SEARCH', label: '3. Professional Search', color: '#3B82F6' },
    { key: 'ACCEPTED', label: '4. Helper Accepted', color: '#2563EB' },
    { key: 'ARRIVED', label: '5. Helper Arrived', color: '#8B5CF6' },
    { key: 'ASSISTANCE_STARTED', label: '6. In Progress', color: '#6366F1' },
    { key: 'COMPLETED', label: '7. Completed', color: '#10B981' }
  ];

  const getStageIndex = (stage: string) => {
    const idx = stages.findIndex(s => s.key === stage);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <ShieldAlert size={28} color="var(--primary)" />
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Disability Assistance & Escalation
            </h1>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              backgroundColor: '#FEF3C7', 
              color: '#B45309', 
              padding: '0.2rem 0.6rem', 
              borderRadius: '999px' 
            }}>
              Live Coordination
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Real-time multi-tier coordination when the senior needs physical assistance opening or taking scheduled medications.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {/* Active Assistance Coordination Card */}
      {activeRequest ? (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid #FFEDD5',
          boxShadow: '0 4px 12px rgba(255, 122, 0, 0.08)',
          overflow: 'hidden'
        }}>
          {/* Top Banner */}
          <div style={{
            backgroundColor: '#FFF7ED',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #FFEDD5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: activeRequest.status === 'COMPLETED' ? '#10B981' : '#F97316',
                boxShadow: '0 0 0 4px rgba(249, 115, 22, 0.2)'
              }} />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C2410C', textTransform: 'uppercase' }}>
                  ACTIVE ASSISTANCE REQUEST
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {activeRequest.patientId?.preferredName || 'Paati'} — {activeRequest.medicationEventId?.medicationId?.name || 'Scheduled Medicine'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 800,
                fontSize: '0.8rem',
                backgroundColor: activeRequest.status === 'COMPLETED' ? '#ECFDF5' : '#FEF3C7',
                color: activeRequest.status === 'COMPLETED' ? '#065F46' : '#92400E'
              }}>
                STAGE: {activeRequest.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* 7-Stage Escalation Stepper */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                PROGRESSIVE ESCALATION CHAIN
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.5rem'
              }}>
                {stages.map((st, i) => {
                  const currentIdx = getStageIndex(activeRequest.status);
                  const isPast = i < currentIdx;
                  const isCurrent = i === currentIdx;

                  return (
                    <div
                      key={st.key}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isCurrent ? 'var(--primary)' : isPast ? '#F3F4F6' : '#F9FAFB',
                        color: isCurrent ? '#FFFFFF' : isPast ? '#374151' : '#9CA3AF',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        fontWeight: isCurrent ? 800 : 600,
                        border: isCurrent ? 'none' : '1px solid #E5E7EB'
                      }}
                    >
                      {st.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Request Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              backgroundColor: '#F9FAFB',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                  Stated Physical Need
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1F2937', marginTop: '0.25rem' }}>
                  "{activeRequest.reason}"
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                  Medicine Location in Home
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1F2937', marginTop: '0.25rem' }}>
                  {activeRequest.medicineLocationNotes || 'Bedside medicine organizer'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>
                  Accepted Helper
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: activeRequest.acceptedBy ? 'var(--primary)' : '#6B7280', marginTop: '0.25rem' }}>
                  {activeRequest.acceptedBy ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <UserCheck size={16} />
                      <span>{activeRequest.acceptedBy.helperName} ({activeRequest.acceptedBy.helperType.replace(/_/g, ' ')})</span>
                    </div>
                  ) : (
                    'Waiting for response...'
                  )}
                </div>
              </div>
            </div>

            {/* Professional Caregiver Bids / Offers */}
            {activeRequest.offers && activeRequest.offers.length > 0 && (
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '1rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🩺 Professional Caregiver Offers ({activeRequest.offers.length})</span>
                    <span style={{ fontSize: '0.75rem', background: '#E0E7FF', color: '#3730A3', padding: '2px 8px', borderRadius: '4px' }}>
                      From LL ProCare Network
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Two-Step Privacy Protected</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activeRequest.offers.map((offer) => (
                    <div
                      key={offer._id || offer.caregiverId}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: offer.status === 'ACCEPTED' ? '2px solid #22C55E' : '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0F172A' }}>
                          <span style={{ fontSize: '1rem' }}>{offer.caregiverName}</span>
                          <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                            🏥 {offer.hospital || 'Hospital Network'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#CA8A04' }}>★ {offer.rating || 4.9}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '3px' }}>
                          Department: <strong>{offer.department || 'Geriatric Care'}</strong> • Experience: <strong>{offer.experienceYears || 3} years</strong> • ETA: <strong>{offer.estimatedArrival || '15 mins'}</strong>
                        </div>
                        {offer.notes && (
                          <div style={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic', marginTop: '3px' }}>
                            "{offer.notes}"
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Requested Fee</div>
                          <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.2rem' }}>₹{offer.offeredFee}</div>
                        </div>

                        {offer.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleAcceptOffer(activeRequest._id, offer._id || offer.caregiverId)}
                              disabled={actionLoading}
                              style={{
                                backgroundColor: '#16A34A',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.5rem 1rem',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              ✅ Accept Offer & Share Address (₹{offer.offeredFee})
                            </button>
                            <button
                              onClick={() => handleRejectOffer(activeRequest._id, offer._id || offer.caregiverId)}
                              disabled={actionLoading}
                              style={{
                                backgroundColor: '#FFFFFF',
                                color: '#64748B',
                                border: '1px solid #CBD5E1',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.5rem 0.85rem',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        ) : offer.status === 'ACCEPTED' ? (
                          <span style={{ background: '#22C55E', color: '#FFFFFF', padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 800 }}>
                            ✅ Offer Accepted • Address Unlocked
                          </span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Declined</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Interactive Action Controls (DOE / Real Coordination) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                DISABILITY ASSISTANCE ACTIONS & VERIFICATION
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {activeRequest.status === 'PRIMARY_CAREGIVER_ALERTED' && (
                  <>
                    <button
                      onClick={() => handleRespond(activeRequest._id, 'ACCEPT')}
                      disabled={actionLoading}
                      style={{
                        padding: '0.65rem 1.25rem',
                        backgroundColor: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <UserCheck size={18} />
                      Accept as Primary Caregiver
                    </button>

                    <button
                      onClick={() => handleRespond(activeRequest._id, 'DECLINE')}
                      disabled={actionLoading}
                      style={{
                        padding: '0.65rem 1.25rem',
                        backgroundColor: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <AlertTriangle size={18} />
                      Decline (Trigger Care Circle)
                    </button>
                  </>
                )}

                {activeRequest.status === 'ALTERNATIVE_CONTACTS_ALERTED' && (
                  <button
                    onClick={() => handleAdvanceState(activeRequest._id, 'respond', {
                      action: 'ACCEPT',
                      name: 'Ramesh Kumar (Neighbour)',
                      phone: '+91 98400 22334',
                      role: 'trusted_contact'
                    })}
                    disabled={actionLoading}
                    style={{
                      padding: '0.65rem 1.25rem',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <UserCheck size={18} />
                    Care Circle Contact Accepts (Ramesh Kumar)
                  </button>
                )}

                {activeRequest.status === 'PROFESSIONAL_SEARCH' && (
                  <button
                    onClick={() => handleAdvanceState(activeRequest._id, 'respond', {
                      action: 'ACCEPT',
                      name: 'Sister Lakshmi Narayanan, RN',
                      phone: '+91 98400 77889',
                      role: 'professional_caregiver'
                    })}
                    disabled={actionLoading}
                    style={{
                      padding: '0.65rem 1.25rem',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <UserCheck size={18} />
                    Verified Professional Accepts (Sister Lakshmi, RN)
                  </button>
                )}

                {['ACCEPTED', 'EN_ROUTE'].includes(activeRequest.status) && (
                  <button
                    onClick={() => handleAdvanceState(activeRequest._id, 'arrived')}
                    disabled={actionLoading}
                    style={{
                      padding: '0.65rem 1.25rem',
                      backgroundColor: '#8B5CF6',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <MapPin size={18} />
                    Helper Mark Arrived at Senior Residence
                  </button>
                )}

                {activeRequest.status === 'ARRIVED' && (
                  <button
                    onClick={() => handleAdvanceState(activeRequest._id, 'start')}
                    disabled={actionLoading}
                    style={{
                      padding: '0.65rem 1.25rem',
                      backgroundColor: '#6366F1',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Play size={18} />
                    Start Medication Physical Assistance
                  </button>
                )}

                {activeRequest.status === 'ASSISTANCE_STARTED' && (
                  <button
                    onClick={() => handleAdvanceState(activeRequest._id, 'complete', {
                      completionMethod: 'HANDED_TO_PATIENT',
                      helperNotes: 'Unscrewed child-proof safety cap, poured 1 tablet of Amlodipine 5mg into medicine cup with fresh water.'
                    })}
                    disabled={actionLoading}
                    style={{
                      padding: '0.65rem 1.25rem',
                      backgroundColor: '#16A34A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <CheckSquare size={18} />
                    Complete Assistance (Handed to Senior)
                  </button>
                )}

                {activeRequest.status === 'COMPLETED' && !activeRequest.caregiverConfirmation && (
                  <button
                    onClick={() => handleAdvanceState(activeRequest._id, 'confirm', { userRole: 'CAREGIVER' })}
                    disabled={actionLoading}
                    style={{
                      padding: '0.65rem 1.25rem',
                      backgroundColor: '#059669',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <CheckCircle size={18} />
                    Caregiver Confirm & Close Case
                  </button>
                )}

                <button
                  onClick={() => viewAuditLogs(activeRequest)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    backgroundColor: '#F3F4F6',
                    color: '#374151',
                    border: '1px solid #D1D5DB',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <FileText size={18} />
                  View Audit Trail
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Complete Assistance Requests History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Assistance History & Events ({requests.length})
        </h2>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading requests from database...
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-md)' }}>
            No past assistance requests found.
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Time</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Senior</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Assisted By</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Audit</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                      {req.patientId?.preferredName || 'Paati'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', maxWidth: '300px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#4B5563' }}>
                        {req.reason}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '999px',
                        backgroundColor: req.status === 'COMPLETED' ? '#ECFDF5' : '#FEF3C7',
                        color: req.status === 'COMPLETED' ? '#065F46' : '#92400E'
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {req.acceptedBy ? req.acceptedBy.helperName : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button
                        onClick={() => viewAuditLogs(req)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log Modal */}
      {selectedAuditRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '600px',
            padding: '1.75rem',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 0 }}>
              Immutable Audit Log
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Request ID: {selectedAuditRequest._id}
            </p>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {auditEvents.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#9CA3AF' }}>
                  No audit events recorded for this request.
                </div>
              ) : (
                auditEvents.map((evt, idx) => (
                  <div key={idx} style={{
                    padding: '0.75rem',
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {evt.fromStatus} → {evt.toStatus}
                      </span>
                      <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                        {new Date(evt.timestamp || evt.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ color: '#4B5563' }}>
                      Actor: {evt.actorRole} {evt.note ? `— "${evt.note}"` : ''}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setSelectedAuditRequest(null)}
              style={{
                marginTop: '1rem',
                padding: '0.6rem 1rem',
                backgroundColor: '#F3F4F6',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
