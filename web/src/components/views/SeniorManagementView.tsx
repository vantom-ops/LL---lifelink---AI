import React, { useState } from 'react';
import { useAuth, SeniorProfile } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { UserPlus, QrCode, Phone, ShieldCheck, Check, Copy } from 'lucide-react';

interface SeniorManagementViewProps {
  onOpenSeniorProfile?: () => void;
}

export const SeniorManagementView: React.FC<SeniorManagementViewProps> = ({ onOpenSeniorProfile }) => {
  const { seniors, activeSenior, setActiveSenior, refreshSeniors } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [selectedSeniorForPairing, setSelectedSeniorForPairing] = useState<SeniorProfile | null>(null);
  const [pairingData, setPairingData] = useState<{ code: string; qrCodeDataUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // New Senior Form State
  const [formData, setFormData] = useState({
    fullName: '',
    preferredName: '',
    age: '',
    gender: 'female',
    emergencyContactName: '',
    emergencyContactPhone: '',
    languagePreference: 'English',
    relationship: 'Daughter'
  });

  const handleCreateSenior = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/patients', {
        ...formData,
        age: parseInt(formData.age, 10)
      });
      if (res.success) {
        setShowCreateModal(false);
        setFormData({
          fullName: '',
          preferredName: '',
          age: '',
          gender: 'female',
          emergencyContactName: '',
          emergencyContactPhone: '',
          languagePreference: 'English',
          relationship: 'Daughter'
        });
        await refreshSeniors();
      }
    } catch (err: any) {
      alert('Error creating senior profile: ' + err.message);
    }
  };

  const openPairing = async (senior: SeniorProfile) => {
    setSelectedSeniorForPairing(senior);
    setShowPairingModal(true);
    setPairingData(null);
    try {
      const res = await api.post('/pairing/generate', { patientId: senior._id });
      if (res.success) {
        setPairingData(res.data);
      }
    } catch (err: any) {
      alert('Error generating pairing code: ' + err.message);
    }
  };

  const copyToClipboard = () => {
    if (pairingData?.code) {
      navigator.clipboard.writeText(pairingData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Senior Profiles & Device Linking</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage elderly family members and securely pair their smartphones with LL LifeLink.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <UserPlus size={18} />
          <span>Add New Senior</span>
        </button>
      </div>

      {/* Senior Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {seniors.map(senior => {
          const isSelected = activeSenior?._id === senior._id;

          return (
            <div
              key={senior._id}
              className="card"
              style={{
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                position: 'relative'
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px'
                }}>
                  ACTIVE
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.5rem'
                }}>
                  {senior.preferredName ? senior.preferredName[0] : senior.fullName[0]}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                    {senior.fullName} {senior.preferredName && `("${senior.preferredName}")`}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {senior.age} years • Voice: {senior.languagePreference}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
                <div><strong>Emergency Contact:</strong> {senior.emergencyContactName}</div>
                <div><strong>Phone:</strong> {senior.emergencyContactPhone}</div>
                <div>
                  <strong>Phone Pairing Status:</strong>{' '}
                  <span className={`badge ${senior.linkedUserId ? 'badge-taken' : 'badge-pending'}`}>
                    {senior.linkedUserId ? 'Linked & Active' : 'Not Linked Yet'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button
                  onClick={() => openPairing(senior)}
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                >
                  <QrCode size={15} color="var(--primary)" />
                  <span>{senior.linkedUserId ? 'Re-pair Device' : 'Pair Phone'}</span>
                </button>
                {!isSelected && (
                  <button
                    onClick={() => setActiveSenior(senior)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.85rem' }}
                  >
                    Select
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE SENIOR MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Add New Senior Profile</h3>
            <form onSubmit={handleCreateSenior} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Kalyani Ammal"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Preferred Calling Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Paati / Mom"
                    value={formData.preferredName}
                    onChange={e => setFormData({ ...formData, preferredName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Age (Years) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="input-field"
                    placeholder="78"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Emergency Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. Ananya Raman"
                    value={formData.emergencyContactName}
                    onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Emergency Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="+91 98400 12345"
                    value={formData.emergencyContactPhone}
                    onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Voice Reminder Language (Spoken to Senior)
                </label>
                <select
                  className="input-field"
                  value={formData.languagePreference}
                  onChange={e => setFormData({ ...formData, languagePreference: e.target.value })}
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Tanglish">Tanglish (Friendly Tamil-English)</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Telugu">Telugu</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Senior Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAIRING MODAL WITH QR CODE & 6-DIGIT CODE */}
      {showPairingModal && selectedSeniorForPairing && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>
              Pair Phone for {selectedSeniorForPairing.preferredName || selectedSeniorForPairing.fullName}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Open LL LifeLink on the senior’s phone and scan this QR code or enter the 6-digit code.
            </p>

            {pairingData ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                {/* QR Code */}
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: '2px solid var(--border)',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <img
                    src={pairingData.qrCodeDataUrl}
                    alt="Pairing QR Code"
                    style={{ width: '220px', height: '220px', display: 'block' }}
                  />
                </div>

                {/* 6-Digit Code */}
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    OR ENTER THIS PAIRING CODE MANUALLY:
                  </div>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    color: 'var(--primary)',
                    margin: '0.5rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <span>{pairingData.code}</span>
                    <button
                      onClick={copyToClipboard}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex'
                      }}
                      title="Copy code"
                    >
                      {copied ? <Check size={20} color="var(--success)" /> : <Copy size={20} color="var(--text-muted)" />}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                    Code valid for 24 hours. Becomes invalid immediately after pairing.
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--bg-warm)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  textAlign: 'left',
                  width: '100%',
                  marginTop: '0.5rem'
                }}>
                  <strong>Security notice:</strong> Once paired, this phone will receive voice reminders and can send one-tap confirmation without needing complex passwords.
                </div>
              </div>
            ) : (
              <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                Generating one-time pairing key...
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowPairingModal(false);
                  refreshSeniors();
                }}
                className="btn btn-secondary"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
