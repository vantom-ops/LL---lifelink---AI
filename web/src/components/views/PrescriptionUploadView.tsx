import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { 
  UploadCloud, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';

export const PrescriptionUploadView: React.FC = () => {
  const { activeSenior } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activePrescription, setActivePrescription] = useState<any | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadPrescriptions = async () => {
    if (!activeSenior) return;
    try {
      const res = await api.get(`/prescriptions/patient/${activeSenior._id}`);
      if (res.success) {
        setPrescriptions(res.data.prescriptions || []);
      }
    } catch (err: any) {
      console.error('[PrescriptionView] Error loading prescriptions:', err);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [activeSenior?._id]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !activeSenior) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patientId', activeSenior._id);

      const res = await api.post('/prescriptions/upload', formData);
      if (res.success) {
        const pres = res.data.prescription;
        setActivePrescription(pres);
        // Map candidates to editable list
        setCandidates(pres.extractedMedications.map((c: any) => ({
          name: c.medicineName,
          genericName: c.genericName || '',
          dose: c.dose,
          unit: c.unit || 'mg',
          frequency: c.frequency || 'Once Daily',
          timing: c.timing || 'Morning',
          foodRelation: c.foodInstruction?.toLowerCase().includes('before') ? 'BEFORE_MEAL' : 'AFTER_MEAL',
          confidence: c.confidence || 0.85,
          scheduleTime: '08:00'
        })));
        setSelectedFile(null);
        loadPrescriptions();
      }
    } catch (err: any) {
      alert('Upload & OCR failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVerifyAndActivate = async () => {
    if (!activePrescription) return;

    try {
      setConfirming(true);
      const payload = {
        confirmedMedications: candidates.map(c => ({
          name: c.name,
          genericName: c.genericName,
          dose: c.dose,
          unit: c.unit,
          instructions: `${c.frequency} - ${c.foodRelation}`,
          foodRelation: c.foodRelation,
          schedules: [
            {
              time: c.scheduleTime || '08:00',
              frequency: 'DAILY',
              label: `${c.timing || 'Morning'} Dose`
            }
          ]
        }))
      };

      const res = await api.post(`/prescriptions/${activePrescription._id}/verify`, payload);
      if (res.success) {
        setSuccessMessage('Prescription verified and active medication schedules created!');
        setActivePrescription(null);
        setCandidates([]);
        loadPrescriptions();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: any) {
      alert('Error verifying prescription: ' + err.message);
    } finally {
      setConfirming(false);
    }
  };

  const updateCandidate = (index: number, field: string, value: any) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };

  const removeCandidate = (index: number) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const addManualCandidate = () => {
    setCandidates([
      ...candidates,
      {
        name: '',
        genericName: '',
        dose: '1',
        unit: 'tablet',
        frequency: 'Once Daily',
        timing: 'Morning',
        foodRelation: 'AFTER_MEAL',
        confidence: 1.0,
        scheduleTime: '08:00'
      }
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Prescription Upload & OCR Extraction</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
          Upload doctor prescriptions to automatically extract medicine candidates with AI & OCR.
        </p>
      </div>

      {successMessage && (
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
          <span>{successMessage}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="card" style={{ border: '2px dashed var(--border)', textAlign: 'center', padding: '2.5rem' }}>
        <form onSubmit={handleFileUpload} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <UploadCloud size={32} />
          </div>

          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>Upload Prescription Scan or PDF</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Supports JPG, PNG, WEBP, AVIF, TIFF, and PDF documents
            </p>
          </div>

          <input
            type="file"
            id="prescription-file"
            accept="image/*,application/pdf,.avif,.bmp,.tiff"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }}
          />

          <label
            htmlFor="prescription-file"
            className="btn btn-secondary"
            style={{ cursor: 'pointer' }}
          >
            {selectedFile ? selectedFile.name : 'Choose File from Computer'}
          </label>

          {selectedFile && (
            <button
              type="submit"
              disabled={uploading}
              className="btn btn-primary"
              style={{ marginTop: '0.5rem' }}
            >
              <Sparkles size={16} />
              <span>{uploading ? 'Scanning & Extracting with OCR...' : 'Run OCR & Extract Medications'}</span>
            </button>
          )}
        </form>
      </div>

      {/* OCR CANDIDATE REVIEW & VERIFICATION WORKFLOW */}
      {activePrescription && (
        <div className="card" style={{ border: '2px solid var(--primary)', backgroundColor: '#FFFFFF' }}>
          {/* CRITICAL SAFETY CALLOUT */}
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            display: 'flex',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <ShieldAlert size={22} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.88rem', color: '#92400E' }}>
              <strong>Safety Guardrail Active:</strong> OCR and AI extraction never automatically activate a medication schedule. You (the caregiver) must review each extracted candidate, correct any values, and confirm below before schedules become active.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Review Extracted Medication Candidates</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Doctor: {activePrescription.doctorName || 'General Practitioner'} • Hospital: {activePrescription.hospitalName || 'Clinic'}
              </div>
            </div>
            <button onClick={addManualCandidate} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>
              <Plus size={14} />
              <span>Add Candidate</span>
            </button>
          </div>

          {/* Candidates Table / List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {candidates.map((c, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-warm)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) 40px',
                  gap: '0.75rem',
                  alignItems: 'center'
                }}
              >
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={c.name}
                    onChange={e => updateCandidate(idx, 'name', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>
                    Dose & Unit *
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      required
                      className="input-field"
                      style={{ width: '60%' }}
                      value={c.dose}
                      onChange={e => updateCandidate(idx, 'dose', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-field"
                      style={{ width: '40%' }}
                      value={c.unit}
                      onChange={e => updateCandidate(idx, 'unit', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>
                    Frequency
                  </label>
                  <select
                    className="input-field"
                    value={c.frequency}
                    onChange={e => updateCandidate(idx, 'frequency', e.target.value)}
                  >
                    <option value="Once Daily">Once Daily</option>
                    <option value="Twice Daily">Twice Daily</option>
                    <option value="Thrice Daily">Thrice Daily</option>
                    <option value="As Needed">As Needed</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>
                    Food Instruction
                  </label>
                  <select
                    className="input-field"
                    value={c.foodRelation}
                    onChange={e => updateCandidate(idx, 'foodRelation', e.target.value)}
                  >
                    <option value="AFTER_MEAL">After food</option>
                    <option value="BEFORE_MEAL">Before food</option>
                    <option value="EMPTY_STOMACH">Empty stomach</option>
                    <option value="WITH_MEAL">With meal</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>
                    Schedule Time
                  </label>
                  <input
                    type="time"
                    className="input-field"
                    value={c.scheduleTime}
                    onChange={e => updateCandidate(idx, 'scheduleTime', e.target.value)}
                  />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>
                    OCR Conf.
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: c.confidence > 0.85 ? 'var(--success)' : 'var(--warning)' }}>
                    {Math.round(c.confidence * 100)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeCandidate(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title="Remove candidate"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => {
                setActivePrescription(null);
                setCandidates([]);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleVerifyAndActivate}
              disabled={confirming || candidates.length === 0}
              className="btn btn-primary"
            >
              <CheckCircle2 size={16} />
              <span>{confirming ? 'Activating Schedules...' : 'Verify & Activate Medications'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Historical Prescriptions List */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Prescription History</h3>
        {prescriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No prescriptions uploaded yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {prescriptions.map(p => (
              <div
                key={p._id}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={22} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {p.originalFileName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Date: {new Date(p.prescriptionDate || p.createdAt).toLocaleDateString()} • {p.extractedMedications?.length || 0} candidate(s) detected
                    </div>
                  </div>
                </div>

                <span className={`badge ${p.verificationStatus === 'VERIFIED' ? 'badge-taken' : 'badge-pending'}`}>
                  {p.verificationStatus}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
