import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { Plus, Pill, Clock, Archive, CheckCircle, AlertTriangle } from 'lucide-react';

export const MedicationManagementView: React.FC = () => {
  const { activeSenior } = useAuth();
  const [medications, setMedications] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [targetMed, setTargetMed] = useState<any | null>(null);
  const [archiveReason, setArchiveReason] = useState('');

  // Add Med Form
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    dose: '',
    unit: 'mg',
    form: 'Tablet',
    foodRelation: 'AFTER_MEAL',
    instructions: '',
    scheduleTime: '08:00',
    frequency: 'DAILY'
  });

  const loadData = async () => {
    if (!activeSenior) return;
    try {
      setLoading(true);
      const [medRes, schedRes] = await Promise.all([
        api.get(`/medications/patient/${activeSenior._id}?includeArchived=true`),
        api.get(`/schedules/patient/${activeSenior._id}`)
      ]);
      if (medRes.success) setMedications(medRes.data.medications || []);
      if (schedRes.success) setSchedules(schedRes.data.schedules || []);
    } catch (err: any) {
      console.error('[MedicationView] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSenior?._id]);

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSenior) return;

    try {
      const medRes = await api.post('/medications', {
        patientId: activeSenior._id,
        name: formData.name,
        genericName: formData.genericName,
        dose: formData.dose,
        unit: formData.unit,
        form: formData.form,
        foodRelation: formData.foodRelation,
        instructions: formData.instructions
      });

      if (medRes.success) {
        // Create schedule
        await api.post('/schedules', {
          patientId: activeSenior._id,
          medicationId: medRes.data.medication._id,
          time: formData.scheduleTime,
          frequency: formData.frequency,
          label: 'Scheduled Dose'
        });

        setShowAddModal(false);
        setFormData({
          name: '',
          genericName: '',
          dose: '',
          unit: 'mg',
          form: 'Tablet',
          foodRelation: 'AFTER_MEAL',
          instructions: '',
          scheduleTime: '08:00',
          frequency: 'DAILY'
        });
        loadData();
      }
    } catch (err: any) {
      alert('Error adding medication: ' + err.message);
    }
  };

  const handleArchive = async () => {
    if (!targetMed) return;
    try {
      await api.post(`/medications/${targetMed._id}/archive`, { reason: archiveReason });
      setShowArchiveModal(false);
      setTargetMed(null);
      setArchiveReason('');
      loadData();
    } catch (err: any) {
      alert('Error archiving medication: ' + err.message);
    }
  };

  const handleToggleSchedule = async (scheduleId: string, currentEnabled: boolean) => {
    try {
      await api.patch(`/schedules/${scheduleId}/toggle`, { enabled: !currentEnabled });
      loadData();
    } catch (err: any) {
      alert('Error toggling schedule: ' + err.message);
    }
  };

  const activeMeds = medications.filter(m => !m.isArchived);
  const archivedMeds = medications.filter(m => m.isArchived);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Medications & Dose Schedules</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Configure daily dosages, timings, food instructions, and active medication catalogs.
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Medication</span>
        </button>
      </div>

      {/* Active Medications */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Active Prescribed Medications</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading medications...
          </div>
        ) : activeMeds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No active medications found. Click "Add Medication" above or scan a prescription.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeMeds.map(med => {
              const medSchedules = schedules.filter(s => s.medicationId?._id === med._id || s.medicationId === med._id);

              return (
                <div
                  key={med._id}
                  style={{
                    backgroundColor: 'var(--bg-warm)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <Pill size={24} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                          {med.name}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {med.dose} {med.unit}
                        </span>
                        <span className="badge badge-due">{med.form || 'Tablet'}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Food: <strong>{med.foodRelation}</strong> • {med.instructions || 'Standard dose'}
                      </div>
                      {/* Dosing Times */}
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        {medSchedules.map(s => (
                          <span
                            key={s._id}
                            onClick={() => handleToggleSchedule(s._id, s.enabled)}
                            style={{
                              fontSize: '0.78rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: s.enabled ? '#DCFCE7' : '#F3F4F6',
                              color: s.enabled ? '#166534' : '#6B7280',
                              border: '1px solid rgba(0,0,0,0.08)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Click to toggle enable/disable"
                          >
                            <Clock size={12} />
                            <span>{s.time} ({s.enabled ? 'Active' : 'Paused'})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => {
                        setTargetMed(med);
                        setShowArchiveModal(true);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                    >
                      <Archive size={14} />
                      <span>Archive</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Archived Medications */}
      {archivedMeds.length > 0 && (
        <div className="card" style={{ opacity: 0.85 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
            Archived Medications (Historical Record Maintained)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {archivedMeds.map(med => (
              <div
                key={med._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem'
                }}
              >
                <div>
                  <strong>{med.name}</strong> ({med.dose} {med.unit})
                  <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                    Archived: {med.archivedReason || 'Course completed'}
                  </span>
                </div>
                <span className="badge badge-pending">ARCHIVED</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD MEDICATION MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add New Medication</h3>
            <form onSubmit={handleAddMedication} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Medication Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Metformin"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Dose Value *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    placeholder="e.g. 500"
                    value={formData.dose}
                    onChange={e => setFormData({ ...formData, dose: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Unit
                  </label>
                  <select
                    className="input-field"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="mg">mg</option>
                    <option value="ml">ml</option>
                    <option value="mcg">mcg</option>
                    <option value="tablet">tablet(s)</option>
                    <option value="drops">drops</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Food Instruction
                  </label>
                  <select
                    className="input-field"
                    value={formData.foodRelation}
                    onChange={e => setFormData({ ...formData, foodRelation: e.target.value })}
                  >
                    <option value="AFTER_MEAL">After food</option>
                    <option value="BEFORE_MEAL">Before food</option>
                    <option value="EMPTY_STOMACH">Empty stomach</option>
                    <option value="WITH_MEAL">With meal</option>
                    <option value="NO_RESTRICTION">No restriction</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Schedule Time *
                  </label>
                  <input
                    type="time"
                    required
                    className="input-field"
                    value={formData.scheduleTime}
                    onChange={e => setFormData({ ...formData, scheduleTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Special Instructions
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Take with a full glass of warm water"
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Schedule Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARCHIVE MODAL */}
      {showArchiveModal && targetMed && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Archive {targetMed.name}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
              Archiving disables future schedules while permanently preserving historical dose records and audit events.
            </p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Reason for Archiving
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Doctor stopped prescription after checkup"
                value={archiveReason}
                onChange={e => setArchiveReason(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchive}
                className="btn btn-danger"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
