import React from 'react';
import { Card } from '../components/common/UI';
import { MEDICAL_DISCLAIMER } from '../components/common/UI';

const HELPS = [
    ['❤️', 'Health Monitoring', 'Connect a BLE smartwatch to view heart rate, temperature and activity, with alerts when readings leave your configured range.'],
    ['💧', 'Hydration', 'Regular, customisable reminders on your phone, browser and watch, with a daily progress goal.'],
    ['🥗', 'Nutrition', 'Meal reminders and general nutrition guidance for breakfast, lunch, snack and dinner.'],
    ['💊', 'Medication', 'A daily care checklist with times and recurrence so nothing gets missed.'],
    ['💉', 'Vaccination', 'A simple timeline to track vaccines you plan to take with your healthcare provider.'],
    ['🧘‍♀️', 'Mental Wellness', 'Prenatal yoga, breathing, meditation and relaxation with a built-in timer.'],
    ['👨‍👩‍👧', 'Family Support', "Share only what you choose, so your partner can help at the right moments."],
    ['🩺', 'Doctor Support', 'A clinical connection portal is planned and currently under development.']
];

export default function Landing({ onGetStarted, onLogin }) {
    const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    return (
        <div>
            <div className="mc-land-top">
                <span className="mc-logo" style={{ cursor: 'default' }}>🌸 MaatriCare</span>
                <div className="mc-row">
                    <button className="mc-btn mc-btn--ghost mc-btn--sm" onClick={onLogin}>Log in</button>
                    <button className="mc-btn mc-btn--sm" onClick={onGetStarted}>Sign up</button>
                </div>
            </div>

            <header className="mc-hero">
                <div className="mc-hero__inner">
                    <h1>MaatriCare</h1>
                    <div className="mc-hero__tag">Care for Her. Connect the Family. Empower Motherhood.</div>
                    <p className="mc-hero__desc">MaatriCare brings maternal health, wellness, nutrition, reminders and family support together in one connected platform.</p>
                    <div className="mc-hero__chips">
                        <span className="mc-chip mc-chip--info">🩺 Maternal healthcare</span>
                        <span className="mc-chip mc-chip--ok">⌚ IoT smartwatch</span>
                        <span className="mc-chip">👨‍👩‍👧 Family connectivity</span>
                    </div>
                    <div className="mc-row" style={{ justifyContent: 'center' }}>
                        <button className="mc-btn mc-btn--lg" onClick={onGetStarted}>Get Started</button>
                        <button className="mc-btn mc-btn--ghost mc-btn--lg" onClick={() => scrollTo('about')}>Learn More</button>
                    </div>
                </div>
            </header>

            <section id="about" className="mc-section">
                <h2>About MaatriCare</h2>
                <p className="mc-section__sub">
                    Pregnancy needs consistent attention to hydration, nutrition, medicines, vaccinations, health monitoring,
                    rest, mental wellness, doctor consultations and family support. MaatriCare brings these into one connected ecosystem.
                </p>
                <div className="mc-eco">
                    <div className="mc-eco__node">🤰 Mother</div>
                    <div className="mc-eco__arrow">↓</div>
                    <div className="mc-eco__node mc-eco__node--core">MaatriCare</div>
                    <div className="mc-eco__arrow">↓</div>
                    <div className="mc-eco__node">Health + Nutrition + Wellness + Reminders</div>
                    <div className="mc-eco__arrow">↓</div>
                    <div className="mc-eco__split">
                        <div className="mc-eco__node">👨‍👩‍👧 Husband / Family</div>
                        <div className="mc-eco__node">🩺 Doctor</div>
                    </div>
                </div>
            </section>

            <section className="mc-section" style={{ paddingTop: 0 }}>
                <h2>How MaatriCare Helps Women</h2>
                <p className="mc-section__sub">Eight everyday areas, gently supported in one place.</p>
                <div className="mc-grid">
                    {HELPS.map(([icon, title, text]) => (
                        <Card key={title}>
                            <div className="mc-feature-icon">{icon}</div>
                            <h3 className="mc-card__title">{title}</h3>
                            <p className="mc-muted" style={{ marginTop: 6, marginBottom: 0 }}>{text}</p>
                        </Card>
                    ))}
                </div>
            </section>

            <section className="mc-section" style={{ paddingTop: 0 }}>
                <h2>Features</h2>
                <p className="mc-section__sub">Built for the mother first, with family kept in the loop.</p>
                <div className="mc-grid">
                    {[
                        ['⌚', 'BLE smartwatch', 'Live data over Web Bluetooth and reminders pushed to the watch.', 'sky'],
                        ['🔔', 'Smart reminders', 'Browser, sound and smartwatch notifications for water, meals and medicine.', 'soft'],
                        ['👨‍👩‍👧', 'Family sharing', 'Controlled, read-only visibility into what the mother shares.', 'mint'],
                        ['🧘‍♀️', 'Wellness tools', 'Yoga, breathing and meditation with a built-in timer.', 'lav']
                    ].map(([i, t, d, tone]) => (
                        <Card key={t} tone={tone}>
                            <div className="mc-feature-icon">{i}</div>
                            <h3 className="mc-card__title">{t}</h3>
                            <p className="mc-muted" style={{ marginBottom: 0 }}>{d}</p>
                        </Card>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <button className="mc-btn mc-btn--lg" onClick={onGetStarted}>Get Started</button>
                </div>
            </section>

            <footer className="mc-footer">{MEDICAL_DISCLAIMER}<br />© MaatriCare</footer>
        </div>
    );
}
