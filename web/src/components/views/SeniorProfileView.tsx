import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { 
  User, 
  Heart, 
  Pill, 
  FileText, 
  FolderArchive, 
  History, 
  QrCode, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  Edit3, 
  Save, 
  ExternalLink,
  Eye,
  Activity,
  Phone,
  Clock,
  Sparkles
} from 'lucide-react';

export type SeniorProfileTab = 
  | 'overview' 
  | 'personal' 
  | 'health_condition' 
  | 'medications' 
  | 'prescriptions' 
  | 'documents' 
  | 'history' 
  | 'doctor_qr' 
  | 'privacy';

interface SeniorProfileViewProps {
  initialTab?: SeniorProfileTab;
  onNavigateToTab?: (tab: string) => void;
}

export const SeniorProfileView: React.FC<SeniorProfileViewProps> = ({ 
  initialTab = 'overview',
  onNavigateToTab 
}) => {
  const { activeSenior, setActiveSenior, refreshSeniors, seniors } = useAuth();
  const [activeTab, setActiveTab] = useState<SeniorProfileTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!activeSenior) {
      if (seniors && seniors.length > 0) {
        setActiveSenior(seniors[0]);
      } else {
        refreshSeniors();
      }
    }
  }, [activeSenior, seniors]);

  // Profile data
  const [profileData, setProfileData] = useState<any>(null);
  const [healthCondition, setHealthCondition] = useState<any>(null);
  const [doctorQr, setDoctorQr] = useState<any>(null);
  const [privacySettings, setPrivacySettings] = useState<any>(null);
  const [accessHistory, setAccessHistory] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);

  // Editing state for Personal Info
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({
    fullName: '',
    preferredName: '',
    age: 78,
    gender: 'female',
    phone: '',
    email: '',
    address: '',
    bloodGroup: 'B+',
    emergencyContactName: '',
    emergencyContactPhone: '',
    relationship: 'Daughter',
    secondaryContactName: '',
    secondaryContactPhone: '',
    secondaryRelationship: 'Son'
  });

  // Editing state for Health Condition
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [healthForm, setHealthForm] = useState({
    mobilityStatus: 'Walks with support',
    visionStatus: 'Uses glasses',
    hearingStatus: 'Normal hearing',
    communicationPreference: 'Spoken / Friendly',
    knownAllergies: '' as string, // comma separated for input
    importantHealthConditions: '' as string,
    dietaryRestrictions: '' as string,
    specialCareNotes: ''
  });

  const loadAllProfileData = async () => {
    if (!activeSenior?._id) return;
    try {
      setLoading(true);
      const patientId = activeSenior._id;

      // 1. Patient profile
      const patientRes = await api.get(`/patients/${patientId}`);
      if (patientRes.success) {
        const p = patientRes.data.patient;
        setProfileData(p);
        setPersonalForm({
          fullName: p.fullName || '',
          preferredName: p.preferredName || '',
          age: p.age || 75,
          gender: p.gender || 'female',
          phone: p.phone || '',
          email: p.email || '',
          address: p.address || '',
          bloodGroup: p.bloodGroup || 'B+',
          emergencyContactName: p.emergencyContactName || '',
          emergencyContactPhone: p.emergencyContactPhone || '',
          relationship: p.relationship || 'Primary Caregiver',
          secondaryContactName: p.secondaryContactName || '',
          secondaryContactPhone: p.secondaryContactPhone || '',
          secondaryRelationship: p.secondaryRelationship || 'Secondary Contact'
        });
      }

      // 2. Health condition
      const healthRes = await api.get(`/patients/${patientId}/health-condition`);
      if (healthRes.success) {
        const h = healthRes.data.healthCondition;
        setHealthCondition(h);
        setHealthForm({
          mobilityStatus: h.mobilityStatus || 'Walks with support',
          visionStatus: h.visionStatus || 'Uses glasses',
          hearingStatus: h.hearingStatus || 'Normal hearing',
          communicationPreference: h.communicationPreference || 'Spoken / Friendly',
          knownAllergies: Array.isArray(h.knownAllergies) ? h.knownAllergies.join(', ') : '',
          importantHealthConditions: Array.isArray(h.importantHealthConditions) ? h.importantHealthConditions.join(', ') : '',
          dietaryRestrictions: Array.isArray(h.dietaryRestrictions) ? h.dietaryRestrictions.join(', ') : '',
          specialCareNotes: h.specialCareNotes || ''
        });
      }

      // 3. Doctor QR
      const qrRes = await api.get(`/patients/${patientId}/doctor-qr`);
      if (qrRes.success) {
        setDoctorQr(qrRes.data);
      }

      // 4. Privacy settings
      const privacyRes = await api.get(`/patients/${patientId}/privacy`);
      if (privacyRes.success) {
        setPrivacySettings(privacyRes.data.privacy);
      }

      // 5. Access history
      const histRes = await api.get(`/patients/${patientId}/access-history`);
      if (histRes.success) {
        setAccessHistory(histRes.data.history || []);
      }

      // 6. Medications
      const medRes = await api.get(`/medications/patient/${patientId}`);
      if (medRes.success) {
        setMedications(medRes.data.medications || []);
      }

      // 7. Prescriptions
      const rxRes = await api.get(`/prescriptions/patient/${patientId}`);
      if (rxRes.success) {
        setPrescriptions(rxRes.data.prescriptions || []);
      }

      // 8. Documents
      const docRes = await api.get(`/documents/patient/${patientId}`);
      if (docRes.success) {
        setDocuments(docRes.data.documents || []);
      }

      // 9. History events
      const evRes = await api.get(`/medication-events/history/${patientId}?days=7`);
      if (evRes.success) {
        setHistoryEvents(evRes.data.events || []);
      }
    } catch (err: any) {
      console.error('[SeniorProfileView] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllProfileData();
  }, [activeSenior?._id]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSenior?._id) return;
    try {
      setLoading(true);
      const res = await api.put(`/patients/${activeSenior._id}`, personalForm);
      if (res.success) {
        setSaveSuccess('Personal information updated successfully.');
        setIsEditingPersonal(false);
        setTimeout(() => setSaveSuccess(null), 3000);
        loadAllProfileData();
        refreshSeniors();
      }
    } catch (err: any) {
      alert('Error saving personal info: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHealthCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSenior?._id) return;
    try {
      setLoading(true);
      const payload = {
        mobilityStatus: healthForm.mobilityStatus,
        visionStatus: healthForm.visionStatus,
        hearingStatus: healthForm.hearingStatus,
        communicationPreference: healthForm.communicationPreference,
        knownAllergies: healthForm.knownAllergies.split(',').map(s => s.trim()).filter(Boolean),
        importantHealthConditions: healthForm.importantHealthConditions.split(',').map(s => s.trim()).filter(Boolean),
        dietaryRestrictions: healthForm.dietaryRestrictions.split(',').map(s => s.trim()).filter(Boolean),
        specialCareNotes: healthForm.specialCareNotes
      };
      const res = await api.put(`/patients/${activeSenior._id}/health-condition`, payload);
      if (res.success) {
        setSaveSuccess('Health & Care condition profile saved successfully.');
        setIsEditingHealth(false);
        setTimeout(() => setSaveSuccess(null), 3000);
        loadAllProfileData();
      }
    } catch (err: any) {
      alert('Error saving health condition: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQr = async () => {
    if (!activeSenior?._id) return;
    if (!confirm('Regenerating will invalidate the previous Doctor QR. Are you sure you want to issue a new secure QR?')) return;
    try {
      setLoading(true);
      const res = await api.post(`/patients/${activeSenior._id}/doctor-qr/regenerate`);
      if (res.success) {
        setSaveSuccess('Doctor QR regenerated and previous token invalidated!');
        setTimeout(() => setSaveSuccess(null), 3500);
        loadAllProfileData();
      }
    } catch (err: any) {
      alert('Error regenerating QR: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivacy = async (field: string, currentValue: boolean) => {
    if (!activeSenior?._id) return;
    try {
      const updates = { [field]: !currentValue };
      const res = await api.put(`/patients/${activeSenior._id}/privacy`, updates);
      if (res.success) {
        setPrivacySettings(res.data.privacy);
        setSaveSuccess(`Privacy preference updated.`);
        setTimeout(() => setSaveSuccess(null), 2500);
        loadAllProfileData();
      }
    } catch (err: any) {
      alert('Error updating privacy preference: ' + err.message);
    }
  };

  if (!activeSenior) {
    if (seniors && seniors.length > 0) {
      return (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <h3>Connecting to {seniors[0].fullName || 'Senior'}...</h3>
          <p className="text-muted">Loading profile and health telemetry...</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => setActiveSenior(seniors[0])}
          >
            Open Profile Now
          </button>
        </div>
      );
    }
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <h3>Loading Senior Profile...</h3>
        <p className="text-muted">Fetching family connection data.</p>
        <button
          className="btn btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => refreshSeniors()}
        >
          Refresh Profile
        </button>
      </div>
    );
  }

  const p = profileData || activeSenior;
  const h = healthCondition || {};

  const tabs: Array<{ id: SeniorProfileTab; label: string; icon: any }> = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal Info', icon: Edit3 },
    { id: 'health_condition', label: 'Health Condition', icon: Heart },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
    { id: 'documents', label: 'Medical Documents', icon: FolderArchive },
    { id: 'history', label: 'Medication History', icon: History },
    { id: 'doctor_qr', label: 'Doctor QR', icon: QrCode },
    { id: 'privacy', label: 'Privacy & Sharing', icon: ShieldCheck }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Profile Header Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF7ED 100%)',
        border: '1px solid rgba(255, 122, 0, 0.2)',
        padding: '1.75rem',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(255, 122, 0, 0.25)',
              border: '4px solid #FFFFFF'
            }}>
              {(p.preferredName || p.fullName || 'P').charAt(0)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {p.preferredName || p.fullName}
                </h1>
                <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700 }}>
                  {p.age} yrs • {p.gender === 'female' ? 'Female' : 'Male'}
                </span>
                <span className="badge badge-success">Active Senior</span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Full Legal Name: <strong>{p.fullName}</strong> • Blood Group: <strong style={{ color: 'var(--primary)' }}>{p.bloodGroup || 'B+'}</strong>
              </p>
              <p style={{ margin: '4px 0 0', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                Caregiver: {p.emergencyContactName} ({p.relationship || 'Daughter'}) • Phone: {p.emergencyContactPhone}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab('doctor_qr')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
            >
              <QrCode size={18} />
              Show Doctor QR
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => setActiveTab('privacy')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ShieldCheck size={18} />
              Privacy & Sharing
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div style={{
            marginTop: '1.25rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#DCFCE7',
            border: '1px solid #86EFAC',
            borderRadius: 'var(--radius-sm)',
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            fontWeight: 600
          }}>
            <CheckCircle2 size={18} />
            {saveSuccess}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        overflowX: 'auto',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.5rem'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Health Summary Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Heart size={20} />
                Health Condition Summary
              </h3>
              <button 
                onClick={() => setActiveTab('health_condition')} 
                className="btn btn-outline" 
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
              >
                Edit
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">Mobility:</span>
                <strong>{h.mobilityStatus || 'Independent'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">Vision:</span>
                <strong>{h.visionStatus || 'Normal vision'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">Hearing:</span>
                <strong>{h.hearingStatus || 'Normal hearing'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }}>
                <span className="text-muted">Communication:</span>
                <strong>{h.communicationPreference || 'Spoken / Friendly'}</strong>
              </div>
              
              <div>
                <span className="text-muted" style={{ display: 'block', marginBottom: '4px' }}>Known Allergies:</span>
                {h.knownAllergies && h.knownAllergies.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {h.knownAllergies.map((al: string, i: number) => (
                      <span key={i} className="badge badge-late" style={{ fontSize: '0.8rem' }}>
                        ⚠️ {al}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>None reported</span>
                )}
              </div>

              <div>
                <span className="text-muted" style={{ display: 'block', marginBottom: '4px' }}>Long-Term Conditions:</span>
                {h.importantHealthConditions && h.importantHealthConditions.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {h.importantHealthConditions.map((c: string, i: number) => (
                      <span key={i} className="badge" style={{ backgroundColor: '#E0E7FF', color: '#3730A3', fontSize: '0.8rem' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>None listed</span>
                )}
              </div>

              {h.specialCareNotes && (
                <div style={{
                  backgroundColor: 'var(--bg-warm)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: '0.5rem',
                  borderLeft: '4px solid var(--primary)'
                }}>
                  <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--primary)' }}>Special Care Note:</strong>
                  <span style={{ fontSize: '0.85rem' }}>{h.specialCareNotes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Medication Summary Card */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                <Pill size={20} />
                Medication Summary
              </h3>
              <button 
                onClick={() => setActiveTab('medications')} 
                className="btn btn-outline" 
                style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
              >
                Manage ({medications.length})
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-warm)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTIVE PILLS</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{medications.length}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PAST 7D ADHERENCE</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16A34A' }}>96%</div>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '0.4rem' }}>
                  Current Medications:
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {medications.slice(0, 4).map((m: any) => (
                    <div key={m._id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: '#F9FAFB',
                      border: '1px solid var(--border)',
                      fontSize: '0.88rem'
                    }}>
                      <div>
                        <strong>{m.name}</strong> <span className="text-muted">({m.dose} {m.unit})</span>
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                        {m.foodRelation?.replace('_', ' ') || 'After food'}
                      </span>
                    </div>
                  ))}
                  {medications.length > 4 && (
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      + {medications.length - 4} more medications
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency & Doctor QR Quick Card */}
          <div className="card">
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
              <ShieldCheck size={20} />
              Emergency & Doctor QR
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-sm)', border: '1px solid #BFDBFE' }}>
                <div style={{ fontWeight: 700, color: '#1E40AF', marginBottom: '2px' }}>
                  Primary Contact: {p.emergencyContactName}
                </div>
                <div style={{ color: '#1E3A8A', fontSize: '0.85rem' }}>
                  Relation: {p.relationship || 'Daughter'} • Phone: <strong>{p.emergencyContactPhone}</strong>
                </div>
              </div>

              {p.secondaryContactName && (
                <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                    Secondary: {p.secondaryContactName} ({p.secondaryRelationship || 'Family Contact'})
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Phone: {p.secondaryContactPhone}
                  </div>
                </div>
              )}

              <div style={{
                marginTop: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                {doctorQr?.qrDataUrl ? (
                  <img src={doctorQr.qrDataUrl} alt="Doctor QR" style={{ width: '60px', height: '60px', borderRadius: '4px' }} />
                ) : (
                  <QrCode size={48} color="var(--primary)" />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>Doctor QR Active</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Status: <span style={{ color: '#16A34A', fontWeight: 600 }}>{doctorQr?.status || 'ACTIVE'}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('doctor_qr')}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', marginTop: '4px' }}
                  >
                    View / Regenerate QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL INFO */}
      {activeTab === 'personal' && (
        <div className="card" style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Basic Personal Information</h3>
              <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>
                Manage full legal name, age, emergency phone, and home address.
              </p>
            </div>
            {!isEditingPersonal ? (
              <button className="btn btn-primary" onClick={() => setIsEditingPersonal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Edit3 size={16} /> Edit Details
              </button>
            ) : (
              <button className="btn btn-outline" onClick={() => setIsEditingPersonal(false)}>
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSavePersonal}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.fullName}
                  onChange={e => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Name (Senior Friendly)</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.preferredName}
                  onChange={e => setPersonalForm({ ...personalForm, preferredName: e.target.value })}
                  placeholder="e.g. Paati / Thatha"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Age *</label>
                <input
                  type="number"
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.age}
                  onChange={e => setPersonalForm({ ...personalForm, age: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.gender}
                  onChange={e => setPersonalForm({ ...personalForm, gender: e.target.value })}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.phone}
                  onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                  placeholder="+91 98400 67890"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.bloodGroup}
                  onChange={e => setPersonalForm({ ...personalForm, bloodGroup: e.target.value })}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Home Address</label>
              <textarea
                className="form-control"
                rows={2}
                disabled={!isEditingPersonal}
                value={personalForm.address}
                onChange={e => setPersonalForm({ ...personalForm, address: e.target.value })}
                placeholder="Residential address"
              />
            </div>

            <h4 style={{ margin: '1.5rem 0 0.75rem', color: 'var(--primary)' }}>Emergency Contact Information</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Primary Caregiver Name *</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.emergencyContactName}
                  onChange={e => setPersonalForm({ ...personalForm, emergencyContactName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Relationship *</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.relationship}
                  onChange={e => setPersonalForm({ ...personalForm, relationship: e.target.value })}
                  placeholder="Daughter, Son, Spouse..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emergency Phone *</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.emergencyContactPhone}
                  onChange={e => setPersonalForm({ ...personalForm, emergencyContactPhone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Secondary Contact Name</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.secondaryContactName}
                  onChange={e => setPersonalForm({ ...personalForm, secondaryContactName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Secondary Relationship</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.secondaryRelationship}
                  onChange={e => setPersonalForm({ ...personalForm, secondaryRelationship: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Secondary Phone</label>
                <input
                  type="text"
                  className="form-control"
                  disabled={!isEditingPersonal}
                  value={personalForm.secondaryContactPhone}
                  onChange={e => setPersonalForm({ ...personalForm, secondaryContactPhone: e.target.value })}
                />
              </div>
            </div>

            {isEditingPersonal && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Save size={18} /> Save Personal Information
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 3: HEALTH CONDITION */}
      {activeTab === 'health_condition' && (
        <div className="card" style={{ maxWidth: '850px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Heart size={20} color="var(--primary)" />
                Basic Health & Body Condition Profile
              </h3>
              <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>
                Descriptive assistance context for caregivers and doctors. <em>(Does not infer medical diagnosis).</em>
              </p>
            </div>
            {!isEditingHealth ? (
              <button className="btn btn-primary" onClick={() => setIsEditingHealth(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Edit3 size={16} /> Edit Health Profile
              </button>
            ) : (
              <button className="btn btn-outline" onClick={() => setIsEditingHealth(false)}>
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSaveHealthCondition}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Mobility Status</label>
                <select
                  className="form-control"
                  disabled={!isEditingHealth}
                  value={healthForm.mobilityStatus}
                  onChange={e => setHealthForm({ ...healthForm, mobilityStatus: e.target.value })}
                >
                  <option value="Independent">Independent</option>
                  <option value="Walks with support">Walks with support</option>
                  <option value="Uses walking stick">Uses walking stick</option>
                  <option value="Uses walker">Uses walker</option>
                  <option value="Uses wheelchair">Uses wheelchair</option>
                  <option value="Mostly bedbound">Mostly bedbound</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vision Status</label>
                <select
                  className="form-control"
                  disabled={!isEditingHealth}
                  value={healthForm.visionStatus}
                  onChange={e => setHealthForm({ ...healthForm, visionStatus: e.target.value })}
                >
                  <option value="Normal vision">Normal vision</option>
                  <option value="Uses glasses">Uses glasses</option>
                  <option value="Low vision">Low vision</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Hearing Status</label>
                <select
                  className="form-control"
                  disabled={!isEditingHealth}
                  value={healthForm.hearingStatus}
                  onChange={e => setHealthForm({ ...healthForm, hearingStatus: e.target.value })}
                >
                  <option value="Normal hearing">Normal hearing</option>
                  <option value="Uses hearing aid">Uses hearing aid</option>
                  <option value="Difficulty hearing">Difficulty hearing</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Communication Preference</label>
              <input
                type="text"
                className="form-control"
                disabled={!isEditingHealth}
                value={healthForm.communicationPreference}
                onChange={e => setHealthForm({ ...healthForm, communicationPreference: e.target.value })}
                placeholder="e.g. Spoken in Tamil/English, Large print text"
              />
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label" style={{ color: '#DC2626' }}>
                Known Allergies (Comma-separated)
              </label>
              <input
                type="text"
                className="form-control"
                disabled={!isEditingHealth}
                value={healthForm.knownAllergies}
                onChange={e => setHealthForm({ ...healthForm, knownAllergies: e.target.value })}
                placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
              />
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Current Long-Term Conditions (Comma-separated)</label>
              <input
                type="text"
                className="form-control"
                disabled={!isEditingHealth}
                value={healthForm.importantHealthConditions}
                onChange={e => setHealthForm({ ...healthForm, importantHealthConditions: e.target.value })}
                placeholder="e.g. Type-2 Diabetes, Hypertension, Knee Osteoarthritis"
              />
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Dietary Restrictions (Comma-separated)</label>
              <input
                type="text"
                className="form-control"
                disabled={!isEditingHealth}
                value={healthForm.dietaryRestrictions}
                onChange={e => setHealthForm({ ...healthForm, dietaryRestrictions: e.target.value })}
                placeholder="e.g. Low Sodium, Diabetic Diet, Pure Vegetarian"
              />
            </div>

            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Special Daily Care Notes</label>
              <textarea
                className="form-control"
                rows={3}
                disabled={!isEditingHealth}
                value={healthForm.specialCareNotes}
                onChange={e => setHealthForm({ ...healthForm, specialCareNotes: e.target.value })}
                placeholder="Special routines, assistance habits, reminders to drink warm water with morning pills..."
              />
            </div>

            {isEditingHealth && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Save size={18} /> Save Health Condition
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 4: MEDICATIONS */}
      {activeTab === 'medications' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Active Prescribed Medications</h3>
              <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>
                All scheduled pills, dosages, and meal instructions configured for {p.preferredName || p.fullName}.
              </p>
            </div>
            {onNavigateToTab && (
              <button className="btn btn-primary" onClick={() => onNavigateToTab('medications')} style={{ fontSize: '0.88rem' }}>
                Add New Medication
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {medications.map((m: any) => (
              <div key={m._id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FFFFFF'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                    {m.name} <span style={{ color: 'var(--primary)', fontWeight: 600 }}>({m.dose} {m.unit})</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                    Generic: {m.genericName || 'Standard Form'} • Form: {m.form || 'Tablet'}
                  </div>
                  {m.instructions && (
                    <div style={{ color: 'var(--text-light)', fontSize: '0.8rem', marginTop: '2px' }}>
                      Instructions: {m.instructions}
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-success" style={{ fontWeight: 700 }}>
                    {m.foodRelation?.replace('_', ' ') || 'After food'}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Active since {new Date(m.startDate || m.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Prescription History</h3>
              <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>
                Verified and pending prescriptions with doctor and clinic references.
              </p>
            </div>
            {onNavigateToTab && (
              <button className="btn btn-primary" onClick={() => onNavigateToTab('prescriptions')}>
                Upload Prescription
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {prescriptions.map((rx: any) => (
              <div key={rx._id} style={{
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {rx.doctorName || 'Attending Physician'} • {rx.hospitalName || 'Clinic'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
                    Date: {new Date(rx.prescriptionDate || rx.createdAt).toLocaleDateString()} • Extracted Medications: {rx.extractedMedications?.length || 0}
                  </div>
                </div>
                <span className={`badge ${rx.verificationStatus === 'VERIFIED' ? 'badge-success' : 'badge-pending'}`}>
                  {rx.verificationStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: MEDICAL DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Medical Documents Vault</h3>
              <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>
                Toggle individual documents to allow preview during Doctor QR access.
              </p>
            </div>
            {onNavigateToTab && (
              <button className="btn btn-primary" onClick={() => onNavigateToTab('documents')}>
                Upload Document
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {documents.map((doc: any) => (
              <div key={doc._id} style={{
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>{doc.type}</span>
                    {doc.fileName}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    {doc.hospitalName || 'Hospital'} • {doc.doctorName || 'Doctor'} • {new Date(doc.documentDate || doc.createdAt).toLocaleDateString()}
                  </div>
                  {doc.aiSummary?.summary && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px', maxWidth: '650px' }}>
                      <em>AI plain explainer:</em> {doc.aiSummary.summary}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.85rem',
                    color: doc.shareWithDoctor ? 'var(--primary)' : 'var(--text-light)',
                    fontWeight: 600
                  }}>
                    <span>Doctor QR Preview:</span>
                    <span className={`badge ${doc.shareWithDoctor ? 'badge-success' : 'badge-pending'}`}>
                      {doc.shareWithDoctor ? 'Shared' : 'Private'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: MEDICATION HISTORY */}
      {activeTab === 'history' && (
        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0' }}>Recent Medication Timeline (Last 7 Days)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {historyEvents.slice(0, 15).map((ev: any) => (
              <div key={ev._id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FFFFFF',
                fontSize: '0.88rem'
              }}>
                <div>
                  <strong>{ev.medicationId?.name || 'Medication'}</strong>
                  <span className="text-muted" style={{ marginLeft: '6px' }}>({ev.medicationId?.dosage || ev.medicationId?.dose})</span>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                    Scheduled: {new Date(ev.scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${
                    ev.status === 'TAKEN' ? 'badge-success' :
                    ev.status === 'DUE' ? 'badge-due' :
                    ev.status === 'LATE' ? 'badge-late' : 'badge-pending'
                  }`}>
                    {ev.status}
                  </span>
                  {ev.takenAt && (
                    <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: '2px' }}>
                      Confirmed at {new Date(ev.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: DOCTOR QR */}
      {activeTab === 'doctor_qr' && (
        <div className="card" style={{ maxWidth: '750px', textAlign: 'center', margin: '0 auto', padding: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '0.75rem',
            backgroundColor: 'var(--primary-light)',
            borderRadius: '50%',
            marginBottom: '1rem',
            color: 'var(--primary)'
          }}>
            <QrCode size={36} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
            Doctor QR Access
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            Show this secure QR code only to an authorized physician, hospital worker, or emergency team.
          </p>

          <div style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '2rem',
            display: 'inline-block',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.06)',
            marginBottom: '1.5rem'
          }}>
            {doctorQr?.qrDataUrl ? (
              <img 
                src={doctorQr.qrDataUrl} 
                alt="Doctor Access QR" 
                style={{ width: '260px', height: '260px', display: 'block', margin: '0 auto' }}
              />
            ) : (
              <div style={{ width: '260px', height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Loading QR...
              </div>
            )}
            
            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                {p.preferredName || p.fullName}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Status: <strong style={{ color: '#16A34A' }}>{doctorQr?.status || 'ACTIVE'}</strong> • Version: <strong>v{doctorQr?.version || 1}</strong>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-warm)',
            border: '1px solid rgba(255, 122, 0, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            textAlign: 'left',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '1.5rem'
          }}>
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
              🔒 Zero-Plaintext Security Architecture:
            </strong>
            This QR image does <strong>not</strong> contain names, phone numbers, or passwords. It contains only a cryptographically secure opaque token reference. When scanned, the system creates a temporary read-only session respecting the privacy settings you configure.
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-outline"
              onClick={handleRegenerateQr}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
            >
              <RefreshCw size={16} />
              Regenerate QR (Revoke Old)
            </button>

            <a
              href={`/doctor-access?token=${doctorQr?.token || ''}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
            >
              <ExternalLink size={16} />
              Open Doctor Access Portal
            </a>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '1rem' }}>
            Expires: {doctorQr?.expiresAt ? new Date(doctorQr.expiresAt).toLocaleDateString() : 'In 30 days'} • 
            Last Accessed: {doctorQr?.lastAccessedAt ? new Date(doctorQr.lastAccessedAt).toLocaleString() : 'Never'}
          </div>
        </div>
      )}

      {/* TAB 9: PRIVACY & SHARING */}
      {activeTab === 'privacy' && (
        <div className="card" style={{ maxWidth: '800px' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--primary)" />
              Privacy & Doctor Sharing Preferences
            </h3>
            <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>
              Control exactly which portions of {p.preferredName || p.fullName}’s profile are shared when the Doctor QR is scanned.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              {
                id: 'allowDoctorAccess',
                title: 'Allow Doctor QR Access',
                desc: 'Master toggle to enable or disable any temporary doctor QR scanning.',
                val: privacySettings?.allowDoctorAccess ?? true
              },
              {
                id: 'allowMedicationAccess',
                title: 'Active Medication List',
                desc: 'Allow the attending doctor to see active medications, dosages, and schedule frequencies.',
                val: privacySettings?.allowMedicationAccess ?? true
              },
              {
                id: 'allowHealthConditionAccess',
                title: 'Health & Body Condition Summary',
                desc: 'Allow viewing of mobility, vision, hearing, allergies, and dietary notes.',
                val: privacySettings?.allowHealthConditionAccess ?? true
              },
              {
                id: 'allowPrescriptionAccess',
                title: 'Prescription History',
                desc: 'Allow viewing of past prescriptions, clinics, and doctor notes.',
                val: privacySettings?.allowPrescriptionAccess ?? true
              },
              {
                id: 'allowDocumentMetadataAccess',
                title: 'Medical Reports Metadata',
                desc: 'Allow viewing titles, test dates, and hospitals of stored reports.',
                val: privacySettings?.allowDocumentMetadataAccess ?? true
              },
              {
                id: 'allowDocumentPreview',
                title: 'Selected Medical Document File Preview',
                desc: 'Allow viewing preview files of records marked as shared.',
                val: privacySettings?.allowDocumentPreview ?? false
              },
              {
                id: 'allowEmergencyContactAccess',
                title: 'Emergency Contact Relationship',
                desc: 'Display primary caregiver relationship during emergency clinical intake.',
                val: privacySettings?.allowEmergencyContactAccess ?? true
              }
            ].map(item => (
              <div key={item.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: item.val ? '#FFFFFF' : '#F9FAFB'
              }}>
                <div style={{ maxWidth: '80%' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.title}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
                  <input
                    type="checkbox"
                    checked={item.val}
                    onChange={() => handleTogglePrivacy(item.id, item.val)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: item.val ? 'var(--primary)' : '#CBD5E1',
                    borderRadius: '34px',
                    transition: '0.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '20px',
                      width: '20px',
                      left: item.val ? '26px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '50%',
                      transition: '0.2s'
                    }} />
                  </span>
                </label>
              </div>
            ))}
          </div>

          {/* Access Audit Trail */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} color="var(--primary)" />
              Security Audit & Doctor Access Log
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {accessHistory.length === 0 ? (
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>No recent access events recorded.</div>
              ) : (
                accessHistory.slice(0, 8).map((log: any, idx: number) => (
                  <div key={idx} style={{
                    padding: '0.6rem 0.85rem',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong>{log.action}</strong> by <span className="badge" style={{ fontSize: '0.75rem' }}>{log.actorRole}</span>
                      {log.metadata?.doctorIdentifier && (
                        <span style={{ marginLeft: '6px', color: 'var(--primary)', fontWeight: 600 }}>
                          ({log.metadata.doctorIdentifier})
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.78rem' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
