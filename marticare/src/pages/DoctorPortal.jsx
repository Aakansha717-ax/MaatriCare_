import React from 'react';
import { Card, PageHeader, ComingSoon } from '../components/common/UI';

const TITLES = { dashboard: 'Dashboard', patients: 'Patients', data: 'Health Data', notes: 'Clinical Notes', appointments: 'Appointments' };
const FUTURE = [['Patients', '👩‍⚕️', 'View the mothers who have connected to you.'], ['Vitals trends', '📈', 'Review shared vitals over time.'], ['Health history', '🗂️', 'Access shared health records.'], ['Clinical notes', '📝', 'Write and review notes.'], ['Appointments', '📅', 'Schedule and manage visits.']];

export default function DoctorPortal({ view }) {
    return (
        <div>
            <PageHeader title="Doctor Portal" subtitle={TITLES[view] || 'Dashboard'} />
            <div className="mc-note mc-note--warn"><strong>Doctor Portal — Under Development</strong><br />Clinical connection features are currently under development. No patient data is available or displayed.</div>
            <div className="mc-grid">
                {FUTURE.map(([t, i, d]) => (
                    <Card key={t} tone="lav" title={t} icon={i} action={<ComingSoon />}>
                        <p className="mc-muted" style={{ marginBottom: 0 }}>{d}</p>
                    </Card>
                ))}
            </div>
        </div>
    );
}
