import React, { createContext, useContext, useState } from 'react';
import { apiService, isApiConfigured } from '../services/apiService';

const AuthContext = createContext(null);
const normaliseRole = (role) => role === 'guardian' ? 'husband' : (role || 'mother');

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('mc_user') || 'null');
            return saved || { name: 'Anjali Mane', role: 'mother', email: 'anjali@example.com' };
        } catch {
            return { name: 'Anjali Mane', role: 'mother', email: 'anjali@example.com' };
        }
    });

    const saveUser = (next) => {
        const normalised = { ...next, role: normaliseRole(next.role) };
        setUser(normalised);
        try { localStorage.setItem('mc_user', JSON.stringify(normalised)); } catch { /* storage unavailable */ }
        return normalised;
    };

    const switchRole = (newRole) => saveUser({ ...user, role: newRole });

    const signup = async ({ name, email, password, role = 'mother' }) => {
        const apiRole = role === 'husband' ? 'guardian' : role;
        if (isApiConfigured()) {
            const result = await apiService.signup({ name, email, password, role: apiRole });
            if (!result.ok) throw new Error(result.message || 'Could not create your account.');
            return saveUser({ ...(result.data.user || {}), name: result.data.user?.name || name, email, role: apiRole });
        }
        return saveUser({ name, email, role, demo: true });
    };

    const login = async ({ email, password }) => {
        if (isApiConfigured()) {
            const result = await apiService.login({ email, password });
            if (!result.ok) throw new Error(result.message || 'Could not log in.');
            return saveUser({ ...(result.data.user || {}), email, role: normaliseRole(result.data.user?.role) });
        }
        let localUser = null;
        try { localUser = JSON.parse(localStorage.getItem(`mc_account_${email.toLowerCase()}`) || 'null'); } catch { /* ignore */ }
        if (!localUser) throw new Error('No demo account found for this email. Please use Sign Up first.');
        // Demo-only login: do not persist passwords in the browser. Real password checks happen in the API.
        return saveUser({ ...localUser, role: normaliseRole(localUser.role) });
    };

    const logout = () => {
        apiService.logout();
        saveUser({ name: 'Mama', role: 'mother', email: '' });
    };

    return <AuthContext.Provider value={{ user, switchRole, signup, register: signup, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
