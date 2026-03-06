import { useState, useRef } from 'react';
import { submitReport } from '../utils/api';

export default function ReportForm({ onReportSubmitted }) {
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [txHash, setTxHash] = useState('');
  const [reportId, setReportId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description || !locationText || !category) {
      setMessage('Category, Description, and Location fields are required.');
      setMessageType('error');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('description', description);
    formData.append('locationText', locationText);
    formData.append('category', category);
    if (file) {
      formData.append('file', file);
    }

    try {
      const data = await submitReport(formData);
      setReportId(data.reportId);
      setTxHash(data.txHash || '');
      setMessage('Report submitted successfully!');
      setMessageType('success');
      setDescription('');
      setLocationText('');
      setCategory('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Do NOT trigger auto-refresh immediately. Give user time to see their report ID.
      // if (onReportSubmitted) onReportSubmitted();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Error submitting report.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2><span className="icon">📝</span> Submit a Report</h2>

      {message && (
        <div className={`message ${messageType}`}>{message}</div>
      )}
      {reportId && (
        <div className="report-id-highlight">
          <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--accent)' }}>
            🎫 Your Report ID
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(0, 206, 201, 0.08)', padding: '12px 16px',
            borderRadius: '8px', border: '1px solid rgba(0, 206, 201, 0.3)'
          }}>
            <span style={{ fontFamily: 'Courier New, monospace', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '1px', color: '#fff', flex: 1 }}>
              {reportId}
            </span>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(reportId); }}
              style={{
                background: 'var(--primary)', color: '#fff', border: 'none',
                borderRadius: '6px', padding: '6px 14px', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 600
              }}
            >
              📋 Copy
            </button>
          </div>
          <p style={{ color: 'var(--warning)', fontSize: '0.8rem', marginTop: '10px' }}>
            🔒 <strong>Keep this ID private.</strong> Anyone with your Report ID can view your report details. Save it securely.
          </p>
          {txHash && (
            <div className="tx-hash-display">
              ⛓️ Blockchain Hash: <br /><strong>{txHash}</strong>
            </div>
          )}
          <button
            type="button"
            className="btn-submit"
            style={{ marginTop: "1rem", backgroundColor: "#2e7d32" }}
            onClick={() => {
              if (onReportSubmitted) onReportSubmitted();
              setReportId('');
              setMessage('');
            }}
          >
            Track My Report Now
          </button>
        </div>
      )}

      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select a category...</option>
            <option value="Theft">Theft</option>
            <option value="Assault">Assault</option>
            <option value="Vandalism">Vandalism</option>
            <option value="Fraud">Fraud</option>
            <option value="Harassment">Harassment</option>
            <option value="Drug Activity">Drug Activity</option>
            <option value="Traffic Violation">Traffic Violation</option>
            <option value="Public Disturbance">Public Disturbance</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            placeholder="Describe the incident in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            placeholder="e.g. 123 Main Street, City"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Evidence (Image) - Optional</label>
          <div className="file-upload">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files[0])}
            />
            {file ? (
              <p className="file-name">📎 {file.name}</p>
            ) : (
              <p className="upload-text">
                <span className="highlight">Click to upload</span> or drag & drop<br />
                JPEG, JPG, PNG (max 10MB)
              </p>
            )}
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
