// src/context/CareContext.jsx
// Mother's care data (hydration, meals, medicines, vaccinations, wellness, notifications, sharing)
// plus the reminder scheduler. Persisted to localStorage (keys prefixed "mc_") because no backend
// endpoints were confirmed. Backend sync happens only through apiService when configured.
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useBle } from './BleContext';
import { apiService } from '../services/apiService';
import { fireReminder, requestNotificationPermission } from '../services/reminderNotifier';
import { DEFAULT_RANGES, evaluateVitals } from '../utils/vitalsRanges';

export const CATEGORIES = ['Hydration', 'Medicine', 'Meal', 'Vaccination', 'Health', 'Wellness', 'Doctor', 'Family'];
export const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };
const MEAL_MESSAGES = {
    breakfast: ['🍳 Breakfast time', "It's breakfast time. Don't forget your meal."],
    lunch: ['🍱 Lunch time', "It's lunchtime. Don't forget your meal."],
    snack: ['🥜 Snack time', "It's snack time. A light, healthy snack helps."],
    dinner: ['🍲 Dinner time', "It's dinnertime. Don't forget your meal."]
};

const DEFAULT_MEALS = {
    breakfast: { time: '08:00', enabled: true },
    lunch: { time: '13:00', enabled: true },
    snack: { time: '17:00', enabled: true },
    dinner: { time: '20:00', enabled: true }
};
// Names only. Due dates are left blank on purpose: schedules vary, so the user enters the dates their provider gives them.
const DEFAULT_VACCINES = [
    { id: 'v-tdap', name: 'Tdap', dueDate: '', status: 'upcoming' },
    { id: 'v-flu', name: 'Flu', dueDate: '', status: 'upcoming' },
    { id: 'v-hepb', name: 'Hepatitis B', dueDate: '', status: 'upcoming' }
];
const DEFAULT_PREFS = {
    categories: CATEGORIES.reduce((a, c) => ({ ...a, [c]: true }), {}),
    channels: { browser: true, sound: true, watch: true }
};
const DEFAULT_SHARING = { hydration: true, medicines: true, wellness: true, vaccinations: true, alerts: true, vitals: false };

export const todayKey = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const pad = (n) => String(n).padStart(2, '0');
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function useStored(key, initial) {
    const [value, setValue] = useState(() => {
        try {
            const raw = localStorage.getItem(`mc_${key}`);
            return raw ? JSON.parse(raw) : initial;
        } catch { return initial; }
    });
    useEffect(() => {
        try { localStorage.setItem(`mc_${key}`, JSON.stringify(value)); } catch { /* storage full/blocked */ }
    }, [key, value]);
    return [value, setValue];
}

/** Re-renders the calling component every second (keeps countdowns out of the global context). */
export function useNow(intervalMs = 1000) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
    return now;
}

const CareContext = createContext(null);

