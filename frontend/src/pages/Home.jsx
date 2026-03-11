import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const [barcode, setBarcode] = useState('');
  const navigate = useNavigate();

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (barcode.trim()) {
      navigate(`/report/${barcode}`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '600px', width: '100%' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', color: '#fff' }}>Verify Your Product</h2>
        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>
          Scan the barcode of foods or cosmetics to instantly access authenticity and ingredient safety details.
        </p>

        <button className="btn" onClick={() => navigate('/scan')} style={{ marginBottom: '2rem', width: '100%' }}>
          📷 Scan Barcode
        </button>

        <div style={{ position: 'relative', margin: '2rem 0' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-color)', padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>OR</span>
        </div>

        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Enter Barcode Manually (e.g. 8901030895113)" 
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />
          <button type="submit" className="btn" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            Search Product
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ width: '250px', padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{color: 'var(--success)'}}>100% Transparency</h3>
          <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>We reveal hidden ingredients.</p>
        </div>
        <div className="glass-panel" style={{ width: '250px', padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{color: 'var(--warning)'}}>Real-time Analysis</h3>
          <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>Get scores within seconds.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
