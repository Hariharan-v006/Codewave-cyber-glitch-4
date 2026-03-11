import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const axiosConfig = (token) => ({
    timeout: 10000,
    headers: { Authorization: `Bearer ${token}` }
});

function History() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [clearingAll, setClearingAll] = useState(false);
    const navigate = useNavigate();

    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/auth');
    };

    useEffect(() => {
        const fetchHistory = async () => {
            if (!token) { navigate('/auth'); return; }
            try {
                const response = await axios.get('http://localhost:8000/api/history', axiosConfig(token));
                setHistory(response.data);
            } catch (err) {
                if (err.response?.status === 401) handleLogout();
                else setError('Failed to fetch scan history.');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [navigate]);

    const handleDeleteOne = async (e, id) => {
        e.stopPropagation(); // prevent card click navigating to report
        setDeletingId(id);
        try {
            await axios.delete(`http://localhost:8000/api/history/${id}`, axiosConfig(token));
            setHistory(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            setError('Failed to delete entry. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Are you sure you want to delete your entire scan history? This cannot be undone.')) return;
        setClearingAll(true);
        try {
            await axios.delete('http://localhost:8000/api/history', axiosConfig(token));
            setHistory([]);
        } catch (err) {
            setError('Failed to clear history. Please try again.');
        } finally {
            setClearingAll(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-fade-in glass-panel" style={{ textAlign: 'center', margin: 'auto', maxWidth: '400px' }}>
                <h2>Loading History...</h2>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Header row */}
            <div style={{ width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ color: '#fff', margin: 0 }}>Your Scan History</h2>
                {history.length > 0 && (
                    <button
                        onClick={handleClearAll}
                        disabled={clearingAll}
                        style={{
                            background: 'rgba(255,50,50,0.15)',
                            border: '1px solid rgba(255,50,50,0.4)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            padding: '0.4rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,50,50,0.3)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,50,50,0.15)'}
                    >
                        {clearingAll ? 'Clearing...' : '🗑 Clear All'}
                    </button>
                )}
            </div>

            {error && (
                <div style={{ background: 'rgba(255,50,50,0.2)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', color: 'var(--danger)', width: '100%', maxWidth: '600px' }}>
                    {error}
                </div>
            )}

            {history.length === 0 && !error ? (
                <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>You haven't scanned any products yet!</p>
                    <button className="btn" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>Scan a Product</button>
                </div>
            ) : (
                <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {history.map((scan) => {
                        const rsText = scan.safety_score >= 8 ? 'var(--success)' : scan.safety_score >= 5 ? 'var(--warning)' : 'var(--danger)';
                        const date = new Date(scan.scan_date).toLocaleString();

                        return (
                            <div
                                key={scan.id}
                                className="glass-panel"
                                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', transition: 'background 0.2s' }}
                                onClick={() => navigate(`/report/${scan.barcode}`)}
                            >
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{scan.product_name}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Scanned: {date}</p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: rsText }}>
                                        {scan.safety_score.toFixed(1)}
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteOne(e, scan.id)}
                                        disabled={deletingId === scan.id}
                                        title="Delete this entry"
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid rgba(255,80,80,0.3)',
                                            borderRadius: '6px',
                                            color: 'var(--danger)',
                                            cursor: 'pointer',
                                            padding: '0.3rem 0.6rem',
                                            fontSize: '1rem',
                                            lineHeight: 1,
                                            transition: 'background 0.15s, border-color 0.15s',
                                            opacity: deletingId === scan.id ? 0.5 : 1
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,50,50,0.2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {deletingId === scan.id ? '...' : '🗑'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default History;
