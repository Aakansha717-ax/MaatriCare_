import React, { useEffect, useRef, useState } from 'react';
import { useCare } from '../context/CareContext';
import { playChime } from '../services/reminderNotifier';
import { Card, PageHeader, Progress } from '../components/common/UI';

const PRESETS = [['Meditation', 10], ['Breathing', 5], ['Yoga', 15], ['Rest', 20]];
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function TimerPage({ preset }) {
    const care = useCare();
    const [label, setLabel] = useState('Custom timer');
    const [total, setTotal] = useState(600);
    const [remaining, setRemaining] = useState(600);
    const [running, setRunning] = useState(false);
    const [mins, setMins] = useState(10);
    const [secs, setSecs] = useState(0);
    const endRef = useRef(0);
    const remainingRef = useRef(600);
    remainingRef.current = remaining;

    const load = (seconds, name, autoStart = false) => {
        setLabel(name); setTotal(seconds); setRemaining(seconds); setRunning(false);
        setMins(Math.floor(seconds / 60)); setSecs(seconds % 60);
        if (autoStart) { endRef.current = Date.now() + seconds * 1000; setRunning(true); }
    };

    useEffect(() => {
        if (preset && preset.nonce) load(preset.minutes * 60, preset.label, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preset && preset.nonce]);

    useEffect(() => {
        if (!running) return undefined;
        const id = setInterval(() => {
            const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
            setRemaining(left);
            if (left === 0) {
                setRunning(false);
                playChime();
                care.logWellness(`${label} (${Math.round(total / 60)} min)`);
                care.notify('Wellness', '🧘‍♀️ Timer complete', `${label} finished. Well done!`, 'MaatriCare: Timer complete');
            }
        }, 250);
        return () => clearInterval(id);
    }, [running, label, total, care]);

    const start = () => {
        const base = remainingRef.current > 0 ? remainingRef.current : total;
        if (remainingRef.current <= 0) setRemaining(total);
        endRef.current = Date.now() + base * 1000;
        setRunning(true);
    };
    const applyCustom = () => load(Math.max(1, (Number(mins) || 0) * 60 + (Number(secs) || 0)), 'Custom timer');

    return (
        <div>
            <PageHeader title="⏱️ Timer" subtitle="For meditation, breathing, yoga and rest." />
            <div className="mc-grid mc-grid--2">
                <Card tone="lav" title={label}>
                    <div className="mc-timer">
                        <div className="mc-timer__time">{fmt(remaining)}</div>
                        <Progress value={total - remaining} max={total} />
                        <div className="mc-row" style={{ justifyContent: 'center', marginTop: 18 }}>
                            {running ? <button className="mc-btn" onClick={() => setRunning(false)}>⏸ Pause</button> : <button className="mc-btn" onClick={start}>▶ Start</button>}
                            <button className="mc-btn mc-btn--ghost" onClick={() => { setRunning(false); setRemaining(total); }}>↺ Reset</button>
                        </div>
                    </div>
                </Card>
                <Card title="Set a timer">
                    <div className="mc-row" style={{ marginBottom: 14 }}>
                        {PRESETS.map(([n, m]) => <button key={n} className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => load(m * 60, n)}>{n} · {m} min</button>)}
                    </div>
                    <div className="mc-row">
                        <div><label className="mc-label">Minutes</label><input className="mc-input" style={{ width: 90 }} type="number" min="0" max="180" value={mins} onChange={(e) => setMins(e.target.value)} /></div>
                        <div><label className="mc-label">Seconds</label><input className="mc-input" style={{ width: 90 }} type="number" min="0" max="59" value={secs} onChange={(e) => setSecs(e.target.value)} /></div>
                        <button className="mc-btn" style={{ alignSelf: 'flex-end' }} onClick={applyCustom}>Set</button>
                    </div>
                    <p className="mc-muted mc-small" style={{ marginTop: 14, marginBottom: 0 }}>Finished sessions are added to today's wellness log. Keep this page open while the timer runs.</p>
                </Card>
            </div>
        </div>
    );
}
