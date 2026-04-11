import React, { useState } from 'react';
import { getReportById, verifyReportOnChain, getReportMessages, sendReportMessage } from '../utils/api';
import EvidencePreview from './EvidencePreview';

// Helper: compute a human-readable relative time string
function timeAgo(dateString) {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function TrackReport() {
    const [reportId, setReportId] = useState('');
    const [report, setReport] = useState(null);
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [messagesError, setMessagesError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!reportId.trim()) return;

        setLoading(true);
        setError('');
        setReport(null);
        setVerification(null);

        try {
            // 1. Fetch the report details from MongoDB
            const reportData = await getReportById(reportId);
            setReport(reportData);

            // 2. Fetch the verification status from the Smart Contract!
            const verifyData = await verifyReportOnChain(reportId);
            setVerification(verifyData);

            // 3. Fetch private messages (if authorized)
            try {
                const msgData = await getReportMessages(reportId);
                setMessages(msgData.messages || []);
                setMessagesError('');
            } catch (msgErr) {
                setMessagesError('Not authorized to view messages or none exist.');
            }

        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                setError('No report found with that ID. Please check your Report ID and try again.');
            } else {
                setError(err.response?.data?.error || 'Could not find a report with that ID.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            const data = await sendReportMessage(reportId, newMessage);
            setMessages(prev => [...prev, data.newMessage]);
            setNewMessage('');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to send message');
        }
    };

    const getStatusClass = (status) => {
        if (!status) return '';
        const s = status.toLowerCase();
        if (s.includes('pending')) return 'pending';
        if (s.includes('resolved') || s === 'closed') return 'resolved';
        if (s.includes('progress') || s.includes('investigation') || s.includes('evidence')) return 'in-progress';
        if (s.includes('rejected')) return 'rejected';
        return '';
    };

    return (
        <div className="card">
            <h2><span className="icon">🔍</span> Track Your Report</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
                Enter your secure Report ID to view real-time updates and cryptographically verify that your submitted evidence is safely secured on the Ethereum Blockchain.
            </p>

            <form className="report-form" onSubmit={handleSearch}>
                <div className="form-group">
                    <label htmlFor="searchId">Secure Report ID</label>
                    <div className="search-container" style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            id="searchId"
                            placeholder="e.g. 1772362000059"
                            value={reportId}
                            onChange={(e) => setReportId(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn-submit" style={{ marginTop: 0, width: 'auto' }} disabled={loading}>
                            {loading ? 'Searching...' : 'Track'}
                        </button>
                    </div>
                    <p className="helper-text" style={{ fontSize: '0.8rem', marginTop: '8px', color: 'var(--text-muted)' }}>
                        🔒 Your Report ID is your private access key. Do not share it publicly.
                    </p>
                </div>
            </form>

            {error && <div className="message error" style={{ marginTop: '24px' }}>{error}</div>}

            {report && (
                <div className="report-card" style={{ marginTop: '24px', animation: 'slideIn 0.4s ease' }}>
                    <div className="report-card-header">
                        <span className="report-card-id">Report ID: {report.reportId}</span>
                        <span className={`status-badge ${getStatusClass(report.status)}`}>
                            {report.status}
                        </span>
                    </div>

                    <div className="report-card-body">
                        <p><strong>Category:</strong> {report.category}</p>
                        <p><strong>Description:</strong> {report.description}</p>
                        <p><strong>Location:</strong> {report.locationText || 'N/A'}</p>
                        <EvidencePreview report={report} />

                        {/* Cryptographic Verification Box */}
                        {verification && verification.verified && (
                            <div className="verification-box passed">
                                <h4>✅ On-Chain Verification Passed</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{verification.message}</p>
                                {verification.blockchainHash && (
                                    <div className="tx-hash-display">
                                        <label>Secured Hash on Blockchain</label>
                                        <code>{verification.blockchainHash}</code>
                                    </div>
                                )}
                                {report.txHash && report.txHash !== 'Blockchain pending' && (
                                    <div className="tx-hash-display">
                                        <label>Ethereum Transaction</label>
                                        <code>{report.txHash}</code>
                                    </div>
                                )}
                            </div>
                        )}
                        {verification && !verification.verified && verification.reason === 'hash_mismatch' && (
                            <div className="verification-box failed">
                                <h4 style={{ color: 'var(--error)' }}>❌ TAMPERING DETECTED</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{verification.message}</p>
                                {verification.recalculatedHash && (
                                    <div className="tx-hash-display">
                                        <label style={{ color: 'var(--error)' }}>Current Database Data Hash (Mismatch!)</label>
                                        <code style={{ color: 'var(--error)' }}>{verification.recalculatedHash}</code>
                                    </div>
                                )}
                            </div>
                        )}
                        {verification && !verification.verified && verification.reason !== 'hash_mismatch' && (
                            <div className="verification-box">
                                <h4 style={{ color: 'var(--warning)' }}>⚠️ Not Found on Blockchain</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{verification.message}</p>
                                {report.txHash && report.txHash !== 'Blockchain pending' && (
                                    <div className="tx-hash-display">
                                        <label>Original Ethereum Tx</label>
                                        <code>{report.txHash}</code>
                                    </div>
                                )}
                            </div>
                        )}



                        {/* Private Communication Thread */}
                        {!messagesError && (
                            <div className="communication-thread">
                                <h3>Private Communication</h3>
                                <p className="helper-text" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                    This thread is strictly between you and the assigned investigator.
                                </p>
                                <div className="messages-list">
                                    {messages.length === 0 ? <p className="empty-state" style={{ padding: '20px' }}>No messages yet.</p> : messages.map((m, i) => (
                                        <div key={i} className={`message-bubble ${m.senderRole === 'user' ? 'user' : 'investigator'}`}>
                                            <span className="message-meta">
                                                {m.senderRole === 'user' ? 'You' : 'Investigator'}
                                            </span>
                                            {m.text}
                                            <span className="message-time">
                                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendMessage} className="message-input-form" style={{ display: 'flex', gap: '8px' }}>
                                    <input 
                                        type="text" 
                                        value={newMessage} 
                                        onChange={(e) => setNewMessage(e.target.value)} 
                                        placeholder="Type a reply to the investigator..." 
                                        className="form-control"
                                        style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)' }} 
                                    />
                                    <button type="submit" className="btn-submit" style={{ margin: 0, width: 'auto', padding: '0 24px' }}>Send</button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
