// src/context/SessionBridge.jsx
// Safe wrapper around YOUR AuthContext. If <AuthProvider> is missing, or `user` is null before
// login, the app still loads (landing + auth) instead of crashing. Uses your AuthContext's
// user / switchRole / login / signup / logout whenever they exist.
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const SessionCtx = createContext(null);

export function SessionProvider({ children }) {
    let auth = null;
    try { auth = useAuth() || null; } catch { auth = null; } // eslint-disable-line react-hooks/rules-of-hooks
    const [localRole, setLocalRole] = useState(() => {
        try { return localStorage.getItem('mc_role') || 'mother'; } catch { return 'mother'; }
    });

    const real = (auth && auth.user) || {};
    const user = { ...real, name: real.name || '', role: real.role || localRole };

    const switchRole = (role) => {
        if (auth && typeof auth.switchRole === 'function') auth.switchRole(role);
        setLocalRole(role);
        try { localStorage.setItem('mc_role', role); } catch { /* ignore */ }
    };

    const value = {
        user, switchRole,
        login: auth && auth.login,
        signup: auth && (auth.signup || auth.register),
        logout: auth && auth.logout,
        hasAuthContext: !!auth
    };
    return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
    const ctx = useContext(SessionCtx);
    if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
    return ctx;
}
