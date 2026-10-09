import React, { useState, useEffect } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  FileCheck, 
  UserCheck, 
  PlusCircle,
  IndianRupee,
  Briefcase,
  Phone,
  MessageSquare,
  Send,
  ExternalLink,
  X,
  XCircle
} from 'lucide-react';

interface CaregiverMessageItem {
  _id: string;
  caregiverId: string;
  senderRole: string;
  senderName: string;
  senderPhone?: string;
  text: string;
  createdAt: string;
}

interface ProfessionalCaregiverItem {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  serviceArea: string;
  serviceRadiusKm: number;
  professionalRole: string;
  experienceYears: number;
  credentialsSummary: string;
  hospital?: string;
  department?: string;
  rating?: number;
  reviewsCount?: number;
  verificationStatus: string;
  isAvailable: boolean;
  fixedAssistanceFee: number;
}

export const ProfessionalCaregiverPortalView: React.FC = () => {
  const [professionals, setProfessionals] = useState<ProfessionalCaregiverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Messaging State
  const [activeChatCaregiver, setActiveChatCaregiver] = useState<ProfessionalCaregiverItem | null>(null);
  const [chatMessages, setChatMessages] = useState<CaregiverMessageItem[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const token = typeof window !== 'undefined' ? (localStorage.getItem('ll_token') || localStorage.getItem('token')) : null;

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:5000/api/professional-caregivers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setProfessionals(data.data.caregivers || []);
      } else {
        setError(data.message || 'Failed to load caregivers');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const handleReviewCaregiver = async (caregiverId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`http://localhost:5000/api/professional-caregivers/${caregiverId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(action === 'APPROVE' ? 'Caregiver verified and accepted for patient care!' : 'Caregiver application rejected.');
        fetchProfessionals();
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert('Error updating review: ' + err.message);
    }
  };

  const handleOpenChat = async (caregiver: ProfessionalCaregiverItem) => {
    setActiveChatCaregiver(caregiver);
    try {
      const res = await fetch(`http://localhost:5000/api/professional-caregivers/${caregiver._id}/messages`);
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatCaregiver || !messageInput.trim()) return;

    try {
      setSendingMessage(true);
      const res = await fetch(`http://localhost:5000/api/professional-caregivers/${activeChatCaregiver._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: messageInput.trim(),
          senderRole: 'family_monitor',
          senderName: 'Family Caregiver / Monitor',
          senderPhone: '+91 98400 12345'
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, data.data.message]);
        setMessageInput('');
      }
    } catch (err: any) {
      alert('Error sending message: ' + err.message);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        color: '#FFFFFF',
        padding: '1.75rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🩺</span>
            <h2 style={{ color: '#FFFFFF', margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              Professional Caregiver & Nurse Network
            </h2>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0, maxWidth: '750px' }}>
            Monitor and review verified nurses and home care aides. Caregivers upload their profiles and visiting rates on the dedicated <strong>LL ProCare Portal</strong>. As the family monitor, you can review credentials, accept or reject them, and message them directly.
          </p>
        </div>

        <div>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{
              backgroundColor: '#0D9488',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.75rem 1.25rem',
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.4)'
            }}
          >
            <span>Open LL ProCare Portal (Port 3001)</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Flash Messages */}
      {successMsg && (
        <div style={{
          backgroundColor: '#DCFCE7',
          color: '#166534',
          border: '1px solid #86EFAC',
          padding: '0.9rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          border: '1px solid #FCA5A5',
          padding: '0.9rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 700
        }}>
          {error}
        </div>
      )}

      {/* Main Caregivers List for Family Monitor */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, color: 'var(--text-main)', fontSize: '1.2rem' }}>
              Registered Professional Caregivers ({professionals.length})
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
              Profiles and visiting rates synced directly from LL ProCare central network.
            </p>
          </div>

          <button onClick={fetchProfessionals} className="btn btn-outline" style={{ fontSize: '0.85rem' }}>
            🔄 Refresh Caregiver List
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading professional caregiver network...
          </div>
        ) : professionals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Award size={48} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
            <h4>No Professional Caregivers Registered Yet</h4>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Caregivers can register and upload their credentials at <a href="http://localhost:3001" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 700 }}>http://localhost:3001 (LL ProCare)</a>.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {professionals.map(caregiver => {
              const isApproved = caregiver.verificationStatus === 'VERIFIED';
              const isRejected = caregiver.verificationStatus === 'REJECTED';
              const isPending = !isApproved && !isRejected;

              return (
                <div
                  key={caregiver._id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: isApproved ? '2px solid #22C55E' : isRejected ? '1px solid #EF4444' : '1.5px solid #F59E0B',
                    borderRadius: '12px',
                    padding: '1.35rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  {/* Top Bar: Identity & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem'
                      }}>
                        {caregiver.fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: '#0F172A' }}>
                            {caregiver.fullName}
                          </h4>
                          {isApproved && (
                            <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                              ✓ Approved by Monitor
                            </span>
                          )}
                          {isPending && (
                            <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                              ⏳ Pending Monitor Review
                            </span>
                          )}
                          {isRejected && (
                            <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                              ✕ Rejected
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                          <strong>{caregiver.professionalRole}</strong> • {caregiver.experienceYears} Years Clinical Exp
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                        Requested Visiting Rate
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0F172A' }}>
                        ₹{caregiver.fixedAssistanceFee} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>/ visit</span>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.75rem',
                    backgroundColor: '#F8FAFC',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Hospital Affiliation</span>
                      <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>🏥 {caregiver.hospital || 'Apollo Hospitals, Greams Rd'}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Clinical Department</span>
                      <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>🩺 {caregiver.department || 'Geriatric Care & Critical Nursing'}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Mobile Contact Phone</span>
                      <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>📞 {caregiver.phone}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>Patient Rating & Trust Score</span>
                      <strong style={{ fontSize: '0.9rem', color: '#CA8A04' }}>★ {caregiver.rating || 4.9} / 5.0 ({caregiver.reviewsCount || 38} reviews)</strong>
                    </div>
                  </div>

                  {/* Credentials / Bio */}
                  {caregiver.credentialsSummary && (
                    <div style={{ fontSize: '0.85rem', color: '#334155', fontStyle: 'italic', backgroundColor: '#F1F5F9', padding: '0.65rem 0.85rem', borderRadius: '6px' }}>
                      "{caregiver.credentialsSummary}"
                    </div>
                  )}

                  {/* Monitor Actions: Accept, Reject, Chat, Direct Call */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleReviewCaregiver(caregiver._id, 'APPROVE')}
                        className="btn btn-primary"
                        style={{
                          backgroundColor: '#16A34A',
                          border: 'none',
                          padding: '0.55rem 1.15rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <UserCheck size={16} />
                        <span>Accept & Authorize (₹{caregiver.fixedAssistanceFee})</span>
                      </button>

                      <button
                        onClick={() => handleReviewCaregiver(caregiver._id, 'REJECT')}
                        className="btn btn-outline"
                        style={{
                          color: '#DC2626',
                          borderColor: '#FCA5A5',
                          padding: '0.55rem 1rem',
                          fontSize: '0.85rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <XCircle size={16} />
                        <span>Reject</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenChat(caregiver)}
                        className="btn btn-outline"
                        style={{
                          backgroundColor: '#EEF2FF',
                          color: '#4F46E5',
                          borderColor: '#C7D2FE',
                          padding: '0.55rem 1rem',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <MessageSquare size={16} />
                        <span>Direct Messages & Chat</span>
                      </button>

                      <a
                        href={`tel:${caregiver.phone.replace(/\s+/g, '')}`}
                        className="btn btn-outline"
                        style={{
                          color: '#0F172A',
                          padding: '0.55rem 0.85rem',
                          fontSize: '0.85rem',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <Phone size={15} />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Direct Messaging Chat Modal */}
      {activeChatCaregiver && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '80vh',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F8FAFC'
            }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#0F172A' }}>
                  💬 Communication with {activeChatCaregiver.fullName}
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                  {activeChatCaregiver.hospital || 'Apollo Hospitals'} • {activeChatCaregiver.phone}
                </p>
              </div>

              <button
                onClick={() => setActiveChatCaregiver(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages Feed */}
            <div style={{
              padding: '1.25rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              backgroundColor: '#F1F5F9',
              minHeight: '260px'
            }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: '#64748B', fontSize: '0.9rem' }}>
                  No messages yet. Send a message to coordinate care instructions, medications, or visit times.
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMonitor = msg.senderRole === 'family_monitor';
                  return (
                    <div
                      key={msg._id}
                      style={{
                        alignSelf: isMonitor ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        backgroundColor: isMonitor ? '#0D9488' : '#FFFFFF',
                        color: isMonitor ? '#FFFFFF' : '#0F172A',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', color: isMonitor ? '#CCFBF1' : '#64748B', fontWeight: 700, marginBottom: '2px' }}>
                        {msg.senderName}
                      </div>
                      <div style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: isMonitor ? '#99F6E4' : '#94A3B8', textAlign: 'right', marginTop: '4px' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} style={{ padding: '1rem', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.5rem', backgroundColor: '#FFFFFF' }}>
              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Type your message to the caregiver..."
                style={{
                  flex: 1,
                  padding: '0.7rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={sendingMessage || !messageInput.trim()}
                className="btn btn-primary"
                style={{
                  backgroundColor: '#0D9488',
                  border: 'none',
                  padding: '0.7rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700
                }}
              >
                <Send size={16} />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
