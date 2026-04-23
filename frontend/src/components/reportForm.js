import { useState } from 'react';
import { submitReport } from '../utils/api';

export default function ReportForm({ onReportSubmitted }) {
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [reportId, setReportId] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (file) formData.append('file', file);

    try {
      const data = await submitReport(formData);
      setReportId(data.reportId);
      setMessage('Report submitted successfully!');
      setMessageType('success');
      setDescription('');
      setLocationText('');
      setCategory('');
      setFile(null);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error submitting report.');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2>📝 Submit a Report</h2>
      {message && <div className={`message ${messageType}`}>{message}</div>}
      
      {reportId && (
        <div className="report-id-highlight" style={{ marginBottom: '20px' }}>
          <strong>Your Report ID:</strong> <code>{reportId}</code>
          <p>Save this ID to track your report.</p>
        </div>
      )}

      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Select a category...</option>
            <option value="Cybercrime">Cybercrime</option>
            <option value="Corruption">Corruption</option>
            <option value="Public Disturbance">Public Disturbance</option>
            <option value="Illegal Activity">Illegal Activity</option>
            <option value="Harrasment">Harrasment</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea 
            placeholder="Describe the incident..." 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Location</label>
          <input 
            type="text" 
            placeholder="Location detail..." 
            value={locationText} 
            onChange={e => setLocationText(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Evidence (Image/Video/Document)</label>
          <input type="file" accept="image/*,video/mp4,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setFile(e.target.files[0])} />
        </div>

        <button type="submit" className="btn-submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
