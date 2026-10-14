import React from 'react';
import { useCare } from '../context/CareContext';
import { isApiConfigured } from '../services/apiService';
import { Card, PageHeader, Chip } from '../components/common/UI';

const SHARE_ITEMS = [
    ['hydration', '💧 Hydration progress'], ['medicines', '💊 Medicine completion'], ['wellness', '🧘‍♀️ Wellness activity'],
    ['vaccinations', '💉 Next vaccination'], ['alerts', '⚠️ Health alerts'], ['vitals', '❤️ Live vitals (heart rate, temperature, steps)']
];

export default function Connections() {
    const { sharing, setSharing } = useCare();
    return (
        <div>
            <PageHeader title="🤝 Connections" subtitle="You decide what your family can see. Nothing is shared unless it is switched on." />
            <div className="mc-grid mc-grid--2">
                <Card title="Husband / Family" icon="👨‍👩‍👧" tone="mint" action={<Chip tone="info">Read-only for family</Chip>}>
                    {SHARE_ITEMS.map(([key, label]) => (
                        <label key={key} className="mc-list-item" style={{ cursor: 'pointer' }}>
                            <input className="mc-check" type="checkbox" checked={!!sharing[key]} onChange={(e) => setSharing((s) => ({ ...s, [key]: e.target.checked }))} />
                            <span className="mc-list-item__text">{label}</span>
                            <Chip tone={sharing[key] ? 'ok' : undefined}>{sharing[key] ? 'Shared' : 'Private'}</Chip>
                        </label>
                    ))}
                    <div className="mc-note mc-note--warn" style={{ marginTop: 14, marginBottom: 0 }}>
                        {isApiConfigured()
                            ? 'Your shared summary is sent to the MaatriCare backend.'
                            : 'Demo mode: the shared summary is stored in this browser only, so the Family view works on this device. Cross-device family linking needs the backend endpoints listed in the README.'}
                    </div>
                </Card>
                <Card title="Doctor" icon="🩺" tone="lav" action={<Chip tone="soon">Under Development</Chip>}>
                    <p>Doctor Portal — Under Development.</p>
                    <p className="mc-muted" style={{ marginBottom: 0 }}>Clinical connection features are currently under development. No health data is sent to any doctor.</p>
                </Card>
            </div>
        </div>
    );
}
