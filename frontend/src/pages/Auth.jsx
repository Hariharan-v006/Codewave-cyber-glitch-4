import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const axiosConfig = { timeout: 10000 }; // 10-second timeout to prevent freezing

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                // Login Request
                const response = await axios.post("http://localhost:8000/api/auth/login", {
                    email,
                    password
                }, axiosConfig);
                localStorage.setItem("token", response.data.access_token);
                window.location.href = "/";
            } else {
                // Register Request
                await axios.post("http://localhost:8000/api/auth/register", {
                    email,
                    password
                }, axiosConfig);
                // Auto-login after register
                const loginResponse = await axios.post("http://localhost:8000/api/auth/login", {
                    email,
                    password
                }, axiosConfig);
                localStorage.setItem("token", loginResponse.data.access_token);
                window.location.href = "/";
            }
        } catch (err) {
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout') || err.code === 'ERR_NETWORK') {
                setError("Cannot reach the server. Please make sure the backend is running on port 8000.");
            } else {
                setError(err.response?.data?.detail || "Authentication failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>
                    {isLogin ? "Welcome Back" : "Create an Account"}
                </h2>

                {error && (
                    <div style={{ background: 'rgba(255,50,50,0.2)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', color: 'var(--danger)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    />

                    <button type="submit" className="btn" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? "Processing..." : (isLogin ? "Sign In" : "Sign Up")}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        style={{ color: 'var(--success)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {isLogin ? "Sign Up" : "Sign In"}
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Auth;
