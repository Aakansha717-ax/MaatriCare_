import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import './App.css';

const navItems = [
  { label: 'Pregnancy', href: '#health' },
  { label: 'Postpartum', href: '#reminders' },
  { label: 'Baby care', href: '#baby-care' },
  { label: 'Wellness', href: '#wellness' },
];

const initialReminders = [
  { id: 1, time: '9:00 AM', title: 'Prenatal vitamins', detail: 'Daily supplement', done: true },
  { id: 2, time: '11:30 AM', title: 'Drink a glass of water', detail: 'A little hydration break', done: false },
  { id: 3, time: 'Tomorrow', title: 'Check-in with Dr. Patel', detail: '10:30 AM · Prenatal visit', done: false },
  { id: 4, time: 'Next month', title: 'Baby’s vaccination', detail: 'Check the schedule with your care team', done: false },
];

const moods = [
  { label: 'Calm', face: '☺' },
  { label: 'Good', face: '☻' },
  { label: 'Okay', face: '◡' },
  { label: 'Low', face: '☹' },
];

function DashboardContent() {
  const { user, switchRole } = useAuth();
  const [activeNav, setActiveNav] = useState('Pregnancy');
  const [reminders, setReminders] = useState(initialReminders);
  const [feeds, setFeeds] = useState(6);
  const [mood, setMood] = useState('');
  const [breathing, setBreathing] = useState(false);
  const [watchStatus, setWatchStatus] = useState('Not connected');
  const [vitals, setVitals] = useState({ heartRate: 78, spo2: 98, sleep: 7.5, steps: 2840 });

  const toggleReminder = (id) => {
    setReminders((items) => items.map((item) => (
      item.id === id ? { ...item, done: !item.done } : item
    )));
  };

  const connectWatch = async () => {
    if (!navigator.bluetooth) {
      setWatchStatus('Bluetooth is not available in this browser');
      return;
    }

    try {
      setWatchStatus('Choose your device…');
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['6e400801-b5a3-f393-e0a9-e50e24dcca9d'],
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('6e400801-b5a3-f393-e0a9-e50e24dcca9d');
      const characteristic = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9d');
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const data = event.target.value;
        const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        if (bytes[0] !== 0xcd || bytes.length < 20) return;

        setVitals((current) => ({
          ...current,
          steps: (bytes[12] << 8) | bytes[13],
          heartRate: bytes[19] || current.heartRate,
        }));
      });
      device.addEventListener('gattserverdisconnected', () => setWatchStatus('Disconnected'));
      setWatchStatus(`${device.name || 'Device'} connected`);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        setWatchStatus('No device selected');
      } else {
        console.error('Could not connect to the wearable:', error);
        setWatchStatus('Could not connect. Please try again.');
      }
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="MaatriCare home">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 36 36" fill="none">
              <path d="M18 29s-11-6.6-11-14.1a6.1 6.1 0 0 1 11-3.6 6.1 6.1 0 0 1 11 3.6C29 22.4 18 29 18 29Z" fill="currentColor" />
              <path d="M18 13v9m-4.5-4.5h9" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <span>Maatri<span className="brand-light">Care</span></span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <a
              className={activeNav === item.label ? 'nav-link nav-link-active' : 'nav-link'}
              href={item.href}
              key={item.label}
              onClick={() => setActiveNav(item.label)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="profile">
          <span className="profile-avatar" aria-hidden="true">A</span>
          <label className="sr-only" htmlFor="role-select">Choose profile role</label>
          <select
            id="role-select"
            className="role-select"
            value={user.role}
            onChange={(event) => switchRole(event.target.value)}
          >
            <option value="mother">Ayesha · Mother</option>
            <option value="husband">Partner view</option>
            <option value="doctor">Doctor view</option>
          </select>
          <span className="select-chevron" aria-hidden="true">⌄</span>
        </div>
      </header>

      <main id="home" className="dashboard">
        <section className="welcome-panel" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR LITTLE MOMENTS MATTER</div>
            <h1 id="welcome-title">Good morning, {user.name.split(' ')[0]} <span aria-hidden="true">☀️</span></h1>
            <p className="welcome-description">A gentle space to care for yourself and your growing family.</p>
            <div className="welcome-meta">
              <span className="date-pill"><span aria-hidden="true">♡</span> One day at a time</span>
              <span className="meta-divider" />
              <span>You’re doing wonderfully</span>
            </div>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <span className="art-sparkle sparkle-one">✳</span>
            <span className="art-sparkle sparkle-two">✦</span>
            <span className="art-leaf leaf-one" />
            <span className="art-leaf leaf-two" />
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-heart">♡</div>
            <div className="art-caption"><span>made with</span><strong>love & care</strong></div>
          </div>
        </section>

        <section className="section-heading" id="health">
          <div>
            <span className="section-kicker">YOUR DAILY OVERVIEW</span>
            <h2>A little check-in</h2>
          </div>
          <span className="today-label"><span className="live-dot" /> Your space, your pace</span>
        </section>

        <section className="dashboard-grid" aria-label="Your care dashboard">
          <article className="care-card health-card">
            <div className="card-heading">
              <span className="icon-tile icon-pink" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M6.5 11h3l1.5-3 2.2 6 1.5-3h3.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <div className="card-title-wrap"><h3>Health monitoring</h3><p>Example readings · connect a device for live vitals</p></div>
              <span className="card-more" aria-hidden="true">···</span>
            </div>
            <div className="health-metrics">
              <div className="metric metric-heart">
                <span className="metric-label"><span className="metric-dot" /> HEART RATE</span>
                <div className="metric-value">{vitals.heartRate} <span>bpm</span></div>
                <svg className="sparkline pink-line" viewBox="0 0 120 30" preserveAspectRatio="none" aria-label="Heart rate trend">
                  <path d="M0 19h15l7-7 8 14 9-18 8 11h14l7-5 8 8 9-15 8 12h27" />
                </svg>
              </div>
              <div className="metric metric-oxygen">
                <span className="metric-label"><span className="metric-dot blue-dot" /> OXYGEN</span>
                <div className="metric-value">{vitals.spo2}<span>%</span></div>
                <div className="metric-note">SpO₂</div>
              </div>
              <div className="metric metric-sleep">
                <span className="metric-label"><span className="metric-dot lavender-dot" /> SLEEP</span>
                <div className="metric-value">{vitals.sleep} <span>hrs</span></div>
                <div className="sleep-bars" aria-label="Sleep summary">
                  <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
                </div>
              </div>
              <div className="metric metric-activity">
                <span className="metric-label"><span className="metric-dot mint-dot" /> ACTIVITY</span>
                <div className="metric-value">{vitals.steps.toLocaleString()} <span>steps</span></div>
                <div className="activity-track"><span /></div>
                <div className="metric-note">A lovely start to your day</div>
              </div>
            </div>
            <div className="card-footer health-footer">
              <span className="device-status" role="status" aria-live="polite"><span className={watchStatus.includes('connected') && !watchStatus.includes('Not connected') ? 'device-dot connected-dot' : 'device-dot'} />{watchStatus}</span>
              <button className="text-button" onClick={connectWatch} type="button">Connect device <span aria-hidden="true">↗</span></button>
            </div>
          </article>

          <article className="care-card reminders-card" id="reminders">
            <div className="card-heading">
              <span className="icon-tile icon-blue" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
              <div className="card-title-wrap"><h3>Gentle reminders</h3><p>Small things, right on time</p></div>
              <button className="icon-button" type="button" aria-label="Add a reminder" onClick={() => setReminders((items) => [...items, { id: Date.now(), time: 'Anytime', title: 'Take a mindful pause', detail: 'A moment just for you', done: false }])}>+</button>
            </div>
            <div className="reminder-list">
              {reminders.map((reminder) => (
                <button
                  className={`reminder-row${reminder.done ? ' reminder-done' : ''}`}
                  key={reminder.id}
                  type="button"
                  onClick={() => toggleReminder(reminder.id)}
                  aria-pressed={reminder.done}
                >
                  <span className={`check-circle${reminder.done ? ' checked' : ''}`} aria-hidden="true">{reminder.done ? '✓' : ''}</span>
                  <span className="reminder-content"><strong>{reminder.title}</strong><small>{reminder.detail}</small></span>
                  <span className="reminder-time">{reminder.time}</span>
                </button>
              ))}
            </div>
            <button className="view-all-button" type="button" onClick={() => setReminders((items) => items.map((item) => ({ ...item, done: true })))}>Mark all as done <span aria-hidden="true">→</span></button>
          </article>

          <article className="care-card baby-card" id="baby-care">
            <div className="card-heading">
              <span className="icon-tile icon-lavender" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" stroke="currentColor" strokeWidth="1.7" /><path d="M9 13.5c1.7 1.8 4.3 1.8 6 0M9.5 10h.01M14.5 10h.01M12 5V3m-3 1.3 1 1.1m5-1.1-1 1.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              </span>
              <div className="card-title-wrap"><h3>Baby care</h3><p>Every little milestone is a big one</p></div>
              <span className="baby-sparkle" aria-hidden="true">✦</span>
            </div>
            <div className="baby-highlight">
              <div className="baby-illustration" aria-hidden="true"><span>♡</span><i>✦</i></div>
              <div><span className="highlight-label">TODAY’S LITTLE WINS</span><strong>Growing with love</strong><small>Every day brings something new</small></div>
            </div>
            <div className="baby-stats">
              <div className="baby-stat"><span className="baby-stat-icon feed-icon" aria-hidden="true">◒</span><span><small>Feedings today</small><strong>{feeds} <em>logged</em></strong></span></div>
              <div className="baby-stat"><span className="baby-stat-icon milestone-icon" aria-hidden="true">✧</span><span><small>Next milestone</small><strong>Little smiles</strong></span></div>
            </div>
            <div className="card-footer baby-footer">
              <span className="last-feed">Last feed · 10:15 AM</span>
              <button className="text-button" type="button" onClick={() => setFeeds((count) => count + 1)}>Log a feed <span aria-hidden="true">+</span></button>
            </div>
          </article>

          <article className="care-card wellness-card" id="wellness">
            <div className="card-heading">
              <span className="icon-tile icon-mint" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-3.6-7-9a4 4 0 0 1 7-2.7A4 4 0 0 1 19 11c0 5.4-7 9-7 9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M8 13c1.1-1.7 2.2-1.7 3.3 0s2.2 1.7 3.4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              </span>
              <div className="card-title-wrap"><h3>Mental wellness</h3><p>How are you feeling today?</p></div>
            </div>
            <div className="mood-prompt">Take a moment to check in with yourself.</div>
            <div className="mood-options" role="group" aria-label="Choose your mood">
              {moods.map((item) => (
                <button
                  className={`mood-option${mood === item.label ? ' mood-selected' : ''}`}
                  key={item.label}
                  type="button"
                  onClick={() => setMood(item.label)}
                  aria-pressed={mood === item.label}
                >
                  <span className={`mood-face mood-${item.label.toLowerCase()}`} aria-hidden="true">{item.face}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <div className={`breathing-box${breathing ? ' breathing-active' : ''}`}>
              <div className="breathing-orb" aria-hidden="true"><span>✿</span></div>
              <div className="breathing-copy"><strong>{breathing ? 'Breathe in… and out' : 'A moment to breathe'}</strong><small>{breathing ? 'Follow the gentle rhythm' : 'A little calm goes a long way'}</small></div>
              <button className="breathing-button" type="button" onClick={() => setBreathing((active) => !active)}>{breathing ? 'Finish' : 'Begin'} <span aria-hidden="true">{breathing ? '×' : '→'}</span></button>
            </div>
            {mood && <p className="mood-thanks" role="status">Thank you for checking in. Be gentle with yourself. ♡</p>}
          </article>
        </section>

        <footer className="page-footer">
          <span><span className="footer-heart" aria-hidden="true">♡</span> Here for you, every step of the way.</span>
          <span>Made with care for every kind of journey</span>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
