import React, { useState } from 'react';
import { useCare, CATEGORIES } from '../context/CareContext';
import { Card, PageHeader, Chip } from '../components/common/UI';

const ICON = { Hydration: '💧', Medicine: '💊', Meal: '🍱', Vaccination: '💉', Health: '⚠️', Wellness: '🧘‍♀️', Doctor: '🩺', Family: '👨‍👩‍👧' };

export default function NotificationCenter() {
    const care = useCare();
    const [filter, setFilter] = useState('All');
    const list = care.notifications.filter((n) => filter === 'All' || n.category === filter);

    return (
        <div>
            <PageHeader title="🔔 Notification Center" subtitle={`${care.unreadCount} unread`}
                right={<div className="mc-row">
                    <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={care.markAllRead}>Mark all read</button>
                    <button className="mc-btn mc-btn--danger mc-btn--sm" onClick={care.clearNotifications}>Clear history</button>
                </div>} />
            <div className="mc-row" style={{ marginBottom: 14 }}>
                {['All', ...CATEGORIES].map((c) => (
                    <button key={c} className={`mc-btn mc-btn--sm ${filter === c ? '' : 'mc-btn--ghost'}`} onClick={() => setFilter(c)}>{c}</button>
                ))}
            </div>
            <div className="mc-grid mc-grid--2">
                <Card title="History">
                    {list.length === 0 && <p className="mc-muted">No notifications yet.</p>}
                    {list.map((n) => (
                        <div key={n.id} className="mc-list-item" style={{ cursor: 'pointer', opacity: n.read ? 0.65 : 1 }} onClick={() => care.markRead(n.id)}>
                            <span style={{ fontSize: 24 }}>{ICON[n.category]}</span>
                            <div className="mc-list-item__text">
                                <strong>{n.title}</strong> {!n.read && <Chip tone="info">New</Chip>}<br />
                                <span className="mc-small">{n.body}</span><br />
                                <span className="mc-muted mc-small">{n.category} · {new Date(n.ts).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </Card>
                <Card title="Preferences" icon="⚙️">
                    <div className="mc-label">Categories</div>
                    {CATEGORIES.map((c) => (
                        <label key={c} className="mc-list-item" style={{ cursor: 'pointer' }}>
                            <input className="mc-check" type="checkbox" checked={care.prefs.categories[c] !== false} onChange={(e) => care.setCategoryPref(c, e.target.checked)} />
                            <span className="mc-list-item__text">{ICON[c]} {c}</span>
                        </label>
                    ))}
                    <div className="mc-label" style={{ marginTop: 14 }}>Channels</div>
                    {[['browser', 'Browser notification'], ['sound', 'Sound'], ['watch', 'Smartwatch vibration / alert']].map(([k, label]) => (
                        <label key={k} className="mc-list-item" style={{ cursor: 'pointer' }}>
                            <input className="mc-check" type="checkbox" checked={care.prefs.channels[k]} onChange={(e) => care.setChannelPref(k, e.target.checked)} />
                            <span className="mc-list-item__text">{label}</span>
                        </label>
                    ))}
                </Card>
            </div>
        </div>
    );
}
