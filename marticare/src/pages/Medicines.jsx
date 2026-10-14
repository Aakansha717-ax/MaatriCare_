import React, { useState } from 'react';
import { useCare } from '../context/CareContext';
import { Card, PageHeader, Progress, Chip, MEDICAL_DISCLAIMER } from '../components/common/UI';

const REC = { daily: 'Every day', weekdays: 'Weekdays', once: 'Today only' };

export default function Medicines() {
    const care = useCare();
    const [form, setForm] = useState({ name: '', time: '08:00', recurrence: 'daily' });
    const [editId, setEditId] = useState(null);
    const [draft, setDraft] = useState({});
    const done = (id) => !!(care.medLog[care.day] || {})[id];

    const add = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        care.addMedicine(form);
        setForm({ name: '', time: form.time, recurrence: form.recurrence });
    };
    const startEdit = (m) => { setEditId(m.id); setDraft({ name: m.name, time: m.time, recurrence: m.recurrence }); };
    const saveEdit = () => { care.updateMedicine(editId, { ...draft, name: draft.name.trim() || 'Medicine' }); setEditId(null); };

    return (
        <div>
            <PageHeader title="💊 Today's Care Checklist" subtitle={`${care.medStats.done}/${care.medStats.total} completed · ${care.medStats.percent}%`} />
            <div className="mc-grid mc-grid--2">
                <Card title="Checklist" tone="soft">
                    <Progress value={care.medStats.done} max={care.medStats.total} tone="ok" />
                    {care.todayMeds.length === 0 && (
                        <div style={{ marginTop: 14 }}>
                            <p className="mc-muted">Nothing scheduled for today. Add your medicines using the form.</p>
                            {care.medicines.length === 0 && <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={care.loadDemoMedicines}>Load demo examples</button>}
                        </div>
                    )}
                    {care.todayMeds.map((m) => (
                        <div key={m.id} className={`mc-list-item ${done(m.id) ? 'mc-list-item--done' : ''}`}>
                            <input className="mc-check" type="checkbox" checked={done(m.id)} onChange={() => care.toggleMedicineDone(m.id)} />
                            {editId === m.id ? (
                                <div className="mc-list-item__text mc-row">
                                    <input className="mc-input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                                    <input className="mc-input" type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
                                    <select className="mc-select" value={draft.recurrence} onChange={(e) => setDraft({ ...draft, recurrence: e.target.value })}>
                                        {Object.entries(REC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                    <button className="mc-btn mc-btn--sm" onClick={saveEdit}>Save</button>
                                </div>
                            ) : (
                                <>
                                    <div className="mc-list-item__text"><strong>{m.name}</strong><br /><span className="mc-muted mc-small">{m.time} · {REC[m.recurrence]}</span></div>
                                    <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={() => startEdit(m)}>Edit</button>
                                    <button className="mc-btn mc-btn--danger mc-btn--sm" onClick={() => care.removeMedicine(m.id)}>Delete</button>
                                </>
                            )}
                        </div>
                    ))}
                </Card>
                <Card title="Add medicine" icon="➕">
                    <form onSubmit={add} className="mc-stack">
                        <div><label className="mc-label">Name</label><input className="mc-input" style={{ width: '100%' }} placeholder="e.g. Morning prenatal vitamin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="mc-row">
                            <div><label className="mc-label">Time</label><input className="mc-input" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
                            <div><label className="mc-label">Recurrence</label>
                                <select className="mc-select" value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value })}>
                                    {Object.entries(REC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select></div>
                        </div>
                        <button className="mc-btn">Add to checklist</button>
                        <Chip tone="info">A reminder fires at the set time while the app is open</Chip>
                    </form>
                    <p className="mc-muted mc-small" style={{ marginTop: 14, marginBottom: 0 }}>{MEDICAL_DISCLAIMER} Follow the instructions given by your doctor or pharmacist.</p>
                </Card>
            </div>
        </div>
    );
}
