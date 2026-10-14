const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const isApiConfigured = () => Boolean(API_BASE_URL);
const getToken = () => { try { return localStorage.getItem('mc_token') || ''; } catch { return ''; } };

async function request(path, options = {}) {
    if (!API_BASE_URL) return { ok: false, data: null, message: 'Demo mode: API URL is not configured.' };
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) return { ok: false, data, message: data.message || `Request failed (${response.status})` };
        return { ok: true, data, message: data.message || '' };
    } catch (error) {
        return { ok: false, data: null, message: error?.message || 'Could not reach the MaatriCare API.' };
    }
}

const json = (method, value) => ({ method, body: JSON.stringify(value) });

export const apiService = {
    async signup(details) {
        const res = await request('/auth/signup', json('POST', details));
        if (res.ok && res.data?.token) localStorage.setItem('mc_token', res.data.token);
        return res;
    },
    async login(details) {
        const res = await request('/auth/login', json('POST', details));
        if (res.ok && res.data?.token) localStorage.setItem('mc_token', res.data.token);
        return res;
    },
    logout() { try { localStorage.removeItem('mc_token'); } catch { /* ignore */ } },
    async healthCheck() { return request('/health'); },
    async fetchSharedSummary() {
        // Shared summaries remain local until a dedicated backend sharing endpoint is added.
        try { const data = JSON.parse(localStorage.getItem('mc_shared_summary') || 'null'); return { ok: Boolean(data), data }; }
        catch { return { ok: false, data: null }; }
    },
    async saveSharedSummary(summary) {
        try { localStorage.setItem('mc_shared_summary', JSON.stringify(summary)); return { ok: true, data: summary }; }
        catch { return { ok: false, data: null }; }
    },
    async pushVitals(vitals) {
        if (!API_BASE_URL || !getToken()) return { ok: false, data: null, message: 'Vitals remain in this session until you sign in to the API.' };
        return request('/data/health-records', json('POST', { type: 'vitals', data: vitals, notes: 'Wearable reading received by MaatriCare.' }));
    },
    async logNotification(notification) {
        if (!API_BASE_URL || !getToken()) return { ok: false, data: null };
        return request('/notifications', json('POST', notification));
    },
    async getVaccinations() { return request('/vaccinations'); },
    async createVaccination(vaccine) { return request('/vaccinations', json('POST', vaccine)); },
    async getReminders() { return request('/reminders'); },
    async createReminder(reminder) { return request('/reminders', json('POST', reminder)); },
    async getAppointments() { return request('/appointments'); },
    async getNotifications() { return request('/notifications'); },
    async getHealthRecords() { return request('/data/health-records'); },
};
