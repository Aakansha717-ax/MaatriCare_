
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

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
            message: 'Demo mode: API URL is not configured.',
        };
    }

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
            message: error?.message || 'Could not reach the MaatriCare API.',
        };
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
        return request('/api/health');
    },

    async fetchSharedSummary() {
        try {
            const data = JSON.parse(localStorage.getItem('mc_shared_summary') || 'null');
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
        if (!API_BASE_URL || !getToken()) {
            return {
                ok: false,
                data: null,
                message: 'Vitals remain in this session until you sign in to the API.',
            };
        }

        return request(
            '/data/health-records',
            json('POST', {
                type: 'vitals',
                data: vitals,
                notes: 'Wearable reading received by MaatriCare.',
            }),
        );
    },

    async logNotification(notification) {
        if (!API_BASE_URL || !getToken()) {
            return { ok: false, data: null };
        }
        return request('/notifications', json('POST', notification));
    },

    async getVaccinations() {
        return request('/api/vaccinations');
    },

    async createVaccination(vaccine) {
        return request('/api/vaccinations', json('POST', vaccine));
    },

    async getReminders() {
        return request('/api/reminders');
    },

    async createReminder(reminder) {
        return request('/api/reminders', json('POST', reminder));
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
