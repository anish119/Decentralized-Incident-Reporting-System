import React, { useState } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
    const [generatedCode, setGeneratedCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateCode = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.REACT_APP_API_URL || '';
            const res = await axios.post(`${API_URL}/admin/generate-investigator-code`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setGeneratedCode(res.data.code);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to generate code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-dashboard">
            <h2 style={{ color: 'var(--primary-light)' }}>🛡️ System Admin Dashboard</h2>
            <p>Welcome, Admin. You can manage investigator access here.</p>
            
            <div className="card" style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <h3>Generate Investigator Invite Code</h3>
                <p>Generate a one-time use code for new investigators to register.</p>
                
                <button 
                    onClick={generateCode} 
                    disabled={loading}
                    className="submit-btn"
                    style={{ width: 'auto', padding: '10px 20px', marginTop: '10px' }}
                >
                    {loading ? 'Generating...' : 'Generate New Code'}
                </button>

                {generatedCode && (
                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--primary)', borderRadius: '4px' }}>
                        <p>Code Generated Successfully:</p>
                        <code style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>{generatedCode}</code>
                        <p style={{ fontSize: '0.8rem', marginTop: '10px', color: 'var(--text-secondary)' }}>
                            Share this code with the investigator. It can only be used once.
                        </p>
                    </div>
                )}

                {error && <p style={{ color: '#ff4d4d', marginTop: '10px' }}>{error}</p>}
            </div>
        </div>
    );
}
