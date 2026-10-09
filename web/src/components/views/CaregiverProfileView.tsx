import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Bell, 
  HeartHandshake, 
  Users, 
  CheckCircle2, 
  Smartphone, 
  Edit3, 
  Save, 
  Plus, 
  ExternalLink 
} from 'lucide-react';

interface CaregiverProfileViewProps {
  onOpenSeniorProfile?: () => void;
  onOpenPairingModal?: () => void;
}

export const CaregiverProfileView: React.FC<CaregiverProfileViewProps> = ({
  onOpenSeniorProfile,
  onOpenPairingModal
}) => {
  const { user } = useAuth();
  const [caregiverData, setCaregiverData] = useState<any>(null);
  const [linkedSeniors, setLinkedSeniors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    relationshipToSenior: 'Daughter',
    preferredLanguage: 'English',
    notificationPreference: 'all'
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/caregivers/me');
      if (res.success) {
        const c = res.data.caregiver;
        setCaregiverData(c);
        setLinkedSeniors(res.data.linkedSeniors || []);
        setForm({
          fullName: c.fullName || user?.name || '',
          phone: c.phone || '',
          address: c.address || '',
          relationshipToSenior: c.relationshipToSenior || 'Daughter',
          preferredLanguage: c.preferredLanguage || 'English',
          notificationPreference: c.notificationPreference || 'all'
        });
      }
    } catch (err: any) {
      console.error('[CaregiverProfileView] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put('/caregivers/me', form);
      if (res.success) {
        setSaveSuccess('Caregiver profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(null), 3000);
        loadProfile();
      }
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const c = caregiverData || user;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px' }}>
      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF7ED 100%)',
        border: '1px solid rgba(255, 122, 0, 0.2)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.2rem',
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(255, 122, 0, 0.25)',
              border: '4px solid #FFFFFF'
            }}>
              {(c?.fullName || c?.name || 'A').charAt(0)}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {c?.fullName || c?.name}
                </h1>
                <span className="badge badge-success">Primary Caregiver</span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                {c?.email} • {c?.relationshipToSenior || 'Family Caregiver'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {!isEditing ? (
              <button 
                className="btn btn-primary" 
                onClick={() => setIsEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <Edit3 size={16} /> Edit Profile
              </button>
            ) : (
              <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            )}
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

      {/* Profile Details & Form */}
      <div className="card">
        <h3 style={{ margin: '0 0 1.25rem 0', color: 'var(--text-main)' }}>Caregiver Personal Details</h3>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control"
                disabled={!isEditing}
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Relationship to Senior *</label>
              <input
                type="text"
                className="form-control"
                disabled={!isEditing}
                value={form.relationshipToSenior}
                onChange={e => setForm({ ...form, relationshipToSenior: e.target.value })}
                placeholder="e.g. Daughter / Son / Family Physician"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-control"
                disabled={!isEditing}
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98400 12345"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Account Email (Login)</label>
              <input
                type="email"
                className="form-control"
                disabled
                value={c?.email || ''}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Language</label>
              <select
                className="form-control"
                disabled={!isEditing}
                value={form.preferredLanguage}
                onChange={e => setForm({ ...form, preferredLanguage: e.target.value })}
              >
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notification Preference</label>
              <select
                className="form-control"
                disabled={!isEditing}
                value={form.notificationPreference}
                onChange={e => setForm({ ...form, notificationPreference: e.target.value })}
              >
                <option value="all">All Alerts (Medication, Missed, Escalations)</option>
                <option value="critical_only">Critical Escalations Only (5-min no-response)</option>
                <option value="sms_and_push">SMS + Push Notifications</option>
                <option value="push_only">Push Notifications Only</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">Home Address</label>
            <textarea
              className="form-control"
              rows={2}
              disabled={!isEditing}
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="Residential address..."
            />
          </div>

          {isEditing && (
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Save size={18} /> Save Caregiver Details
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Linked Seniors Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--primary)" />
              Connected Senior Profiles ({linkedSeniors.length})
            </h3>
            <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.88rem' }}>
              Grandmother or grandfather accounts managed by this caregiver.
            </p>
          </div>

          {onOpenPairingModal && (
            <button 
              className="btn btn-primary"
              onClick={onOpenPairingModal}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}
            >
              <Plus size={16} /> Pair Another Senior Phone
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {linkedSeniors.map(senior => (
            <div key={senior.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: '#FFFFFF',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800
                }}>
                  {(senior.preferredName || senior.fullName).charAt(0)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>
                      {senior.preferredName || senior.fullName}
                    </strong>
                    <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                      {senior.age} yrs
                    </span>
                    <span className="badge badge-success">Connected</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Relation: <strong>{senior.relationship}</strong> • Care Status: <em>{senior.careStatus}</em>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: '2px' }}>
                    Device Pairing: <strong style={{ color: senior.devicePairingStatus === 'PAIRED' ? '#16A34A' : '#D97706' }}>
                      {senior.devicePairingStatus}
                    </strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>MEDICATION STATUS</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {senior.medicationStatus.activeMedicationsCount} Active Pills • {senior.medicationStatus.adherenceRate} Adherence
                  </div>
                  {senior.medicationStatus.nextMedication && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                      Next: {senior.medicationStatus.nextMedication.medicationName}
                    </div>
                  )}
                </div>

                {onOpenSeniorProfile && (
                  <button 
                    className="btn btn-outline"
                    onClick={onOpenSeniorProfile}
                    style={{ fontSize: '0.88rem', fontWeight: 600 }}
                  >
                    View Full Profile & QR
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
