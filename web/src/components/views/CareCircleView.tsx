import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  HeartHandshake, 
  UserPlus, 
  Phone, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  AlertCircle,
  HelpCircle,
  Settings
} from 'lucide-react';

interface CareContact {
  _id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  available: boolean;
  consentStatus: string;
  permissions: string[];
  notes?: string;
}

export const CareCircleView: React.FC = () => {
  const { activeSenior, seniors } = useAuth();
  const currentPatientId = activeSenior?._id || (typeof window !== 'undefined' ? localStorage.getItem('ll_active_senior_id') : null) || seniors[0]?._id;

  const [contacts, setContacts] = useState<CareContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('neighbour');
  const [priority, setPriority] = useState(1);
  const [notes, setNotes] = useState('');

  // Escalation settings state
  const [primaryTimeout, setPrimaryTimeout] = useState(5);
  const [trustedTimeout, setTrustedTimeout] = useState(5);
  const [professionalSearchEnabled, setProfessionalSearchEnabled] = useState(true);
  const token = typeof window !== 'undefined' ? (localStorage.getItem('ll_token') || localStorage.getItem('token')) : null;

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = currentPatientId 
        ? `http://localhost:5000/api/care-circle?patientId=${currentPatientId}` 
        : 'http://localhost:5000/api/care-circle';
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setContacts(data.data?.contacts || []);
      } else {
        setError(data.message || 'Failed to fetch care circle');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching care circle');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [currentPatientId]);

  const handleToggleAvailability = async (contactId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:5000/api/care-circle/${contactId}/availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ available: !currentStatus })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSuccessMsg(`Availability updated for contact.`);
        fetchContacts();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(data.message || 'Error updating availability');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Remove this trusted contact from the senior\'s care circle?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/care-circle/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSuccessMsg('Contact removed from care circle.');
        fetchContacts();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(data.message || 'Error removing contact');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please enter both name and contact phone number.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/care-circle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: currentPatientId,
          name: name.trim(),
          phone: phone.trim(),
          relationship,
          priority: Number(priority),
          notes: notes.trim(),
          permissions: ['receive_assistance_alert', 'view_medicine_name', 'view_dosage', 'mark_completion']
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSuccessMsg(`Added ${name} to the Care Circle.`);
        setShowAddModal(false);
        setName('');
        setPhone('');
        setNotes('');
        fetchContacts();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(data.message || 'Error adding contact');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <HeartHandshake size={28} color="var(--primary)" />
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Care Circle Network
            </h1>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              backgroundColor: '#EFF6FF', 
              color: '#2563EB', 
              padding: '0.2rem 0.6rem', 
              borderRadius: '999px' 
            }}>
              Phase 2 Disability Support
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Trusted relatives and neighbours authorized to receive progressive alerts when the senior cannot physically open or take medicines.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Configuring for:</span>
            <span style={{ 
              fontSize: '0.82rem', 
              fontWeight: 700, 
              backgroundColor: 'var(--primary-light)', 
              color: 'var(--primary)', 
              padding: '0.2rem 0.65rem', 
              borderRadius: '8px' 
            }}>
              👵 {activeSenior?.preferredName || activeSenior?.fullName || 'Senior'} ({activeSenior?.age || 78} yrs)
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'var(--primary)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1.25rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(255, 122, 0, 0.25)'
          }}
        >
          <UserPlus size={18} />
          Add Trusted Contact
        </button>
      </div>

      {successMsg && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#ECFDF5', color: '#065F46', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.85rem 1rem', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Escalation Config Summary */}
      <div style={{ 
        backgroundColor: '#FFF7ED', 
        border: '1px solid #FFEDD5', 
        borderRadius: 'var(--radius-lg)', 
        padding: '1.25rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={24} color="#EA580C" />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9A3412', textTransform: 'uppercase' }}>
              Primary Timeout
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#C2410C' }}>
              {primaryTimeout} Minutes
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9A3412' }}>Before cascading to Care Circle</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={24} color="#EA580C" />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9A3412', textTransform: 'uppercase' }}>
              Care Circle Timeout
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#C2410C' }}>
              {trustedTimeout} Minutes
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9A3412' }}>Before professional caregiver dispatch</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings size={24} color="#EA580C" />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9A3412', textTransform: 'uppercase' }}>
              Professional CareChain
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#C2410C' }}>
              {professionalSearchEnabled ? 'Enabled' : 'Disabled'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9A3412' }}>Geospatial nurse dispatch if no contact accepts</div>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
          Active Care Circle Members ({contacts.length})
        </h2>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading Care Circle contacts from MongoDB...
          </div>
        ) : contacts.length === 0 ? (
          <div style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 'var(--radius-lg)', 
            padding: '3rem 2rem', 
            textAlign: 'center',
            border: '1px dashed var(--border)'
          }}>
            <HeartHandshake size={48} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Trusted Contacts Added Yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
              Add close neighbours or relatives who live nearby to assist {activeSenior?.preferredName || activeSenior?.fullName || 'the senior'} when child-proof medication bottles or mobility challenges occur.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                backgroundColor: 'var(--primary)',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.6rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Add First Contact
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {contacts.map((c) => (
              <div 
                key={c._id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        backgroundColor: '#FEF3C7', 
                        color: '#B45309', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '999px' 
                      }}>
                        PRIORITY #{c.priority}
                      </span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        backgroundColor: '#F3F4F6', 
                        color: '#4B5563', 
                        padding: '0.15rem 0.5rem', 
                        borderRadius: '999px',
                        textTransform: 'capitalize'
                      }}>
                        {c.relationship}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem', marginBottom: 0 }}>
                      {c.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => handleDeleteContact(c._id)}
                    title="Remove Contact"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Phone size={14} />
                  <span>{c.phone}</span>
                </div>

                {c.notes && (
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', backgroundColor: '#F9FAFB', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    "{c.notes}"
                  </div>
                )}

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  paddingTop: '0.5rem', 
                  borderTop: '1px solid #F3F4F6' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: c.available ? '#10B981' : '#9CA3AF' 
                    }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: c.available ? '#059669' : '#6B7280' }}>
                      {c.available ? 'Available for Alerts' : 'Temporarily Away'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleAvailability(c._id, c.available)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      background: 'none',
                      border: 'none',
                      color: c.available ? 'var(--primary)' : '#6B7280',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem'
                    }}
                  >
                    {c.available ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    Toggle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '480px',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Add Care Circle Contact
              </h2>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                For: {activeSenior?.preferredName || activeSenior?.fullName || 'Senior'}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              This person will receive an alert if {activeSenior?.preferredName || activeSenior?.fullName || 'the senior'} indicates physical help is needed and the primary caregiver does not respond within {primaryTimeout} minutes.
            </p>

            <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Mobile Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98400 22334"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                    Relationship *
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="neighbour">Neighbour</option>
                    <option value="relative">Relative</option>
                    <option value="friend">Friend</option>
                    <option value="family_member">Family Member</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                    Escalation Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value={1}>1 - First Fallback</option>
                    <option value={2}>2 - Second Fallback</option>
                    <option value={3}>3 - Third Fallback</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Notes / Household Access
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lives in Flat 3B, has spare key to main door"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    backgroundColor: '#FFFFFF',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
