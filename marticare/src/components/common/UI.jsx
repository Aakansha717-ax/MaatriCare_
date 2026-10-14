// src/components/common/UI.jsx — small shared building blocks.
import React from 'react';

export function Card({ title, icon, action, tone, children, className = '', style }) {
    return (
        <section className={`mc-card ${tone ? `mc-card--${tone}` : ''} ${className}`} style={style}>
            {(title || action) && (
                <div className="mc-card__head">
                    <h3 className="mc-card__title">{icon ? `${icon} ` : ''}{title}</h3>
                    {action}
                </div>
            )}
            {children}
        </section>
    );
}

export function Stat({ icon, label, value, unit, hint, alert }) {
    const empty = value == null || value === '';
    return (
        <div className={`mc-card mc-stat ${alert ? 'mc-stat--alert' : ''}`}>
            <div className="mc-stat__icon">{icon}</div>
            <div className="mc-stat__label">{label}</div>
            <div className="mc-stat__value">
                {empty ? '—' : value}
                {!empty && unit && <span className="mc-stat__unit">{unit}</span>}
            </div>
            {hint && <div className="mc-stat__hint">{hint}</div>}
        </div>
    );
}

export function Progress({ value, max, tone }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return <div className={`mc-progress ${tone ? `mc-progress--${tone}` : ''}`}><span style={{ width: `${pct}%` }} /></div>;
}

export function Chip({ tone, children }) {
    return <span className={`mc-chip ${tone ? `mc-chip--${tone}` : ''}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, right }) {
    return (
        <div className="mc-page-head">
            <div>
                <h1>{title}</h1>
                {subtitle && <div className="mc-muted">{subtitle}</div>}
            </div>
            {right}
        </div>
    );
}

export function Sparkline({ values = [], color = 'var(--mc-primary)', height = 56 }) {
    const v = values.filter((x) => typeof x === 'number' && !Number.isNaN(x));
    if (v.length < 2) return <div className="mc-muted mc-small">Collecting readings…</div>;
    const w = 300;
    const min = Math.min(...v);
    const max = Math.max(...v);
    const span = max - min || 1;
    const pts = v.map((y, i) => `${(i / (v.length - 1)) * w},${height - 4 - ((y - min) / span) * (height - 8)}`).join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="mc-spark" style={{ height }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
    );
}

export const ComingSoon = () => <Chip tone="soon">Coming Soon</Chip>;

export const MEDICAL_DISCLAIMER =
    'MaatriCare is a wellness and support tool. It does not diagnose conditions or replace advice from your healthcare professional.';