export function CareProvider({ children, active }) {
    const { user } = useAuth();
    const { gattServer, vitals } = useBle();

    const [profile, setProfile] = useStored('profile', { name: '', email: '' });
    const [hydration, setHydration] = useStored('hydration', { goal: 8, intervalMin: 120, running: false });
    const [waterLog, setWaterLog] = useStored('waterLog', {});
    const [meals, setMeals] = useStored('meals', DEFAULT_MEALS);
    const [mealLog, setMealLog] = useStored('mealLog', {});
    const [medicines, setMedicines] = useStored('medicines', []);
    const [medLog, setMedLog] = useStored('medLog', {});
    const [vaccines, setVaccines] = useStored('vaccines', DEFAULT_VACCINES);
    const [wellnessLog, setWellnessLog] = useStored('wellnessLog', {});
    const [notifications, setNotifications] = useStored('notifications', []);
    const [prefs, setPrefs] = useStored('notifPrefs', DEFAULT_PREFS);
    const [sharing, setSharing] = useStored('sharing', DEFAULT_SHARING);
    const [ranges, setRanges] = useStored('ranges', DEFAULT_RANGES);
    const [nextWaterAt, setNextWaterAt] = useState(null);

    const displayName = profile.name || (user && user.name) || 'Mama';
    const day = todayKey();

    // Latest values for the scheduler's interval callback.
    const live = useRef({});
    live.current = { hydration, nextWaterAt, meals, medicines, medLog, vaccines, prefs, gattServer, active };
    const fired = useRef(new Set());

    const addNotification = useCallback((category, title, body) => {
        const entry = { id: uid(), category, title, body, ts: Date.now(), read: false };
        setNotifications((n) => [entry, ...n].slice(0, 100));
        apiService.logNotification({ category, title, body }); // no-op when API is not configured
    }, [setNotifications]);

    /** Log + fire browser / audio / watch channels, honouring the user's preferences. */
    const notify = useCallback(async (category, title, body, watchText, opts = {}) => {
        const s = live.current;
        if (s.prefs.categories[category] === false) return null;
        addNotification(category, title, body);
        const ch = s.prefs.channels;
        return fireReminder({
            title, body, watchText: watchText || title,
            gattServer: opts.gattServer || s.gattServer,
            browser: ch.browser, sound: ch.sound, watch: ch.watch
        });
    }, [addNotification]);

    // ---- Hydration ----
    const startHydration = useCallback(() => {
        requestNotificationPermission();
        setHydration((h) => ({ ...h, running: true }));
        setNextWaterAt(Date.now() + live.current.hydration.intervalMin * 60000);
    }, [setHydration]);
    const stopHydration = useCallback(() => {
        setHydration((h) => ({ ...h, running: false }));
        setNextWaterAt(null);
    }, [setHydration]);
    const setHydrationInterval = useCallback((min) => {
        const m = Math.max(1, Math.min(720, Number(min) || 120));
        setHydration((h) => ({ ...h, intervalMin: m }));
        if (live.current.hydration.running) setNextWaterAt(Date.now() + m * 60000);
    }, [setHydration]);
    const setHydrationGoal = useCallback((goal) => {
        setHydration((h) => ({ ...h, goal: Math.max(1, Math.min(30, Number(goal) || 8)) }));
    }, [setHydration]);
    const logWater = useCallback((delta = 1) => {
        const k = todayKey();
        setWaterLog((l) => ({ ...l, [k]: Math.max(0, (l[k] || 0) + delta) }));
    }, [setWaterLog]);

    // ---- Meals ----
    const setMealTime = (key, time) => setMeals((m) => ({ ...m, [key]: { ...m[key], time } }));
    const toggleMeal = (key) => setMeals((m) => ({ ...m, [key]: { ...m[key], enabled: !m[key].enabled } }));
    const toggleMealDone = (key) => setMealLog((l) => ({ ...l, [day]: { ...(l[day] || {}), [key]: !(l[day] || {})[key] } }));

    // ---- Medicines ----
    const addMedicine = ({ name, time, recurrence }) =>
        setMedicines((m) => [...m, { id: uid(), name: name.trim(), time: time || '08:00', recurrence: recurrence || 'daily', createdOn: todayKey() }]);
    const updateMedicine = (id, patch) => setMedicines((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const removeMedicine = (id) => setMedicines((m) => m.filter((x) => x.id !== id));
    const toggleMedicineDone = (id) => setMedLog((l) => ({ ...l, [day]: { ...(l[day] || {}), [id]: !(l[day] || {})[id] } }));
    const loadDemoMedicines = () => setMedicines([
        { id: uid(), name: 'Morning prenatal vitamin', time: '08:00', recurrence: 'daily', createdOn: day },
        { id: uid(), name: 'Afternoon medicine', time: '14:00', recurrence: 'daily', createdOn: day },
        { id: uid(), name: 'Evening medicine', time: '20:00', recurrence: 'daily', createdOn: day }
    ]);

    const medsForDay = useCallback((list, d) => {
        const dow = new Date(`${d}T12:00:00`).getDay();
        return list
            .filter((m) => m.recurrence === 'daily' || (m.recurrence === 'weekdays' && dow >= 1 && dow <= 5) || (m.recurrence === 'once' && m.createdOn === d))
            .sort((a, b) => a.time.localeCompare(b.time));
    }, []);
    const todayMeds = useMemo(() => medsForDay(medicines, day), [medicines, day, medsForDay]);
    const medStats = useMemo(() => {
        const done = todayMeds.filter((m) => (medLog[day] || {})[m.id]).length;
        return { done, total: todayMeds.length, percent: todayMeds.length ? Math.round((done / todayMeds.length) * 100) : 0 };
    }, [todayMeds, medLog, day]);

    // ---- Vaccinations ----
    const addVaccine = ({ name, dueDate }) => setVaccines((v) => [...v, { id: uid(), name: name.trim(), dueDate: dueDate || '', status: 'upcoming' }]);
    const updateVaccine = (id, patch) => setVaccines((v) => v.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const removeVaccine = (id) => setVaccines((v) => v.filter((x) => x.id !== id));

    // ---- Wellness ----
    const logWellness = useCallback((title) => {
        const k = todayKey();
        setWellnessLog((l) => ({ ...l, [k]: [...(l[k] || []), title] }));
    }, [setWellnessLog]);

    // ---- Notifications ----
    const markRead = (id) => setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
    const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    const clearNotifications = () => setNotifications([]);
    const unreadCount = notifications.filter((n) => !n.read).length;
    const setCategoryPref = (c, on) => setPrefs((p) => ({ ...p, categories: { ...p.categories, [c]: on } }));
    const setChannelPref = (c, on) => setPrefs((p) => ({ ...p, channels: { ...p.channels, [c]: on } }));

    // ---- Scheduler (only while active = logged-in mother) ----
    useEffect(() => {
        if (active && hydration.running && !nextWaterAt) setNextWaterAt(Date.now() + hydration.intervalMin * 60000);
    }, [active, hydration.running, hydration.intervalMin, nextWaterAt]);

    useEffect(() => {
        if (!active) return undefined;
        const id = setInterval(() => {
            const s = live.current;
            const t = Date.now();

            if (s.hydration.running && s.nextWaterAt && t >= s.nextWaterAt) {
                setNextWaterAt(t + s.hydration.intervalMin * 60000);
                notify('Hydration', '💧 Time to hydrate', 'Please drink a glass of water now.', 'MaatriCare: Time to drink water! 💧');
            }

            const d = new Date(t);
            const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
            const dk = todayKey();

            Object.entries(s.meals).forEach(([key, cfg]) => {
                const fk = `${dk}|meal|${key}|${cfg.time}`;
                if (cfg.enabled && cfg.time === hm && !fired.current.has(fk)) {
                    fired.current.add(fk);
                    notify('Meal', MEAL_MESSAGES[key][0], MEAL_MESSAGES[key][1], `MaatriCare: ${MEAL_LABELS[key]} time`);
                }
            });

            medsForDay(s.medicines, dk).forEach((m) => {
                const fk = `${dk}|med|${m.id}|${m.time}`;
                if (m.time === hm && !fired.current.has(fk) && !(s.medLog[dk] || {})[m.id]) {
                    fired.current.add(fk);
                    notify('Medicine', '💊 Medicine reminder', `${m.name} is due now.`, `MaatriCare: ${m.name}`);
                }
            });
        }, 1000);
        return () => clearInterval(id);
    }, [active, notify, medsForDay]);

    // Vaccination due-soon / overdue reminder, once per vaccine per day.
    useEffect(() => {
        if (!active) return;
        const dk = todayKey();
        vaccines.forEach((v) => {
            if (v.status === 'completed' || !v.dueDate) return;
            const days = Math.round((new Date(`${v.dueDate}T12:00:00`) - new Date(`${dk}T12:00:00`)) / 86400000);
            const fk = `${dk}|vac|${v.id}`;
            if (days <= 7 && !fired.current.has(fk)) {
                fired.current.add(fk);
                const when = days < 0 ? 'is past its due date' : days === 0 ? 'is due today' : `is due in ${days} day${days === 1 ? '' : 's'}`;
                notify('Vaccination', '💉 Vaccination reminder', `${v.name} ${when}. Please confirm timing with your healthcare provider.`, `MaatriCare: ${v.name} vaccine`);
            }
        });
    }, [active, vaccines, notify]);

    // Out-of-range alert (wellness wording only; never a diagnosis). Max one every 10 minutes.
    const lastHealthAlert = useRef(0);
    useEffect(() => {
        if (!active) return;
        const issues = evaluateVitals(vitals, ranges);
        if (issues.length && Date.now() - lastHealthAlert.current > 600000) {
            lastHealthAlert.current = Date.now();
            const detail = issues.map((i) => `${i.label} ${i.value} ${i.unit}`).join(', ');
            notify('Health', '⚠️ Health Alert',
                `Your current reading is outside your configured range (${detail}). Please consult your healthcare professional if concerned.`,
                'MaatriCare: Health alert');
        }
    }, [active, vitals, ranges, notify]);

    // ---- Shared summary for the family view (only what the mother has chosen to share) ----
    const summary = useMemo(() => {
        const s = { updatedAt: Date.now(), motherName: displayName, shared: sharing };
        if (sharing.hydration) s.hydration = { done: waterLog[day] || 0, goal: hydration.goal };
        if (sharing.medicines) s.medicines = { done: medStats.done, total: medStats.total };
        if (sharing.wellness) s.wellness = { activities: wellnessLog[day] || [] };
        if (sharing.vaccinations) {
            const next = vaccines.filter((v) => v.status !== 'completed' && v.dueDate).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
            s.vaccinations = { next: next ? { name: next.name, dueDate: next.dueDate } : null };
        }
        if (sharing.alerts) s.alerts = notifications.filter((n) => n.category === 'Health').slice(0, 10).map(({ title, body, ts }) => ({ title, body, ts }));
        if (sharing.vitals) s.vitals = vitals;
        return s;
    }, [displayName, sharing, waterLog, day, hydration.goal, medStats, wellnessLog, vaccines, notifications, vitals]);

    useEffect(() => {
        if (!active) return undefined;
        const id = setTimeout(() => {
            try { localStorage.setItem('mc_shared_summary', JSON.stringify(summary)); } catch { /* ignore */ }
            apiService.saveSharedSummary(summary);
        }, 1500);
        return () => clearTimeout(id);
    }, [active, summary]);

    const value = {
        displayName, profile, setProfile, day,
        hydration, waterLog, nextWaterAt, startHydration, stopHydration, setHydrationInterval, setHydrationGoal, logWater,
        waterToday: waterLog[day] || 0,
        meals, mealLog, setMealTime, toggleMeal, toggleMealDone,
        medicines, medLog, todayMeds, medStats, addMedicine, updateMedicine, removeMedicine, toggleMedicineDone, loadDemoMedicines,
        vaccines, addVaccine, updateVaccine, removeVaccine,
        wellnessLog, logWellness, wellnessToday: wellnessLog[day] || [],
        notifications, unreadCount, markRead, markAllRead, clearNotifications, prefs, setCategoryPref, setChannelPref,
        sharing, setSharing, ranges, setRanges, summary, notify
    };
    return <CareContext.Provider value={value}>{children}</CareContext.Provider>;
}

export function useCare() {
    const ctx = useContext(CareContext);
    if (!ctx) throw new Error('useCare must be used inside <CareProvider>');
    return ctx;
}
