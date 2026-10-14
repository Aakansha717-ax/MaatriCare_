import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCare } from '../context/CareContext';
import { Card } from '../components/common/UI';

const ROLES = [
    ['mother', '🤰', 'Mother', 'Full access to health, reminders and care tools.'],
    ['husband', '👨‍👩‍👧', 'Husband / Family', 'Read-only view of what the mother shares.'],
    ['doctor', '🩺', 'Doctor', 'Doctor Portal — Under Development.']
];

export default function AuthPage({ initialMode = 'signup', onBack, onDone }) {
    const auth = useAuth();
    const { setProfile } = useCare();
    const [mode, setMode] = useState(initialMode);
    const [step, setStep] = useState('form'); // 'form' -> 'role'
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            // ADAPT: your AuthContext.jsx was not provided. If it exposes login()/signup(),
            // they are called with ONE object argument. Change these two calls to match your signatures.
            const fn = mode === 'signup' ? (auth.signup || auth.register) : auth.login;
            if (typeof fn === 'function') await fn({ name: form.name, email: form.email, password: form.password });
            setProfile((p) => ({ name: form.name || p.name, email: form.email }));
            setStep('role');
        } catch (err) {
            setError((err && err.message) || 'Something went wrong. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const pickRole = (role) => {
        auth.switchRole(role);
        onDone();
    };

    return (
        <div className="mc-auth">
            <div className="mc-auth__card">
                <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onBack} style={{ marginBottom: 12 }}>← Back</button>
                {step === 'form' ? (
                    <Card>
                        <div style={{ textAlign: 'center', marginBottom: 14 }}>
                            <div className="mc-logo" style={{ cursor: 'default' }}>🌸 MaatriCare</div>
                            <div className="mc-muted mc-small">Care for Her. Connect the Family. Empower Motherhood.</div>
                        </div>
                        <div className="mc-tabs">
                            <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Login</button>
                            <button className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Sign Up</button>
                        </div>
                        <form onSubmit={submit} className="mc-stack">
                            {mode === 'signup' && (
                                <div><label className="mc-label">Full name</label>
                                    <input className="mc-input" style={{ width: '100%' }} required value={form.name} onChange={set('name')} /></div>
                            )}
                            <div><label className="mc-label">Email</label>
                                <input className="mc-input" style={{ width: '100%' }} type="email" required value={form.email} onChange={set('email')} /></div>
                            <div><label className="mc-label">Password</label>
                                <input className="mc-input" style={{ width: '100%' }} type="password" required minLength={6} value={form.password} onChange={set('password')} /></div>
                            {error && <div className="mc-alert" style={{ marginBottom: 0 }}>{error}</div>}
                            <button className="mc-btn" style={{ width: '100%' }} disabled={busy}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}</button>
                        </form>
                    </Card>
                ) : (
                    <Card title="Select your role">
                        <div className="mc-stack">
                            {ROLES.map(([key, icon, title, text]) => (
                                <button key={key} className="mc-role" onClick={() => pickRole(key)}>
                                    <span style={{ fontSize: 32 }}>{icon}</span>
                                    <span><strong>{title}</strong><br /><span className="mc-muted mc-small">{text}</span></span>
                                </button>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}