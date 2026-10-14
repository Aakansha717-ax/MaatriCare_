import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BleProvider } from './context/BleContext';
import { CareProvider } from './context/CareContext';

import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import MotherDashboard from './pages/MotherDashboard';
import Medicines from './pages/Medicines';
import Vaccinations from './pages/Vaccinations';
import Nutrition from './pages/Nutrition';
import TimerPage from './pages/TimerPage';
import NotificationCenter from './pages/NotificationCenter';
import Connections from './pages/Connections';
import FamilyDashboard from './pages/FamilyDashboard';
import DoctorPortal from './pages/DoctorPortal';

import './styles/theme.css';
import './App.css';

const NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '⌂',
    roles: ['mother', 'husband', 'doctor'],
  },
  {
    id: 'medicines',
    label: 'Medicines',
    icon: '💊',
    roles: ['mother'],
  },
  {
    id: 'vaccinations',
    label: 'Vaccinations',
    icon: '💉',
    roles: ['mother'],
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: '🥗',
    roles: ['mother'],
  },
  {
    id: 'wellness',
    label: 'Wellness & timer',
    icon: '🧘',
    roles: ['mother'],
  },
  {
    id: 'reminders',
    label: 'Reminders & alerts',
    icon: '🔔',
    roles: ['mother'],
  },
  {
    id: 'connections',
    label: 'Sharing & connections',
    icon: '🤝',
    roles: ['mother'],
  },
  {
    id: 'family',
    label: 'Family view',
    icon: '👨‍👩‍👧',
    roles: ['husband'],
  },
  {
    id: 'doctor',
    label: 'Doctor portal',
    icon: '🩺',
    roles: ['doctor'],
  },
];

const ROUTES = new Set([
  'dashboard',
  'medicines',
  'vaccinations',
  'nutrition',
  'wellness',
  'reminders',
  'connections',
  'family',
  'doctor',
]);

const pathFor = (route) =>
  route === 'home'
    ? '/'
    : route === 'login'
      ? '/login'
      : route === 'signup'
        ? '/signup'
        : `/${route}`;

const routeFromPath = () => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');

  if (!path) return 'home';

  if (path === 'login' || path === 'signup') {
    return path;
  }

  return ROUTES.has(path) ? path : 'home';
};

function AppFrame() {
  const { user, switchRole } = useAuth();

  const [route, setRoute] = useState(routeFromPath);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onPop = () => {
      setRoute(routeFromPath());
      setMenuOpen(false);
    };

    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  const navigate = (next) => {
    const safeRoute =
      next === 'home' ||
        next === 'login' ||
        next === 'signup' ||
        ROUTES.has(next)
        ? next
        : 'dashboard';

    if (safeRoute !== route) {
      window.history.pushState({}, '', pathFor(safeRoute));
    }

    setRoute(safeRoute);
    setMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const role = user?.role || 'mother';

  const visibleNav = NAV.filter((item) =>
    item.roles.includes(role)
  );

  const isPublic =
    route === 'home' ||
    route === 'login' ||
    route === 'signup';

  let content;

  if (route === 'home') {
    content = (
      <Landing
        onGetStarted={() => navigate('signup')}
        onLogin={() => navigate('login')}
      />
    );
  } else if (route === 'login' || route === 'signup') {
    content = (
      <AuthPage
        key={route}
        initialMode={route}
        onBack={() => navigate('home')}
        onDone={() => navigate('dashboard')}
      />
    );
  } else if (route === 'dashboard') {
    if (role === 'husband') {
      content = <FamilyDashboard view="dashboard" />;
    } else if (role === 'doctor') {
      content = <DoctorPortal view="dashboard" />;
    } else {
      content = <MotherDashboard onNavigate={navigate} />;
    }
  } else if (route === 'medicines') {
    content = <Medicines />;
  } else if (route === 'vaccinations') {
    content = <Vaccinations />;
  } else if (route === 'nutrition') {
    content = <Nutrition />;
  } else if (route === 'wellness') {
    content = <TimerPage />;
  } else if (route === 'reminders') {
    content = <NotificationCenter />;
  } else if (route === 'connections') {
    content = <Connections />;
  } else if (route === 'family') {
    content = <FamilyDashboard view="dashboard" />;
  } else if (route === 'doctor') {
    content = <DoctorPortal view="dashboard" />;
  } else {
    content = <MotherDashboard onNavigate={navigate} />;
  }

  if (isPublic) {
    return <div className="mc-app-public">{content}</div>;
  }

  return (
    <div className="mc-app-layout">
      <aside
        className={`mc-sidebar ${menuOpen ? 'mc-sidebar--open' : ''}`}
      >
        <button
          className="mc-brand-button"
          onClick={() => navigate('dashboard')}
          aria-label="MaatriCare dashboard"
        >
          <span className="mc-brand-flower">🌸</span>
          <span>
            Maatri<span>Care</span>
            <small>Connected care, gently.</small>
          </span>
        </button>

        <div className="mc-sidebar-label">YOUR SPACE</div>

        <nav
          className="mc-side-nav"
          aria-label="Dashboard navigation"
        >
          {visibleNav.map((item) => (
            <button
              key={item.id}
              className={`mc-side-link ${route === item.id ? 'is-active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <span className="mc-side-icon">{item.icon}</span>
              <span>{item.label}</span>

              {item.id === 'reminders' && (
                <span className="mc-nav-dot" />
              )}
            </button>
          ))}
        </nav>

        <div className="mc-sidebar-bottom">
          <div className="mc-sidebar-note">
            <span>♡</span>
            <strong>A little reminder</strong>
            <p>
              You deserve care, too. Take things one step at a time.
            </p>
          </div>

          <button
            className="mc-side-link mc-side-home"
            onClick={() => navigate('home')}
          >
            <span className="mc-side-icon">↗</span>
            Visit welcome page
          </button>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="mc-mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="mc-app-main">
        <header className="mc-topbar">
          <button
            className="mc-mobile-menu"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>

          <div className="mc-breadcrumb">
            <span>MAATRICARE</span>
            <b>/</b>
            {NAV.find((item) => item.id === route)?.label ||
              (route === 'family'
                ? 'Family view'
                : 'Doctor portal')}
          </div>

          <div className="mc-top-actions">
            <button
              className="mc-top-icon"
              title="Notifications"
              aria-label="Open notifications"
              onClick={() =>
                navigate(
                  role === 'mother' ? 'reminders' : 'dashboard'
                )
              }
            >
              ♧
            </button>

            <div className="mc-user-avatar" aria-hidden="true">
              {(user?.name || 'M').trim().charAt(0).toUpperCase()}
            </div>

            <div className="mc-user-meta">
              <strong>{user?.name || 'Mama'}</strong>
              <span>
                {role === 'husband'
                  ? 'Family member'
                  : role === 'doctor'
                    ? 'Doctor'
                    : 'Mother'}
              </span>
            </div>

            <label className="mc-role-label" htmlFor="mc-role">
              View as
            </label>

            <select
              id="mc-role"
              className="mc-role-picker"
              value={role}
              onChange={(event) => {
                switchRole(event.target.value);
                navigate('dashboard');
              }}
            >
              <option value="mother">Mother</option>
              <option value="husband">Family</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
        </header>

        <main className="mc-content" key={route}>
          {content}
        </main>

        <footer className="mc-app-footer">
          <span>🌸 MaatriCare</span>
          <span>
            Supportive care, not a substitute for professional medical
            advice.
          </span>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BleProvider>
        <CareProvider active>
          <AppFrame />
        </CareProvider>
      </BleProvider>
    </AuthProvider>
  );
}
