import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  QrCode, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  LogOut, 
  Pill, 
  Heart, 
  FileText, 
  FolderArchive, 
  User, 
  ExternalLink,
  Lock,
  Stethoscope,
  Info
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function DoctorAccessPage() {
  const router = useRouter();
  const { token: urlToken } = router.query;

  // Flow steps: 'scan' | 'verify' | 'session' | 'ended'
  const [step, setStep] = useState<'scan' | 'verify' | 'session' | 'ended'>('scan');
  const [tokenInput, setTokenInput] = useState('');
  const [doctorIdentifier, setDoctorIdentifier] = useState('Dr. Anand Kumar, Apollo Hospital');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Verification preview
  const [patientPreview, setPatientPreview] = useState<any>(null);

  // Active session
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState<string>('60:00');
  const [clinicalData, setClinicalData] = useState<any>(null);

  // Active section tab
  const [activeSection, setActiveSection] = useState<'overview' | 'medications' | 'health' | 'prescriptions' | 'reports'>('overview');

  // Handle URL token param
  useEffect(() => {
    if (urlToken && typeof urlToken === 'string') {
      setTokenInput(urlToken);
      validateToken(urlToken);
    }
  }, [urlToken]);

  // Session countdown timer
  useEffect(() => {
    if (!sessionExpiresAt || step !== 'session') return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = sessionExpiresAt.getTime() - now;
      if (diff <= 0) {
        clearInterval(interval);
        setStep('ended');
        setErrorMsg('Doctor access session has expired.');
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeftStr(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiresAt, step]);

  const validateToken = async (tokenToTest: string) => {
    if (!tokenToTest.trim()) {
      setErrorMsg('Please enter or scan a QR token.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/doctor-access/validate-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToTest.trim() })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Invalid or expired QR token.');
        return;
      }

      setPatientPreview(data.data.patientPreview);
      setStep('verify');
    } catch (err: any) {
      setErrorMsg('Failed to connect to LL LifeLink verification server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    if (!doctorIdentifier.trim()) {
      setErrorMsg('Please enter your Doctor or Healthcare Professional Name / ID.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/doctor-access/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenInput.trim(),
          doctorIdentifier: doctorIdentifier.trim()
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Authorization failed.');
        return;
      }

      const sessId = data.data.sessionId;
      setSessionId(sessId);
      setSessionExpiresAt(new Date(data.data.expiresAt));

      // Fetch clinical payload
      await loadClinicalData(sessId);
      setStep('session');
    } catch (err: any) {
      setErrorMsg('Error establishing doctor session: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadClinicalData = async (sessId: string) => {
    try {
      const res = await fetch(`${API_BASE}/doctor-access/session/${sessId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setClinicalData(data.data);
      } else {
        throw new Error(data.message || 'Failed to retrieve patient clinical summary.');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const endSession = async () => {
    if (sessionId) {
      try {
        await fetch(`${API_BASE}/doctor-access/session/${sessionId}/end`, {
          method: 'POST'
        });
      } catch (e) {
        // ignore
      }
    }
    setStep('ended');
    setClinicalData(null);
  };

  return (
    <>
      <Head>
        <title>LL LifeLink - Authorized Doctor Access Portal</title>
        <meta name="description" content="Temporary read-only clinical access for authorized healthcare providers." />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FFF7ED',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#1F2937'
      }}>
        {/* Top Header */}
        <header style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #FED7AA',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#FF7A00',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '1.2rem'
            }}>
              LL
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1F2937', lineHeight: 1.1 }}>
                LL LifeLink <span style={{ color: '#FF7A00', fontWeight: 600, fontSize: '0.85rem' }}>DOCTOR ACCESS</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                Secure Clinical QR Verification • Read-Only Session
              </div>
            </div>
          </div>

          {step === 'session' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#92400E'
              }}>
                <Clock size={16} />
                Session expires in: {timeLeftStr}
              </div>

              <button
                onClick={endSession}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={16} /> End Session
              </button>
            </div>
          )}
        </header>

        {/* Read-Only Notice Bar */}
        <div style={{
          backgroundColor: '#FFFBEB',
          borderBottom: '1px solid #FDE68A',
          padding: '0.5rem 2rem',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: '#92400E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Lock size={14} />
          <strong>Phase 1 Read-Only Protocol:</strong> Healthcare professionals can inspect authorized patient medication schedules and conditions. Medication schedule modification and record deletion are restricted.
        </div>

        {/* Main Content Area */}
        <main style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem' }}>
          {errorMsg && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              color: '#991B1B',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 500
            }}>
              <AlertTriangle size={20} />
              {errorMsg}
            </div>
          )}

          {/* STEP 1: SCAN / ENTER QR */}
          {step === 'scan' && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '3rem 2rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              maxWidth: '650px',
              margin: '0 auto',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#FFF7ED',
                color: '#FF7A00',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <Stethoscope size={32} />
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#1F2937' }}>
                Doctor QR Verification
              </h2>
              <p style={{ color: '#4B5563', fontSize: '0.92rem', marginBottom: '2rem' }}>
                Scan the senior patient’s LL LifeLink Doctor QR code or enter the secure token below to review medication adherence and clinical context.
              </p>

              <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Doctor QR Token or Full Scanned URL
                </label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  placeholder="e.g. llqr_a492f8... or paste scanned URL"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                onClick={() => validateToken(tokenInput)}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: '#FF7A00',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <ShieldCheck size={20} />
                {loading ? 'Verifying Security Token...' : 'Verify QR Token & Proceed'}
              </button>

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E5E7EB', fontSize: '0.8rem', color: '#6B7280' }}>
                🔒 Zero Plaintext QR Protocol: Senior identifiers and private diagnoses are never stored inside the QR image itself.
              </div>
            </div>
          )}

          {/* STEP 2: VERIFY & IDENTIFY DOCTOR */}
          {step === 'verify' && patientPreview && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '2.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              maxWidth: '650px',
              margin: '0 auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16A34A', fontWeight: 700, marginBottom: '0.5rem' }}>
                <CheckCircle2 size={20} />
                Valid QR Code Verified
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
                Patient: {patientPreview.fullName}
              </h2>

              <div style={{
                backgroundColor: '#F9FAFB',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                marginBottom: '1.5rem',
                fontSize: '0.9rem'
              }}>
                <div><strong>Age:</strong> {patientPreview.age} years</div>
                <div style={{ marginTop: '4px' }}><strong>Gender:</strong> {patientPreview.gender || 'Not specified'}</div>
                <div style={{ marginTop: '4px' }}><strong>Preferred Name:</strong> {patientPreview.preferredName || patientPreview.fullName}</div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  Doctor Name & Clinic / Hospital Credential *
                </label>
                <input
                  type="text"
                  value={doctorIdentifier}
                  onChange={e => setDoctorIdentifier(e.target.value)}
                  placeholder="e.g. Dr. Anand Kumar, Apollo Clinic"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.78rem', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                  This credential will be recorded in the patient’s security audit log.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={startSession}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    backgroundColor: '#FF7A00',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Lock size={18} />
                  {loading ? 'Authorizing Session...' : 'Open Read-Only Clinical View'}
                </button>

                <button
                  onClick={() => setStep('scan')}
                  style={{
                    padding: '0.85rem 1.25rem',
                    backgroundColor: 'transparent',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ACTIVE CLINICAL VIEW */}
          {step === 'session' && clinicalData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Patient Banner */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #FED7AA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#FF7A00',
                    color: '#FFFFFF',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {(clinicalData.patient?.preferredName || clinicalData.patient?.fullName || 'P').charAt(0)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                        {clinicalData.patient?.fullName}
                      </h2>
                      <span style={{
                        backgroundColor: '#FFEDD5',
                        color: '#C2410C',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}>
                        {clinicalData.patient?.age} yrs • {clinicalData.patient?.gender}
                      </span>
                    </div>

                    <div style={{ color: '#4B5563', fontSize: '0.88rem', marginTop: '4px' }}>
                      Blood Group: <strong style={{ color: '#FF7A00' }}>{clinicalData.patient?.bloodGroup || 'B+'}</strong>
                      {clinicalData.patient?.emergencyContact && (
                        <span style={{ marginLeft: '12px' }}>
                          • Emergency Contact: <strong>{clinicalData.patient.emergencyContact.name} ({clinicalData.patient.emergencyContact.relationship})</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: '#6B7280' }}>
                  <div>Logged In as: <strong>{clinicalData.sessionInfo?.doctorIdentifier}</strong></div>
                  <div>Session Mode: <span style={{ color: '#16A34A', fontWeight: 600 }}>READ-ONLY</span></div>
                </div>
              </div>

              {/* Clinical Alerts Strip */}
              {clinicalData.alerts && clinicalData.alerts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {clinicalData.alerts.map((alert: any, idx: number) => (
                    <div key={idx} style={{
                      backgroundColor: alert.type === 'alert' ? '#FEE2E2' : '#FEF3C7',
                      border: `1px solid ${alert.type === 'alert' ? '#FCA5A5' : '#FCD34D'}`,
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontSize: '0.88rem',
                      color: alert.type === 'alert' ? '#991B1B' : '#92400E'
                    }}>
                      <AlertTriangle size={18} />
                      <div>
                        <strong>{alert.title}:</strong> {alert.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
                {[
                  { id: 'overview', label: 'Clinical Summary', icon: User },
                  { id: 'medications', label: `Active Medications (${clinicalData.activeMedications?.length || 0})`, icon: Pill },
                  { id: 'health', label: 'Health & Care Context', icon: Heart },
                  { id: 'prescriptions', label: `Prescriptions (${clinicalData.prescriptions?.length || 0})`, icon: FileText },
                  { id: 'reports', label: `Shared Reports (${clinicalData.medicalReports?.length || 0})`, icon: FolderArchive }
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = activeSection === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveSection(t.id as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.6rem 1rem',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: isActive ? '#FF7A00' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#4B5563',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.88rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon size={16} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* SECTION 1: OVERVIEW */}
              {activeSection === 'overview' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                  {/* Medications Snippet */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '1.25rem', border: '1px solid #E5E7EB' }}>
                    <h3 style={{ margin: '0 0 0.75rem 0', color: '#FF7A00', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Pill size={18} />
                      Active Prescriptions ({clinicalData.activeMedications?.length || 0})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {clinicalData.activeMedications?.map((m: any) => (
                        <div key={m.id} style={{
                          padding: '0.6rem 0.85rem',
                          backgroundColor: '#F9FAFB',
                          borderRadius: '6px',
                          border: '1px solid #E5E7EB',
                          fontSize: '0.88rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <strong>{m.name}</strong> <span style={{ color: '#6B7280' }}>({m.dosage})</span>
                            <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{m.frequency} • {m.foodInstruction?.replace('_', ' ')}</div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16A34A' }}>Active</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Body & Health Condition Snippet */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '1.25rem', border: '1px solid #E5E7EB' }}>
                    <h3 style={{ margin: '0 0 0.75rem 0', color: '#FF7A00', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Heart size={18} />
                      Body Condition Profile
                    </h3>
                    {clinicalData.healthCondition ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.88rem' }}>
                        <div><strong>Mobility:</strong> {clinicalData.healthCondition.mobilityStatus}</div>
                        <div><strong>Vision:</strong> {clinicalData.healthCondition.visionStatus}</div>
                        <div><strong>Hearing:</strong> {clinicalData.healthCondition.hearingStatus}</div>
                        <div>
                          <strong>Allergies:</strong> {clinicalData.healthCondition.knownAllergies?.join(', ') || 'None reported'}
                        </div>
                        {clinicalData.healthCondition.specialCareNotes && (
                          <div style={{
                            backgroundColor: '#FFF7ED',
                            padding: '0.6rem',
                            borderRadius: '6px',
                            borderLeft: '3px solid #FF7A00',
                            marginTop: '4px'
                          }}>
                            <strong>Care Note:</strong> {clinicalData.healthCondition.specialCareNotes}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color: '#6B7280', fontSize: '0.85rem' }}>
                        Health condition summary restricted by patient privacy settings.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 2: MEDICATIONS */}
              {activeSection === 'medications' && (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: '0 0 1rem 0' }}>Complete Active Medication Schedule</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {clinicalData.activeMedications?.map((m: any) => (
                      <div key={m.id} style={{
                        padding: '1rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        backgroundColor: '#F9FAFB'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '1.1rem', color: '#1F2937' }}>
                            {m.name} <span style={{ color: '#FF7A00' }}>({m.dosage})</span>
                          </strong>
                          <span style={{
                            backgroundColor: '#DCFCE7',
                            color: '#166534',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {m.status}
                          </span>
                        </div>
                        <div style={{ color: '#4B5563', fontSize: '0.88rem', marginTop: '4px' }}>
                          Generic: {m.genericName || 'Standard'} • Frequency: {m.frequency} • Food Relation: <strong>{m.foodInstruction?.replace('_', ' ')}</strong>
                        </div>
                        {m.instructions && (
                          <div style={{ color: '#6B7280', fontSize: '0.82rem', marginTop: '4px' }}>
                            Instructions: {m.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: HEALTH CONDITION */}
              {activeSection === 'health' && (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: '0 0 1rem 0' }}>Health Context & Functional Mobility</h3>
                  {clinicalData.healthCondition ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase' }}>Functional Status</div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                          <div>• Mobility: <strong>{clinicalData.healthCondition.mobilityStatus}</strong></div>
                          <div>• Vision: <strong>{clinicalData.healthCondition.visionStatus}</strong></div>
                          <div>• Hearing: <strong>{clinicalData.healthCondition.hearingStatus}</strong></div>
                          <div>• Preference: <strong>{clinicalData.healthCondition.communicationPreference}</strong></div>
                        </div>
                      </div>

                      <div style={{ padding: '1rem', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase' }}>Clinical Alerts</div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
                          <div>
                            • Known Allergies: <strong style={{ color: '#DC2626' }}>
                              {clinicalData.healthCondition.knownAllergies?.join(', ') || 'None reported'}
                            </strong>
                          </div>
                          <div>
                            • Dietary Restrictions: <strong>
                              {clinicalData.healthCondition.dietaryRestrictions?.join(', ') || 'Normal diet'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {clinicalData.healthCondition.specialCareNotes && (
                        <div style={{ gridColumn: '1 / -1', padding: '1rem', backgroundColor: '#FFF7ED', borderRadius: '8px', border: '1px solid #FED7AA' }}>
                          <strong style={{ color: '#FF7A00', display: 'block', marginBottom: '4px' }}>Family Caregiver Special Note:</strong>
                          <span style={{ fontSize: '0.9rem' }}>{clinicalData.healthCondition.specialCareNotes}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: '#6B7280' }}>Health condition view restricted by patient privacy settings.</div>
                  )}
                </div>
              )}

              {/* SECTION 4: PRESCRIPTIONS */}
              {activeSection === 'prescriptions' && (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: '0 0 1rem 0' }}>Prescription Records</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {clinicalData.prescriptions?.map((rx: any) => (
                      <div key={rx.id} style={{
                        padding: '1rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        backgroundColor: '#F9FAFB'
                      }}>
                        <div style={{ fontWeight: 700, color: '#1F2937' }}>
                          {rx.doctorName || 'Attending Physician'} • {rx.hospitalName || 'Clinic'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: '2px' }}>
                          Date: {new Date(rx.prescriptionDate).toLocaleDateString()} • Extracted Pills: {rx.medicationCount}
                        </div>
                        {rx.notes && (
                          <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>
                            Notes: {rx.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 5: MEDICAL REPORTS */}
              {activeSection === 'reports' && (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                  <h3 style={{ margin: '0 0 1rem 0' }}>Family Authorized Medical Reports</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {clinicalData.medicalReports?.map((r: any) => (
                      <div key={r.id} style={{
                        padding: '1rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        backgroundColor: '#F9FAFB'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#1F2937' }}>{r.type}: {r.fileName}</strong>
                          <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                            {new Date(r.documentDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#4B5563', marginTop: '4px' }}>
                          Facility: {r.hospitalName || 'Lab'} • Signoff: {r.doctorName || 'Physician'}
                        </div>
                        {r.aiSummary && (
                          <div style={{
                            marginTop: '0.5rem',
                            padding: '0.6rem',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            fontSize: '0.82rem',
                            color: '#374151'
                          }}>
                            <strong>Plain Explainer:</strong> {r.aiSummary}
                          </div>
                        )}
                        {r.previewAvailable && r.fileUrl && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <a
                              href={r.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                color: '#FF7A00',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                textDecoration: 'none'
                              }}
                            >
                              <ExternalLink size={14} /> Open Document File
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: SESSION ENDED */}
          {step === 'ended' && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              padding: '3rem 2rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              maxWidth: '550px',
              margin: '0 auto',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <CheckCircle2 size={32} />
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                Session Closed Securely
              </h2>
              <p style={{ color: '#4B5563', fontSize: '0.92rem', marginBottom: '2rem' }}>
                Your temporary access session has been closed and logged in the senior profile audit trail. Clinical details have been safely unloaded.
              </p>

              <button
                onClick={() => {
                  setStep('scan');
                  setTokenInput('');
                  setPatientPreview(null);
                  setClinicalData(null);
                  setErrorMsg(null);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#FF7A00',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                Scan Another Senior QR
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
