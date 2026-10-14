import React, { useState } from 'react';
import { useCare } from '../context/CareContext';
import { Card, PageHeader, Chip } from '../components/common/UI';

function statusOf(v, today) {
    if (v.status === 'completed') return ['Completed', 'ok'];
    if (v.dueDate && v.dueDate < today) return ['Overdue', 'danger'];
    return ['Upcoming', 'info'];
}

export default function Vaccinations() {
    const care = useCare();
    const [form, setForm] = useState({ name: '', dueDate: '' });
    const sorted = [...care.vaccines].sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));

    const add = (e) => { e.preventDefault(); if (form.name.trim()) { care.addVaccine(form); setForm({ name: '', dueDate: '' }); } };

    return (
        <div>
            <PageHeader title="💉 Vaccination Timeline" subtitle="Enter the dates your healthcare provider recommends." />
            <div className="mc-note mc-note--warn">Vaccination schedules vary. MaatriCare only tracks dates you enter; please confirm timing with your healthcare professional.</div>
            <div className="mc-grid mc-grid--2">
                <Card title="Timeline">
                    <div className="mc-timeline">
                        {sorted.map((v) => {
                            const [label, tone] = statusOf(v, care.day);
                            return (
                                <div key={v.id} className={`mc-timeline__item ${v.status === 'completed' ? 'mc-timeline__item--done' : ''}`}>
                                    <span className="mc-timeline__dot" />
                                    <div className="mc-row mc-between">
                                        <strong>{v.name}</strong><Chip tone={tone}>{label}</Chip>
                                    </div>
                                    <div className="mc-row" style={{ marginTop: 6 }}>
                                        <input className="mc-input" type="date" value={v.dueDate} onChange={(e) => care.updateVaccine(v.id, { dueDate: e.target.value })} />
                                        <button className="mc-btn mc-btn--sm" onClick={() => care.updateVaccine(v.id, { status: v.status === 'completed' ? 'upcoming' : 'completed' })}>
                                            {v.status === 'completed' ? 'Undo' : 'Mark completed'}
                                        </button>
                                        <button className="mc-btn mc-btn--danger mc-btn--sm" onClick={() => care.removeVaccine(v.id)}>Remove</button>
                                    </div>
                                    {!v.dueDate && v.status !== 'completed' && <div className="mc-muted mc-small" style={{ marginTop: 4 }}>Due date not set</div>}
                                </div>
                            );
                        })}
                    </div>
                </Card>
                <Card title="Add vaccination record" icon="➕">
                    <form onSubmit={add} className="mc-stack">
                        <div><label className="mc-label">Name</label><input className="mc-input" style={{ width: '100%' }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div><label className="mc-label">Due date</label><input className="mc-input" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
                        <button className="mc-btn">Add</button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
