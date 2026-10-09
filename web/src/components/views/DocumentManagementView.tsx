import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { 
  FolderArchive, 
  Upload, 
  Search, 
  FileText, 
  Activity, 
  Sparkles, 
  Download, 
  Trash2,
  Calendar,
  Building2
} from 'lucide-react';

export const DocumentManagementView: React.FC = () => {
  const { activeSenior } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocForAi, setSelectedDocForAi] = useState<any | null>(null);

  // Upload Form
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('Blood Report');
  const [hospitalName, setHospitalName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const categories = [
    'ALL',
    'Prescription',
    'Blood Report',
    'ECG',
    'X-Ray',
    'CT Scan',
    'MRI',
    'Ultrasound',
    'Other Medical Report'
  ];

  const loadDocuments = async () => {
    if (!activeSenior) return;
    try {
      setLoading(true);
      let query = '';
      if (activeCategory !== 'ALL') query += `type=${encodeURIComponent(activeCategory)}&`;
      if (searchQuery) query += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await api.get(`/documents/patient/${activeSenior._id}?${query}`);
      if (res.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err: any) {
      console.error('[DocumentView] Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeSenior?._id, activeCategory, searchQuery]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !activeSenior) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', activeSenior._id);
      formData.append('type', type);
      formData.append('hospitalName', hospitalName);
      formData.append('doctorName', doctorName);
      formData.append('documentDate', documentDate);
      formData.append('notes', notes);

      const res = await api.post('/documents/upload', formData);
      if (res.success) {
        setShowUploadModal(false);
        setFile(null);
        setHospitalName('');
        setDoctorName('');
        setNotes('');
        loadDocuments();
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this medical record?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      loadDocuments();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Long-Term Medical Documents & Scans</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Store and organize Prescriptions, Blood Reports, ECGs, X-Rays, and MRI scans securely.
          </p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="btn btn-primary">
          <Upload size={18} />
          <span>Upload Record</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="btn"
              style={{
                fontSize: '0.82rem',
                padding: '0.4rem 0.85rem',
                backgroundColor: activeCategory === cat ? 'var(--primary)' : 'var(--bg-warm)',
                color: activeCategory === cat ? '#FFFFFF' : 'var(--text-main)',
                border: '1px solid var(--border)',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search by hospital, doctor name, filename, or clinical notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Documents Grid */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading records...
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <FolderArchive size={42} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
            <div>No medical documents match your search criteria.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {documents.map(doc => (
              <div
                key={doc._id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-warm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={20} color="var(--primary)" />
                    <span className="badge badge-due">{doc.type}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
                    title="Delete record"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                  {doc.fileName}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {doc.hospitalName && <div>🏥 {doc.hospitalName}</div>}
                  {doc.doctorName && <div>👨‍⚕️ {doc.doctorName}</div>}
                  <div>📅 {new Date(doc.documentDate).toLocaleDateString()}</div>
                </div>

                {doc.notes && (
                  <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    "{doc.notes}"
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                  {doc.aiSummary && (
                    <button
                      onClick={() => setSelectedDocForAi(doc)}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem' }}
                    >
                      <Sparkles size={14} color="var(--primary)" />
                      <span>AI Plain Summary</span>
                    </button>
                  )}
                  <a
                    href={doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:5000${doc.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
                    title="View file"
                  >
                    <Download size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI SUMMARY POPUP MODAL */}
      {selectedDocForAi && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Sparkles size={22} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                Senior-Friendly AI Explanation
              </h3>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-warm)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              marginBottom: '1rem',
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                {selectedDocForAi.type}: {selectedDocForAi.fileName}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                {selectedDocForAi.aiSummary?.summary}
              </p>
            </div>

            {selectedDocForAi.aiSummary?.keyObservations && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                  Key Clinical Observations:
                </div>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  {selectedDocForAi.aiSummary.keyObservations.map((obs: string, i: number) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              fontSize: '0.78rem',
              color: '#92400E',
              marginBottom: '1.25rem'
            }}>
              <strong>Informational notice:</strong> LL LifeLink AI provides plain-language explanations for caregiver convenience. This does not substitute professional medical diagnosis. Consult your doctor for medical advice.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedDocForAi(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Upload Medical Record</h3>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Document Type *
                </label>
                <select
                  className="input-field"
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="Blood Report">Blood Report</option>
                  <option value="ECG">ECG</option>
                  <option value="X-Ray">X-Ray</option>
                  <option value="CT Scan">CT Scan</option>
                  <option value="MRI">MRI</option>
                  <option value="Ultrasound">Ultrasound</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Other Medical Report">Other Medical Report</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Select File (Image, AVIF, Scan, or PDF) *
                </label>
                <input
                  type="file"
                  required
                  className="input-field"
                  accept="image/*,application/pdf,.avif,.dcm,.heic,.bmp,.tiff"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Hospital / Lab Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Apollo Diagnostics"
                    value={hospitalName}
                    onChange={e => setHospitalName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Dr. Chandrasekhar"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Date of Document
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={documentDate}
                  onChange={e => setDocumentDate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Notes / Clinical Indications
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="e.g. Regular 6-month diabetic profile checkup"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary"
                >
                  {uploading ? 'Uploading & Analyzing...' : 'Upload Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
