import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Settings, RefreshCw, Zap, ShieldCheck, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, seniors, refreshSeniors } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleReSeed = async () => {
    if (!confirm('This will restore fresh baseline senior profiles, prescriptions, and scheduled medications in the database. Continue?')) {
      return;
    }

    try {
      setSeeding(true);
      const res = await api.post('/demo/seed');
      if (res.success) {
        setSeedSuccess(true);
        await refreshSeniors();
        setTimeout(() => setSeedSuccess(false), 3000);
      }
    } catch (err: any) {
      alert('Error re-seeding database: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '780px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>System Settings & Platform Administration</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Configure caregiver preferences, emergency escalation policies, and administrative database state.
        </p>
      </div>

      {/* Caregiver Account Card */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Caregiver Account</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
          <div><strong>Name:</strong> {user?.name}</div>
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Role:</strong> <span className="badge badge-due">{user?.role}</span></div>
          <div><strong>Connected Seniors:</strong> {seniors.length} profile(s)</div>
        </div>
      </div>

      {/* Database Management Card */}
      <div className="card" style={{ border: '2px solid var(--secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Zap size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Administrative Database Management</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
          Reinitialize the primary MongoDB database collections with calibrated baseline patient profiles, prescriptions, and CareCircle networks.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleReSeed}
            disabled={seeding}
            className="btn btn-primary"
          >
            <RefreshCw size={16} />
            <span>{seeding ? 'Restoring Database...' : 'Restore Initial Database Seed'}</span>
          </button>
        </div>

        {seedSuccess && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Check size={16} />
            <span>Database restored successfully with verified profiles, medications, and schedules!</span>
          </div>
        )}
      </div>

      {/* Phase 1 / Phase 2 Architectural Scope */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <ShieldCheck size={20} color="var(--success)" />
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Architecture & Scope Boundary</h3>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <strong>Phase 1 Scope:</strong> Senior medication schedules, AI OCR prescription scanner, 5-minute escalation alert engine, long-term health documents, and voice-assisted smartphone confirmation.<br /><br />
          <strong>Phase 2 Extensibility:</strong> Backend MongoDB schemas are structured with extensible fields for neighbor escalation, verified caregiver dispatch, disability assistance marketplace, and payment records without breaking current schema relations.
        </p>
      </div>
    </div>
  );
};
