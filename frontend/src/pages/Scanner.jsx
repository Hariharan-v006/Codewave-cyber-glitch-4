import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

function Scanner() {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [html5QrCode, setHtml5QrCode] = useState(null);

  useEffect(() => {
    // Fetch available cameras on mount
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        // By default use the last one (often the back camera on mobile) or the first one available
        setActiveCameraId(devices[devices.length - 1].id);
      }
    }).catch(err => {
      console.error("Error getting cameras", err);
    });
  }, []);

  useEffect(() => {
    if (!activeCameraId) return;

    const qrCode = new Html5Qrcode("reader");
    setHtml5QrCode(qrCode);
    let isScanning = false;

    qrCode.start(
      activeCameraId, // Start with the chosen camera
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      (decodedText, decodedResult) => {
        if (!isScanning) {
          isScanning = true;
          const fmt = decodedResult?.result?.format?.formatName || '';
          qrCode.stop().then(() => {
            const encoded = encodeURIComponent(decodedText);
            navigate(`/report/${encoded}${fmt ? `?fmt=${fmt}` : ''}`);
          }).catch(console.error);
        }
      },
      (errorMessage) => {
        // It's normal to have scan errors constantly as the camera tries to focus.
      }
    ).catch(err => {
      console.error("Camera start failed:", err);
    });

    return () => {
      try {
        if (qrCode.isScanning) {
          qrCode.stop().catch(() => { });
        }
      } catch (e) { }
    };
  }, [activeCameraId, navigate]);

  const handleCameraChange = (e) => {
    const newCameraId = e.target.value;
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().then(() => {
        setActiveCameraId(newCameraId);
      }).catch(err => {
        console.error("Failed to stop current camera to switch:", err);
        setActiveCameraId(newCameraId);
      })
    } else {
      setActiveCameraId(newCameraId);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Scanning Barcode...</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Align the barcode within the frame.</p>

        {cameras.length > 1 && (
          <div style={{ marginBottom: '1rem' }}>
            <select
              value={activeCameraId || ''}
              onChange={handleCameraChange}
              style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
            >
              {cameras.map(camera => (
                <option key={camera.id} value={camera.id} style={{ color: 'black' }}>
                  {camera.label || `Camera ${camera.id}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
        <button
          className="btn"
          onClick={() => navigate('/')}
          style={{ marginTop: '2rem', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default Scanner;
