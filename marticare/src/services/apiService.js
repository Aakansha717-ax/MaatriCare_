
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:5000/api'
).replace(/\/+$/, '');

export const isApiConfigured = () => Boolean(API_BASE_URL);

const getToken = () => {
    try {
        return localStorage.getItem('mc_token') || '';
    } catch {
        return '';
    }
};

async function request(path, options = {}) {
    if (!API_BASE_URL) {
        return {
            ok: false,
            data: null,
            message: 'API URL is not configured.',
        };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
        const token = getToken();

        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            return {
                ok: false,
                data,
                message: data.message || `Request failed (${response.status})`,
            };
        }

        return { ok: true, data, message: data.message || '' };
    } catch (error) {
        return {
            ok: false,
            data: null,
            message:
                error.name === 'AbortError'
                    ? 'The server took too long to respond. Please try again.'
                    : error.message || 'Could not reach the MaatriCare API.',
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

const json = (method, value) => ({
    method,
    body: JSON.stringify(value),
});

export const apiService = {
    async signup(details) {
        return request('/auth/signup', json('POST', details));
    },

    async login(details) {
        return request('/auth/login', json('POST', details));
    },

    logout() {
        try {
            localStorage.removeItem('mc_token');
        } catch {
            // Ignore storage errors.
        }
    },

    async healthCheck() {
        return request('/health');
    },

    async fetchSharedSummary() {
        try {
            const data = JSON.parse(
                localStorage.getItem('mc_shared_summary') || 'null'
            );
            return { ok: Boolean(data), data };
        } catch {
            return { ok: false, data: null };
        }
    },

    async saveSharedSummary(summary) {
        try {
            localStorage.setItem('mc_shared_summary', JSON.stringify(summary));
            return { ok: true, data: summary };
        } catch {
            return { ok: false, data: null };
        }
    },

    async pushVitals(vitals) {
        if (!getToken()) {
            return {
                ok: false,
                data: null,
                message: 'Please sign in before syncing health records.',
            };
        }

        return request(
            '/data/health-records',
            json('POST', {
                type: 'vitals',
                data: vitals,
                notes: 'Wearable reading received by MaatriCare.',
            })
        );
    },

    async logNotification(notification) {
        if (!getToken()) return { ok: false, data: null };
        return request('/notifications', json('POST', notification));
    },

    async getVaccinations() {
        return request('/vaccinations');
    },

    async createVaccination(vaccine) {
        return request('/vaccinations', json('POST', vaccine));
    },

    async getReminders() {
        return request('/reminders');
    },

    async createReminder(reminder) {
        return request('/reminders', json('POST', reminder));
    },

    async getAppointments() {
        return request('/appointments');
    },

    async getNotifications() {
        return request('/notifications');
    },

    async getHealthRecords() {
        return request('/data/health-records');
    },
};
