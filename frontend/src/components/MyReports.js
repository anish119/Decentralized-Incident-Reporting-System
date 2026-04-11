import React, { useState, useEffect } from 'react';
import { getMyReports } from '../utils/api';
import EvidencePreview from './EvidencePreview';

const getStatusClass = (status) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('pending')) return 'pending';
    if (s.includes('resolved') || s === 'closed') return 'resolved';
    if (s.includes('progress') || s.includes('investigation') || s.includes('evidence')) return 'in-progress';
    if (s.includes('rejected')) return 'rejected';
    return '';
};

const MyReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchMyReports(); }, []);

    const fetchMyReports = async () => {
        try {
            const data = await getMyReports();
            setReports(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch your reports. Make sure you are logged in.');
            setLoading(false);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div><p>Loading your reports...</p></div>;
    if (error) return <div className="error-msg">{error}</div>;

    return (
        <div className="card">
            <h2 style={{ marginBottom: '24px' }}>📁 My Reports</h2>

            {reports.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <p>You haven't submitted any reports yet.</p>
                </div>
            ) : (
                <div className="report-list">
                    {reports.map(report => (
                        <div key={report.reportId} className="rc">
                            {/* Header: Report ID on left, Status badge on right */}
                            <div className="rc-toprow">
                                <span className="rc-report-id">
                                    Report ID: <strong>{report.reportId}</strong>
                                </span>
                                <span className={`status-badge ${getStatusClass(report.status)}`}>
                                    {report.status}
                                </span>
                            </div>

                            {/* Card body */}
                            <div className="rc-body">
                                <p><strong>Category:</strong> {report.category}</p>
                                <p className="rc-desc">{report.description}</p>
                                <p className="rc-location">📍 {report.locationText}</p>
                                <p className="rc-time" style={{ marginTop: '8px' }}>
                                    🕐 {new Date(report.createdAt).toLocaleString()}
                                </p>
                            </div>

                            {/* Evidence files */}
                            <EvidencePreview report={report} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyReports;
