import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState({
        name: 'Anjali Mane',
        role: 'mother', // Options: 'mother', 'husband', 'doctor'
        email: 'anjali@example.com'
    });

    const switchRole = (newRole) => {
        setUser((prev) => ({ ...prev, role: newRole }));
    };

    return (
        <AuthContext.Provider value={{ user, switchRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);