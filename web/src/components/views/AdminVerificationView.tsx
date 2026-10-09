import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Search,
  UserCheck,
  RefreshCw,
  Eye
} from 'lucide-react';

interface CaregiverToVerify {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
  professionalRole: string;
  experienceYears: number;
  credentialsSummary: string;
  verificationStatus: string;
  address: string;
  serviceArea: string;
  verificationDocuments: Array<{
    title: string;
    docType: string;
    url: string;
  }>;
}

export const AdminVerificationView: React.FC = () => {
  const [caregivers, setCaregivers] = useState<CaregiverToVerify[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const token = typeof window !== 'undefined' ? (localStorage.getItem('ll_token') || localStorage.getItem('token')) : null;

  const fetchCaregivers = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/professional-caregivers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCaregivers(data.data.caregivers || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'VERIFIED' | 'REJECTED' | 'SUSPENDED') => {
    const note = prompt(`Enter review notes for setting status to ${newStatus}:`, 'Credentials and background verified by administrator.');
    if (note === null) return;

    try {
      setActionLoading(true);
      const res = await fetch(`http://localhost:5000/api/professional-caregivers/${id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newStatus,
          verificationNotes: note
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Status updated to ${newStatus}. Immutable audit log created.`);
        fetchCaregivers();
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

  const filteredCaregivers = caregivers.filter(c => {
    if (statusFilter === 'ALL') return true;
    return c.verificationStatus === statusFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Activity size={28} color="var(--primary)" />
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Platform Administrator Portal
            </h1>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              backgroundColor: '#FEF3C7', 
              color: '#B45309', 
              padding: '0.2rem 0.6rem', 
              borderRadius: '999px' 
            }}>
              Verification & Safety Controls
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Inspect legal credentials, approve certified caregivers, review safety logs, and enforce production non-repudiation.
          </p>
        </div>

        <button
          onClick={fetchCaregivers}
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
          Refresh Verification Queue
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        {['ALL', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'SUSPENDED'].map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: statusFilter === st ? 'var(--primary)' : 'transparent',
              color: statusFilter === st ? '#FFFFFF' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Verification Queue Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading verification records...
        </div>
      ) : filteredCaregivers.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-lg)' }}>
          No caregivers matching filter: {statusFilter}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredCaregivers.map(c => {
            const isPending = c.verificationStatus === 'PENDING_VERIFICATION';
            const isVerified = c.verificationStatus === 'VERIFIED';

            return (
              <div
                key={c._id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: isPending ? '2px solid #FDE68A' : '1px solid var(--border)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        backgroundColor: isVerified ? '#ECFDF5' : isPending ? '#FEF3C7' : '#FEF2F2',
                        color: isVerified ? '#065F46' : isPending ? '#92400E' : '#991B1B',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        {isVerified ? <CheckCircle size={14} /> : isPending ? <Clock size={14} /> : <XCircle size={14} />}
                        {c.verificationStatus.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                        ID: {c._id}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem', marginBottom: '0.2rem' }}>
                      {c.fullName}
                    </h3>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
                      {c.professionalRole} ({c.experienceYears} Years Experience)
                    </div>
                  </div>

                  {/* Admin Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {c.verificationStatus !== 'VERIFIED' && (
                      <button
                        onClick={() => handleUpdateStatus(c._id, 'VERIFIED')}
                        disabled={actionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
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
                        <CheckCircle size={16} />
                        Approve & Verify
                      </button>
                    )}

                    {c.verificationStatus !== 'REJECTED' && (
                      <button
                        onClick={() => handleUpdateStatus(c._id, 'REJECTED')}
                        disabled={actionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#DC2626',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.5rem 1rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    )}

                    {c.verificationStatus === 'VERIFIED' && (
                      <button
                        onClick={() => handleUpdateStatus(c._id, 'SUSPENDED')}
                        disabled={actionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          backgroundColor: '#F59E0B',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.5rem 1rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        <AlertTriangle size={16} />
                        Suspend Account
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.5 }}>
                  <strong>Credentials Statement:</strong> {c.credentialsSummary}
                </div>

                {/* Verification Documents Submitted */}
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Uploaded Verification Evidence
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {c.verificationDocuments && c.verificationDocuments.length > 0 ? (
                      c.verificationDocuments.map((doc, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.4rem 0.75rem',
                            backgroundColor: '#F3F4F6',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            color: '#374151'
                          }}
                        >
                          <FileText size={16} color="var(--primary)" />
                          <span>{doc.title} ({doc.docType})</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>No documents uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
