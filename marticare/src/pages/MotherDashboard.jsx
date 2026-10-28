import React from 'react';
import { useBle } from '../context/BleContext';
import { useCare, MEAL_LABELS } from '../context/CareContext';
import { evaluateVitals } from '../utils/vitalsRanges';
import { Card, Stat, Chip, Progress } from '../components/common/UI';

export default function MotherDashboard({ onNavigate }) {
    const ble = useBle();
    const care = useCare();
    const { vitals, connected, receiving, noDataWarning, lastUpdated, packetCount, lastPacketHex, uploadError, error: bleError } = ble;
    const h = new Date().getHours();
    const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
    const issues = evaluateVitals(vitals, care.ranges);
    const mealsDone = Object.keys(MEAL_LABELS).filter((k) => (care.mealLog[care.day] || {})[k]).length;
    const nextVac = care.vaccines.filter((v) => v.status !== 'completed' && v.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
    const sharedCount = Object.values(care.sharing).filter(Boolean).length;
    const bp = vitals.bpSystolic != null && vitals.bpDiastolic != null ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : null;

    return (
        <div>
            <div className="mc-page-head">
                <div>
                    <h1>{greeting}, {care.displayName} ❤️</h1>
                    <div className="mc-muted">Here is your care overview for today.</div>
                </div>
                <div className="mc-row">
                    <Chip tone={receiving ? 'ok' : 'warn'}>{receiving ? 'Receiving data' : connected ? 'Connected — no health data' : ble.status === 'Connecting' ? 'Connecting…' : 'Smartwatch Disconnected'}</Chip>
                    {!connected && <button className="mc-btn mc-btn--sm" onClick={ble.connect}>Connect watch</button>}
                </div>
            </div>

            {bleError && <div className="mc-alert">{bleError}</div>}
            {noDataWarning && (
                <div className="mc-alert">⚠️ Bluetooth is connected but no health data has arrived{packetCount > 0 ? ` (${packetCount} unrecognised packet(s) received, last: ${lastPacketHex})` : ''}. The Ultra3 may need its companion app or an undocumented protocol.</div>
            )}
            {uploadError && <div className="mc-alert">Could not save reading: {uploadError}</div>}
            <div className="mc-muted mc-small">Last reading: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'none yet'}. Wearable values are informational, not a medical diagnosis.</div>

            {issues.length > 0 && (
                <div className="mc-alert">⚠️ <strong>Health Alert</strong> — Your current reading is outside your configured range. Please consult your healthcare professional if concerned.</div>
            )}

            <div className="mc-grid mc-grid--sm">
                <Stat icon="❤️" label="Heart Rate" value={vitals.heartRate} unit=" BPM" />
                <Stat icon="🫁" label="SpO2" value={vitals.spo2} unit="%" />
                <Stat icon="🩸" label="Blood Pressure" value={bp} unit="mmHg" />
                <Stat icon="🌡️" label="Body Temp" value={vitals.temperature} unit="°C" />
                <Stat icon="👣" label="Steps" value={vitals.steps} />
                <Stat icon="🚶‍♀️" label="Activity" value={vitals.steps != null ? (vitals.steps * 0.0007).toFixed(2) : null} unit="km est." />
            </div>

            <h2 style={{ margin: '28px 0 12px' }}>Today's Tasks</h2>
            <div className="mc-grid">
                <Card title="Hydration" icon="💧" tone="sky" action={<button className="mc-btn mc-btn--sm" onClick={() => care.logWater(1)}>+ Glass</button>}>
                    <div className="mc-row mc-between"><strong>{care.waterToday}/{care.hydration.goal} glasses</strong>
                        <span className="mc-muted mc-small">{care.hydration.running ? 'Reminders on' : 'Reminders off'}</span></div>
                    <Progress value={care.waterToday} max={care.hydration.goal} tone="sky" />
                </Card>
                <Card title="Meals" icon="🍱" tone="sand" action={<button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => onNavigate('reminders')}>Manage</button>}>
                    <strong>{mealsDone}/4 meals logged</strong>
                    <Progress value={mealsDone} max={4} />
                </Card>
                <Card title="Medicines" icon="💊" tone="soft" action={<button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => onNavigate('medicines')}>Open</button>}>
                    <strong>{care.medStats.done}/{care.medStats.total} completed</strong>
                    <Progress value={care.medStats.done} max={care.medStats.total} />
                </Card>
                <Card title="Vaccinations" icon="💉" tone="mint" action={<button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => onNavigate('vaccinations')}>Open</button>}>
                    {nextVac ? <p style={{ margin: 0 }}>Next: <strong>{nextVac.name}</strong><br /><span className="mc-muted mc-small">Due {nextVac.dueDate}</span></p>
                        : <p className="mc-muted" style={{ margin: 0 }}>No upcoming dates set yet.</p>}
                </Card>
                <Card title="Wellness" icon="🧘‍♀️" tone="lav" action={<button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => onNavigate('wellness')}>Open</button>}>
                    {care.wellnessToday.length
                        ? <p style={{ margin: 0 }}><strong>{care.wellnessToday.length}</strong> session{care.wellnessToday.length > 1 ? 's' : ''} completed today</p>
                        : <p className="mc-muted" style={{ margin: 0 }}>No wellness session yet today.</p>}
                </Card>
                <Card title="Connections" icon="🤝" action={<button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => onNavigate('connections')}>Manage</button>}>
                    <div className="mc-stack">
                        <div className="mc-row mc-between"><span>Family</span><Chip tone="info">Sharing {sharedCount} item{sharedCount === 1 ? '' : 's'}</Chip></div>
                        <div className="mc-row mc-between"><span>Doctor</span><Chip tone="soon">Under Development</Chip></div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
