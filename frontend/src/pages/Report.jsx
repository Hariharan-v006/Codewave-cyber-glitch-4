import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// ── Expiry Status Card ────────────────────────────────────────────────────────
function ExpiryCard({ data }) {
  if (!data.expiry_date) return null;

  const statusConfig = {
    'Valid': { color: 'var(--success)', icon: '✅', bg: 'rgba(0,200,100,0.1)', border: 'rgba(0,200,100,0.3)' },
    'Near Expiry': { color: 'var(--warning)', icon: '⚠️', bg: 'rgba(255,200,0,0.1)', border: 'rgba(255,200,0,0.3)' },
    'Expiring Today': { color: '#ff8800', icon: '🔔', bg: 'rgba(255,136,0,0.1)', border: 'rgba(255,136,0,0.3)' },
    'Expired': { color: 'var(--danger)', icon: '❌', bg: 'rgba(255,50,50,0.1)', border: 'rgba(255,50,50,0.3)' },
  };

  const cfg = statusConfig[data.expiry_status] || { color: 'var(--text-muted)', icon: '📅', bg: 'rgba(255,255,255,0.05)', border: 'var(--glass-border)' };
  const daysLabel = data.days_remaining !== null
    ? data.days_remaining > 0
      ? `${data.days_remaining} day${data.days_remaining !== 1 ? 's' : ''} remaining`
      : data.days_remaining === 0
        ? 'Expires today'
        : `Expired ${Math.abs(data.days_remaining)} day${Math.abs(data.days_remaining) !== 1 ? 's' : ''} ago`
    : null;

  return (
    <div className="glass-panel" style={{ borderLeft: `4px solid ${cfg.color}`, background: cfg.bg }}>
      <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.8rem' }}>Expiry Information</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Status</span>
          <span style={{ fontWeight: 'bold', color: cfg.color, fontSize: '1rem' }}>
            {cfg.icon} {data.expiry_status}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Expiry Date</span>
          <span style={{ color: '#fff', fontSize: '0.95rem' }}>{data.expiry_date}</span>
        </div>
        {daysLabel && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Timeline</span>
            <span style={{ color: cfg.color, fontSize: '0.9rem', fontWeight: '600' }}>{daysLabel}</span>
          </div>
        )}
        {data.manufacture_date && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manufactured</span>
            <span style={{ color: '#fff', fontSize: '0.9rem' }}>{data.manufacture_date}</span>
          </div>
        )}
        {data.lot_number && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Lot / Batch</span>
            <span style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}>{data.lot_number}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Format chip label mapping ─────────────────────────────────────────────────
const FORMAT_LABELS = {
  QR_CODE: 'QR Code',
  DATA_MATRIX: 'Data Matrix',
  PDF_417: 'PDF417',
  AZTEC: 'Aztec',
  EAN_13: 'EAN-13',
  EAN_8: 'EAN-8',
  UPC_A: 'UPC-A',
  UPC_E: 'UPC-E',
  CODE_128: 'Code 128',
  CODE_39: 'Code 39',
};

function Report() {
  const { barcode: rawBarcode } = useParams();
  const barcode = decodeURIComponent(rawBarcode);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fmt = searchParams.get('fmt');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIngredient, setExpandedIngredient] = useState(null);

  const toggleIngredient = (idx) => {
    setExpandedIngredient(expandedIngredient === idx ? null : idx);
  };

  useEffect(() => {
    let ignore = false; // StrictMode runs effects twice — ignore the first (cancelled) run

    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const fmtParam = fmt ? `?fmt=${encodeURIComponent(fmt)}` : '';
        const response = await axios.get(
          `http://localhost:8000/api/product/${encodeURIComponent(barcode)}${fmtParam}`,
          { headers, timeout: 30000 }
        );
        if (!ignore) {
          setData(response.data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.detail || 'Failed to fetch product data. Ensure Backend is running or check the barcode.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchReport();

    return () => { ignore = true; }; // cleanup: cancel stale effect
  }, [barcode, fmt]);

  if (loading) {
    return (
      <div className="animate-fade-in glass-panel" style={{ textAlign: 'center', margin: 'auto', maxWidth: '400px' }}>
        <h2>Analyzing Product...</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Please wait while we check databases.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in glass-panel" style={{ textAlign: 'center', margin: 'auto', maxWidth: '500px' }}>
        <h2 style={{ color: 'var(--danger)' }}>Error</h2>
        <p style={{ marginTop: '1rem' }}>{error}</p>
        <button className="btn" style={{ marginTop: '2rem' }} onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  const fmtLabel = fmt ? (FORMAT_LABELS[fmt] || fmt.replace(/_/g, ' ')) : null;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            <h2 style={{ fontSize: '2rem', color: '#fff', margin: 0 }}>{data.product_name}</h2>
            {fmtLabel && (
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', padding: '0.2rem 0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                📷 {fmtLabel}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Brand: {data.brand}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '3rem', fontWeight: '700', color: data.safety_score >= 8 ? 'var(--success)' : data.safety_score >= 5 ? 'var(--warning)' : 'var(--danger)' }}>
            {data.safety_score} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/ 10</span>
          </div>
          <p style={{ color: data.safety_score >= 8 ? 'var(--success)' : data.safety_score >= 5 ? 'var(--warning)' : 'var(--danger)', fontWeight: 'bold' }}>
            {data.safety_score >= 8 ? 'SAFE PRODUCT' : data.safety_score >= 5 ? 'MODERATE RISK' : 'HIGH RISK PRODUCT'}
          </p>
        </div>
      </div>

      {/* Authenticity + Expiry row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel">
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Authenticity</h4>
          <span className={`status-badge status-${data.authenticity_status.toLowerCase()}`}>
            {data.authenticity_status}
          </span>
        </div>
        <ExpiryCard data={data} />
      </div>

      {/* Allergens + Additives */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel">
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Allergens</h4>
          {data.allergens ? (
            <p>{data.allergens}</p>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No allergen information available</p>
          )}
        </div>
        <div className="glass-panel">
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Additives Detected</h4>
          {data.additives && data.additives.length > 0 ? (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {data.additives.map((add, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.9rem' }}>{add}</span>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No additives detected</p>
          )}
        </div>
      </div>

      {/* Ingredient Analysis */}
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
          Ingredient Analysis
        </h3>
        {data.ingredients.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No ingredient data available for this product.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.ingredients.map((ing, idx) => {
              const riskClass = ing.risk_level === 'Safe' ? 'safe' : ing.risk_level === 'Harmful' ? 'harmful' : ing.risk_level === 'Moderate Risk' ? 'moderate' : 'unknown';
              const isExpanded = expandedIngredient === idx;
              return (
                <div key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => toggleIngredient(idx)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ fontSize: '1.2rem' }}>{ing.original_name ? ing.original_name : ing.ingredient_name}</strong>
                      {ing.original_name && ing.ingredient_name.toUpperCase() !== ing.original_name.toUpperCase() && (
                        <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>({ing.ingredient_name})</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`status-badge status-${riskClass}`}>{ing.risk_level}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isExpanded ? '▲ Less Info' : '▼ More Info'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}><strong>Description:</strong> {ing.description}</p>
                      {ing.health_effects && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}><strong>Health Effects:</strong> {ing.health_effects}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button className="btn" onClick={() => navigate('/')}>Scan Another Product</button>
      </div>
    </div>
  );
}

export default Report;
