import React, { useEffect, useState } from 'react';
import { apiService, isApiConfigured } from '../services/apiService';
import { Card, Stat, Progress, Chip, PageHeader } from '../components/common/UI';

// Reads the summary the mother chose to share: from the backend when configured,
// otherwise from this browser's local storage (demo mode).
function useSharedSummary() {
    const [summary, setSummary] = useState(null);
    useEffect(() => {
        let alive = true;
        const load = async () => {
            if (isApiConfigured()) {
                const res = await apiService.fetchSharedSummary();
                if (alive && res.ok && res.data) { setSummary(res.data.data || res.data); return; }
            }
            try { const raw = localStorage.getItem('mc_shared_summary'); if (alive) setSummary(raw ? JSON.parse(raw) : null); } catch { /* ignore */ }
        };
        load();
        const id = setInterval(load, 5000);
        return () => { alive = false; clearInterval(id); };
    }, []);
    return summary;
}

const HELP = [
    ['💧', 'Remind her to drink water', 'A gentle nudge helps her reach her daily goal.'],
    ['🍱', 'Help with meals', 'Prepare or share a healthy meal together.'],
    ['😴', 'Encourage rest', 'Offer to take over a chore so she can rest.'],
    ['🩺', 'Attend appointments', 'Go along to check-ups and vaccination visits.']
];

export default function FamilyDashboard({ view }) {
    const s = useSharedSummary();
    const demo = !isApiConfigured();
    const banner = demo && <div className="mc-note">Demo mode: showing data shared from this browser. Connect the backend for cross-device family sharing.</div>;

    if (!s) {
        return (
            <div><PageHeader title="Family Dashboard" />{banner}
                <Card><p className="mc-muted" style={{ marginBottom: 0 }}>No shared information yet. Ask the mother to open the app and choose what to share under Connections.</p></Card></div>
        );
    }
    const hasAnything = ['hydration', 'medicines', 'wellness', 'vaccinations', 'alerts', 'vitals'].some((k) => s[k]);
    const alerts = s.alerts || [];

    const support = (
        <Card title="Ways You Can Help" icon="🤝" tone="soft">
            <div className="mc-grid mc-grid--sm">
                {HELP.map(([i, t, d]) => (
                    <div key={t}><div style={{ fontSize: 28 }}>{i}</div><strong>{t}</strong><div className="mc-muted mc-small">{d}</div></div>
                ))}
            </div>
        </Card>
    );

    if (view === 'support') return <div><PageHeader title="🤝 Support" subtitle={`Ways to care for ${s.motherName}`} />{support}</div>;

    if (view === 'alerts') {
        return (
            <div><PageHeader title="⚠️ Alerts" subtitle="Only alerts the mother chose to share." />{banner}
                <Card>
                    {!s.shared?.alerts && <p className="mc-muted">Health alerts are not shared.</p>}
                    {s.shared?.alerts && alerts.length === 0 && <p className="mc-muted">No health alerts.</p>}
                    {alerts.map((a, i) => (
                        <div key={i} className="mc-alert"><strong>{a.title}</strong><br />{a.body}<br /><span className="mc-small">{new Date(a.ts).toLocaleString()}</span></div>
                    ))}
                </Card>
            </div>
        );
    }

    const v = s.vitals;
    return (
        <div>
            <PageHeader title={view === 'mother' ? `${s.motherName}'s Update` : 'Family Dashboard'}
                subtitle={`Last updated ${new Date(s.updatedAt).toLocaleTimeString()}`} right={<Chip tone="info">Read-only</Chip>} />
            {banner}
            {!hasAnything && <Card><p className="mc-muted" style={{ marginBottom: 0 }}>{s.motherName} has not shared any details yet.</p></Card>}
            <div className="mc-grid">
                {s.hydration && (
                    <Card title="Today's hydration" icon="💧" tone="sky"><strong>{s.hydration.done}/{s.hydration.goal} glasses</strong><Progress value={s.hydration.done} max={s.hydration.goal} tone="sky" /></Card>
                )}
                {s.medicines && (
                    <Card title="Medicine" icon="💊" tone="soft"><strong>{s.medicines.done}/{s.medicines.total} completed</strong><Progress value={s.medicines.done} max={s.medicines.total} /></Card>
                )}
                {s.wellness && (
                    <Card title="Wellness" icon="🧘‍♀️" tone="lav">{s.wellness.activities.length ? <ul style={{ margin: 0, paddingLeft: 18 }}>{s.wellness.activities.map((a, i) => <li key={i}>{a} ✓</li>)}</ul> : <span className="mc-muted">No sessions yet today.</span>}</Card>
                )}
                {s.vaccinations && (
                    <Card title="Upcoming vaccination" icon="💉" tone="mint">{s.vaccinations.next ? <><strong>{s.vaccinations.next.name}</strong><br /><span className="mc-muted">Due {s.vaccinations.next.dueDate}</span></> : <span className="mc-muted">None scheduled.</span>}</Card>
                )}
                {s.shared?.alerts && (
                    <Card title="Health alerts" icon="⚠️">{alerts.length ? <Chip tone="danger">{alerts.length} recent alert{alerts.length > 1 ? 's' : ''}</Chip> : <Chip tone="ok">No alerts</Chip>}</Card>
                )}
            </div>
            {v && view === 'mother' && (
                <div className="mc-grid mc-grid--sm" style={{ marginTop: 16 }}>
                    <Stat icon="❤️" label="Heart Rate" value={v.heartRate} unit="BPM" />
                    <Stat icon="🌡️" label="Body Temp" value={v.temperature} unit="°C" />
                    <Stat icon="👣" label="Steps" value={v.steps} />
                </div>
            )}
            {view !== 'mother' && <div style={{ marginTop: 16 }}>{support}</div>}
        </div>
    );
}
