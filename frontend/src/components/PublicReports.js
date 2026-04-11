import { useEffect, useState } from 'react';
import { getReports, upvoteReport, disputeReport } from '../utils/api';
import EvidencePreview from './EvidencePreview';

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

function getStatusClass(status) {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s.includes('pending')) return 'pending';
    if (s.includes('resolved') || s === 'closed') return 'resolved';
    if (s.includes('progress') || s.includes('investigation') || s.includes('evidence')) return 'in-progress';
    if (s.includes('rejected')) return 'rejected';
    return '';
}

export default function PublicReports({ onRedirectLogin }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [votingIds, setVotingIds] = useState(new Set());
    const [votedReports, setVotedReports] = useState(new Set());
    const [categoryFilter, setCategoryFilter] = useState('All');
    // Map of reportId -> { message, type }
    const [voteMessages, setVoteMessages] = useState({});
    const [lightboxUrl, setLightboxUrl] = useState(null);

    const showVoteMessage = (reportId, message, type = 'success') => {
        setVoteMessages(prev => ({ ...prev, [reportId]: { message, type } }));
        setTimeout(() => {
            setVoteMessages(prev => {
                const next = { ...prev };
                delete next[reportId];
                return next;
            });
        }, 3500);
    };

    useEffect(() => { fetchReports(); }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const data = await getReports();
            const reportsData = Array.isArray(data) ? data : (data.value || []);
            setReports(reportsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (reportId, type) => {
        const token = localStorage.getItem('token');
        if (!token) {
            if (onRedirectLogin) onRedirectLogin();
            return;
        }
        if (votingIds.has(reportId)) return;
        if (votedReports.has(reportId)) {
            showVoteMessage(reportId, 'You have already voted on this report.', 'error');
            return;
        }

        setVotingIds(prev => new Set(prev).add(reportId));
        try {
            if (type === 'upvote') {
                const res = await upvoteReport(reportId);
                setReports(reports.map(r => r.reportId === reportId ? { ...r, upvotes: res.upvotes } : r));
                showVoteMessage(reportId, '✅ Upvote recorded!', 'success');
            } else {
                const res = await disputeReport(reportId);
                setReports(reports.map(r => r.reportId === reportId ? { ...r, disputes: res.disputes } : r));
                showVoteMessage(reportId, '🚩 Dispute flagged.', 'error');
            }
            setVotedReports(prev => new Set(prev).add(reportId));
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to submit vote.';
            if (msg.toLowerCase().includes('already')) {
                showVoteMessage(reportId, 'Your account has already voted on this report.', 'error');
                setVotedReports(prev => new Set(prev).add(reportId));
            } else {
                showVoteMessage(reportId, msg, 'error');
            }
        } finally {
            setVotingIds(prev => { const s = new Set(prev); s.delete(reportId); return s; });
        }
    };

    const filteredReports = categoryFilter === 'All'
        ? reports
        : reports.filter(r => r.category === categoryFilter);

    return (
        <div className="card pr-card">
            {/* Header Row */}
            <div className="pr-header-row">
                <h2 className="pr-title">📊 Public Reports</h2>
                <div className="pr-filter">
                    <label>Category:</label>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                        <option value="All">All</option>
                        <option value="Cybercrime">Cybercrime</option>
                        <option value="Corruption">Corruption</option>
                        <option value="Public Disturbance">Public Disturbance</option>
                        <option value="Illegal Activity">Illegal Activity</option>
                        <option value="Harrasment">Harrasment</option>
                        <option value="Others">Others</option>
                    </select>
                </div>
            </div>
            <p className="pr-subtitle">Browse recent incident reports. Track your own with your Report ID.</p>

            {loading && <div className="loading"><div className="spinner"></div><p>Loading...</p></div>}
            {!loading && filteredReports.length === 0 && (
                <div className="empty-state"><div className="empty-icon">📭</div><p>No reports found.</p></div>
            )}

            <div className="report-list">
                {filteredReports.map(report => {
                    const hasVoted = votedReports.has(report.reportId);
                    const isVoting = votingIds.has(report.reportId);
                    const vm = voteMessages[report.reportId];
                    return (
                        <div className="rc" key={report.reportId || report._id}>
                            {/* Card Top Row: time + badges */}
                            <div className="rc-toprow">
                                <span className="rc-time">🕐 {timeAgo(report.createdAt)}</span>
                                <div className="rc-badges">
                                    {report.isTampered ? (
                                        <span className="badge badge-tampered">❌ Tampered</span>
                                    ) : report.txHash && report.txHash !== 'Blockchain pending' ? (
                                        <span className="badge badge-authentic">🛡️ Authentic</span>
                                    ) : (
                                        <span className="badge badge-pending-chain">⏳ Pending</span>
                                    )}
                                    <span className={`status-badge ${getStatusClass(report.status)}`}>{report.status}</span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="rc-body">
                                <p><strong>Category:</strong> {report.category}</p>
                                <p className="rc-desc">{report.description}</p>
                                <p className="rc-location">📍 {report.locationText}</p>
                            </div>

                            {/* Evidence files: images, videos, documents */}
                            <EvidencePreview
                                report={report}
                                onImageClick={(url) => setLightboxUrl(url)}
                            />

                            {/* Vote Row */}
                            <div className="rc-vote-row">
                                <button
                                    className={`vote-btn upvote${hasVoted ? ' voted' : ''}`}
                                    onClick={() => handleVote(report.reportId, 'upvote')}
                                    disabled={isVoting}
                                >
                                    👍 <span>{report.upvotes || 0}</span>
                                </button>
                                <button
                                    className={`vote-btn dispute${hasVoted ? ' voted' : ''}`}
                                    onClick={() => handleVote(report.reportId, 'dispute')}
                                    disabled={isVoting}
                                >
                                    🚩 <span>{report.disputes || 0}</span>
                                </button>
                                {/* Contextual inline vote message */}
                                {vm && (
                                    <span className={`inline-vote-msg ${vm.type}`}>{vm.message}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Image Lightbox */}
            {lightboxUrl && (
                <div className="modal-overlay" onClick={() => setLightboxUrl(null)}>
                    <div className="modal-content" style={{ maxWidth: '90vw', background: 'transparent', border: 'none', padding: 0 }} onClick={e => e.stopPropagation()}>
                        <img src={lightboxUrl} alt="Full size evidence" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px' }} />
                    </div>
                </div>
            )}
        </div>
    );
}
