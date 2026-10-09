import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
  Heart, 
  CheckCircle, 
  Clock, 
  Volume2, 
  QrCode, 
  Phone, 
  KeyRound, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  ShieldCheck, 
  UserCheck,
  HeartHandshake,
  HelpCircle,
  PhoneCall,
  ShieldAlert,
  AlertTriangle,
  X
} from 'lucide-react';

interface SeniorPatientWebViewProps {
  onSwitchToMonitor: () => void;
}

export const SeniorPatientWebView: React.FC<SeniorPatientWebViewProps> = ({ onSwitchToMonitor }) => {
  const [pairingCode, setPairingCode] = useState('');
  const [isPaired, setIsPaired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [showDoctorQr, setShowDoctorQr] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Phase 2 Disability Assistance State
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpReason, setHelpReason] = useState('Cannot open child-proof medicine bottle cap due to joint pain.');
  const [medicineLocation, setMedicineLocation] = useState('Dining table wooden medicine organizer');
  const [activeAssistance, setActiveAssistance] = useState<any>(null);
  const [requestingHelp, setRequestingHelp] = useState(false);

  // Check if patient session already saved locally
  useEffect(() => {
    const savedSenior = localStorage.getItem('ll_patient_web_session');
    if (savedSenior) {
      try {
        const parsed = JSON.parse(savedSenior);
        setPatient(parsed);
        setIsPaired(true);
        loadPatientEvents(parsed._id || parsed.id);
        loadActiveAssistance();
      } catch {
        // ignore
      }
    }
  }, []);

  const loadActiveAssistance = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/assistance');
      const data = await res.json();
      if (data.success && data.data.requests) {
        const found = data.data.requests.find((r: any) => 
          !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(r.status)
        );
        setActiveAssistance(found || null);
      }
    } catch {
      // ignore
    }
  };

  const loadPatientEvents = async (patientId: string) => {
    try {
      const res = await api.get(`/medication-events/today/${patientId}`);
      if (res.success && res.data && Array.isArray(res.data.events)) {
        setEvents(res.data.events);
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      console.error('Failed to load medication events:', err);
      setEvents([]);
    }
  };

  const handlePair = async (codeToUse?: string) => {
    const code = (codeToUse || pairingCode).trim().toUpperCase();
    if (!code) {
      setError('Please enter your 6-digit pairing code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/pairing/pair', {
        code,
        deviceInfo: { deviceName: 'Web Browser Patient Portal' }
      });

      if (res.success && res.data && res.data.patient) {
        const p = res.data.patient;
        setPatient(p);
        setIsPaired(true);
        localStorage.setItem('ll_patient_web_session', JSON.stringify(p));
        await loadPatientEvents(p._id || p.id);
        setSuccessToast(`Welcome ${p.preferredName || p.fullName}! Connected securely to Caregiver.`);
      } else {
        throw new Error(res.message || 'Invalid pairing code');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired pairing code. Please generate a fresh code on the Caregiver Dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTaken = async (eventId: string, medName: string) => {
    setEvents(prev =>
      prev.map(ev =>
        ev.id === eventId || ev._id === eventId
          ? { ...ev, isTaken: true, takenAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          : ev
      )
    );
    setSuccessToast(`Marked ${medName} as taken! Caregiver notified.`);
    setTimeout(() => setSuccessToast(null), 3000);

    // Speak confirmation
    speak(`Nandri Paati! You have confirmed taking ${medName}. Have a wonderful day.`);

    try {
      await api.post(`/medication-events/${eventId}/confirm-taken`, {
        patientId: patient?._id || patient?.id,
        takenTime: new Date().toISOString()
      });
    } catch {
      // Local optimistic update already completed
    }
  };

  const handleRequestHelp = async (medEvent?: any) => {
    if (!patient?._id && !patient?.id) {
      alert('Patient session not found. Please pair your device first.');
      return;
    }
    try {
      setRequestingHelp(true);
      const res = await fetch('http://localhost:5000/api/assistance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient._id || patient.id,
          medicationEventId: medEvent?.id || medEvent?._id,
          reason: helpReason,
          medicineLocationNotes: medicineLocation,
          priority: 'HIGH'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveAssistance(data.data.request);
        setShowHelpModal(false);
        setSuccessToast('Help requested. Your primary caregiver and care circle are alerted!');
        speak('Paati, help request sent. Your family and care circle are notified.');
      } else {
        alert(data.message || 'Failed to submit assistance request');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRequestingHelp(false);
    }
  };

  const handleCancelAssistance = async () => {
    if (!activeAssistance) return;
    try {
      await fetch(`http://localhost:5000/api/assistance/${activeAssistance._id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Patient cancelled request' })
      });
      setActiveAssistance(null);
      setSuccessToast('Assistance request cancelled.');
      speak('Assistance request cancelled.');
    } catch (err) {
      console.error(err);
    }
  };

  const speak = (text: string) => {
    setSpeakingText(text);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeakingText(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setSpeakingText(null), 3500);
    }
  };

  // 1. NOT PAIRED YET: Code Login Screen (Matches Image 2)
  if (!isPaired) {
    return (
      <div style={{
        maxWidth: '680px',
        margin: '2rem auto',
        padding: '2.5rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '24px',
        border: '2px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center'
      }}>
        {/* Role header switch */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#DCFCE7',
            color: '#16A34A',
            padding: '4px 12px',
            borderRadius: '999px',
            fontWeight: 800,
            fontSize: '0.85rem'
          }}>
            <UserCheck size={16} />
            PATIENT MODE (SENIOR)
          </div>

          <button
            onClick={onSwitchToMonitor}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
          >
            ← Switch to Monitor (Caregiver)
          </button>
        </div>

        {/* Icon */}
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          backgroundColor: '#FFF0DE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: 'var(--primary)'
        }}>
          <KeyRound size={42} />
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Enter Pairing Code
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '440px', margin: '0 auto 2rem', lineHeight: 1.5 }}>
          Ask your son, daughter or caregiver for the 6-digit code shown on their web dashboard.
        </p>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            border: '1px solid rgba(220, 38, 38, 0.3)'
          }}>
            {error}
          </div>
        )}

        {/* Code Input */}
        <div style={{ marginBottom: '1.25rem' }}>
          <input
            type="text"
            value={pairingCode}
            onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
            placeholder="LL-882200"
            maxLength={10}
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '1rem',
              fontSize: '1.8rem',
              textAlign: 'center',
              fontWeight: 800,
              letterSpacing: '4px',
              borderRadius: '16px',
              border: '2px solid var(--border)',
              outline: 'none',
              color: 'var(--primary)'
            }}
          />
        </div>

        {/* Confirm Button */}
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={() => handlePair()}
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '1rem',
              fontSize: '1.15rem',
              fontWeight: 800,
              borderRadius: '14px'
            }}
          >
            {loading ? 'Verifying Code...' : 'Confirm & Link Phone'}
          </button>
        </div>

        <div style={{
          marginTop: '0.5rem',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          maxWidth: '380px',
          width: '100%',
          textAlign: 'center',
          fontSize: '0.85rem',
          color: '#64748B'
        }}>
          💡 <strong>How to pair:</strong> Your caregiver generates this 6-character code from their dashboard by clicking <strong>"Pair Phone"</strong>.
        </div>
      </div>
    );
  }

  // 2. PAIRED: Full Senior Tablet/Desktop Experience
  const nextPending = events.find(e => !e.isTaken);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Mode Switcher */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)',
        border: '2px solid rgba(22, 163, 74, 0.3)',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#16A34A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            fontWeight: 800
          }}>
            KA
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Vanakkam, {patient?.preferredName || 'Paati'}!
              </span>
              <span style={{
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px'
              }}>
                ● ONLINE & PROTECTED
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: '2px 0 0' }}>
              Language: {patient?.languagePreference || 'Tamil'} • Emergency: {patient?.emergencyContactName || 'Jegan (Son)'} ({patient?.emergencyContactPhone || '+91 98400 12345'})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowDoctorQr(true)}
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <QrCode size={18} color="var(--primary)" />
            Doctor QR Pass
          </button>

          <button
            onClick={onSwitchToMonitor}
            className="btn btn-primary"
            style={{ fontWeight: 700 }}
          >
            Switch to Monitor Mode (Caregiver)
          </button>
        </div>
      </div>

      {/* Speaking Voice Toast */}
      {speakingText && (
        <div style={{
          backgroundColor: '#FFF7ED',
          border: '2px solid var(--primary)',
          borderRadius: '16px',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--primary)'
        }}>
          <Volume2 size={28} className="pulse" />
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
            🔊 Voice Reminder: "{speakingText}"
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successToast && (
        <div style={{
          backgroundColor: '#DCFCE7',
          border: '2px solid #16A34A',
          borderRadius: '16px',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#16A34A',
          fontWeight: 800,
          fontSize: '1.05rem'
        }}>
          <CheckCircle size={24} />
          {successToast}
        </div>
      )}

      {/* Active Disability Assistance Banner for Senior */}
      {activeAssistance && (
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '3px solid #F97316',
          borderRadius: '24px',
          padding: '1.5rem 2rem',
          boxShadow: '0 8px 24px rgba(249, 115, 22, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldAlert size={32} color="#EA580C" />
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#C2410C', textTransform: 'uppercase' }}>
                  PHYSICAL ASSISTANCE ACTIVE
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1F2937', margin: 0 }}>
                  Help Is On The Way!
                </h3>
              </div>
            </div>

            <span style={{
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              padding: '0.4rem 0.9rem',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}>
              STAGE: {activeAssistance.status?.replace(/_/g, ' ')}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '1rem', color: '#4B5563' }}>
            Reason: <strong>"{activeAssistance.reason}"</strong>
          </p>

          {activeAssistance.acceptedBy && (
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <UserCheck size={24} color="#16A34A" />
              <div>
                <div style={{ fontWeight: 800, color: '#166534', fontSize: '1.05rem' }}>
                  Helper Accepted: {activeAssistance.acceptedBy.helperName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#15803D' }}>
                  Role: {activeAssistance.acceptedBy.helperType?.replace(/_/g, ' ')} • Phone: {activeAssistance.acceptedBy.helperPhone}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={handleCancelAssistance}
              style={{
                backgroundColor: '#F3F4F6',
                color: '#4B5563',
                border: '1px solid #D1D5DB',
                borderRadius: '12px',
                padding: '0.6rem 1.25rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancel Request
            </button>
            <a
              href="tel:108"
              style={{
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '0.6rem 1.25rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none'
              }}
            >
              <PhoneCall size={18} />
              Emergency 108 Call
            </a>
          </div>
        </div>
      )}

      {/* Big Hero Card: Next Scheduled Medication */}
      {nextPending ? (
        <div className="card" style={{
          backgroundColor: '#FFF7ED',
          border: '3px solid var(--primary)',
          padding: '2.5rem',
          borderRadius: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            padding: '6px 18px',
            borderRadius: '999px',
            fontWeight: 800,
            fontSize: '0.95rem',
            marginBottom: '1rem'
          }}>
            <Clock size={18} />
            NEXT SCHEDULED DOSE
          </div>

          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
            {nextPending.medicationName}
          </h1>

          <p style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 800, margin: '0 0 1rem' }}>
            {nextPending.dose} {nextPending.unit} • {nextPending.foodRelation?.replace('_', ' ')}
          </p>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto 2rem' }}>
            {nextPending.instructions || 'Please take with warm water as directed by your doctor.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => speak(`Paati, please take your ${nextPending.medicationName} ${nextPending.dose} ${nextPending.instructions}`)}
              className="btn btn-outline"
              style={{
                fontSize: '1.2rem',
                padding: '1rem 2rem',
                borderRadius: '18px',
                fontWeight: 800,
                borderColor: 'var(--primary)',
                color: 'var(--primary)'
              }}
            >
              <Volume2 size={24} />
              Hear Instructions
            </button>

            <button
              onClick={() => handleConfirmTaken(nextPending.id || nextPending._id, nextPending.medicationName)}
              className="btn"
              style={{
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                fontSize: '1.25rem',
                padding: '1rem 2.4rem',
                borderRadius: '18px',
                fontWeight: 900,
                boxShadow: '0 6px 20px rgba(22, 163, 74, 0.4)'
              }}
            >
              <CheckCircle size={28} />
              I Took This Medicine
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              className="btn"
              style={{
                backgroundColor: '#F97316',
                color: '#FFFFFF',
                fontSize: '1.25rem',
                padding: '1rem 2.2rem',
                borderRadius: '18px',
                fontWeight: 900,
                boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <HeartHandshake size={26} />
              NEED HELP (Physical Assistance)
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{
          backgroundColor: '#DCFCE7',
          border: '2px solid #16A34A',
          padding: '2.5rem',
          textAlign: 'center',
          borderRadius: '24px'
        }}>
          <CheckCircle size={56} color="#16A34A" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#166534', margin: '0 0 0.5rem' }}>
            All Scheduled Medicines Completed!
          </h2>
          <p style={{ color: '#15803D', fontSize: '1.1rem', margin: 0 }}>
            Great job Paati! All your doses for today are confirmed. Your caregiver is relaxed and notified.
          </p>
        </div>
      )}

      {/* All Today's Doses List */}
      <div className="card" style={{ padding: '2rem', borderRadius: '24px' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-main)' }}>
          Today's Complete Schedule
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {events.map((ev, idx) => {
            const isTaken = ev.isTaken;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.5rem',
                  borderRadius: '16px',
                  backgroundColor: isTaken ? '#F0FDF4' : '#FFFDF9',
                  border: isTaken ? '1.5px solid #86EFAC' : '1.5px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: isTaken ? '#DCFCE7' : '#FFF0DE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isTaken ? '#16A34A' : 'var(--primary)'
                  }}>
                    {isTaken ? <CheckCircle size={26} /> : <Clock size={26} />}
                  </div>

                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {ev.medicationName} ({ev.dose} {ev.unit})
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {ev.foodRelation?.replace('_', ' ')} • {ev.instructions}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={() => speak(`Reminder for ${ev.medicationName}. Dose: ${ev.dose}. Instructions: ${ev.instructions}`)}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 0.8rem', borderRadius: '10px' }}
                    title="Audio Readout"
                  >
                    <Volume2 size={20} color="var(--primary)" />
                  </button>

                  {isTaken ? (
                    <span style={{
                      backgroundColor: '#DCFCE7',
                      color: '#16A34A',
                      fontWeight: 800,
                      padding: '8px 16px',
                      borderRadius: '12px',
                      fontSize: '0.95rem'
                    }}>
                      ✓ Taken ({ev.takenAt || 'Verified'})
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConfirmTaken(ev.id || ev._id, ev.medicationName)}
                      className="btn"
                      style={{
                        backgroundColor: '#16A34A',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        padding: '8px 18px',
                        borderRadius: '12px',
                        fontSize: '0.95rem'
                      }}
                    >
                      I Took It
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Doctor QR Modal */}
      {showDoctorQr && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Doctor Access QR Pass
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Show this to your doctor or pharmacist. They will scan it to view your verified medication history and allergies.
            </p>

            <div style={{
              width: '200px',
              height: '200px',
              backgroundColor: '#FFF7ED',
              border: '2px dashed var(--primary)',
              borderRadius: '20px',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={150} color="var(--text-main)" />
            </div>

            <p style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Token: llqr_351f93de14e9d68ceac3067175fc5e030f86d50c5e046fcb
            </p>

            <button
              onClick={() => setShowDoctorQr(false)}
              className="btn btn-primary"
              style={{ width: '100%', fontWeight: 700 }}
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* Phase 2: Senior Disability Assistance Request Modal */}
      {showHelpModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '540px', width: '100%', padding: '2rem', textAlign: 'left', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartHandshake size={28} color="#EA580C" />
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1F2937', margin: 0 }}>
                  Need Physical Help?
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
              >
                <X size={24} />
              </button>
            </div>

            <p style={{ color: '#4B5563', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              If you cannot independently reach, open or take your scheduled medicine, we will alert your daughter Ananya and your Care Circle right now.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#374151' }}>
                Select Physical Difficulty Reason:
              </label>

              {[
                'Cannot open child-proof medicine bottle cap due to joint pain.',
                'Cannot reach medicine organizer or high cabinet.',
                'Experiencing shaky hands or severe physical tremors.',
                'Need assistance pouring water & standing up safely.',
                'Temporary weakness / bedridden today.'
              ].map((reason, idx) => (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: helpReason === reason ? '2px solid var(--primary)' : '1px solid #E5E7EB',
                    backgroundColor: helpReason === reason ? '#FFF7ED' : '#FFFFFF',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: helpReason === reason ? 700 : 500,
                    color: helpReason === reason ? '#C2410C' : '#374151'
                  }}
                >
                  <input
                    type="radio"
                    name="disability_reason"
                    checked={helpReason === reason}
                    onChange={() => setHelpReason(reason)}
                    style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                  />
                  {reason}
                </label>
              ))}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#374151', marginBottom: '0.35rem' }}>
                Medicine Location in Your House:
              </label>
              <input
                type="text"
                value={medicineLocation}
                onChange={(e) => setMedicineLocation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleRequestHelp(nextPending)}
                disabled={requestingHelp}
                style={{
                  padding: '0.75rem 1.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(255, 122, 0, 0.35)'
                }}
              >
                <HeartHandshake size={20} />
                {requestingHelp ? 'Sending Alert...' : 'Dispatch Assistance Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
