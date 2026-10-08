import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, switchRole } = useAuth();

    return (
        <nav style={styles.nav}>
            <div style={styles.logo}>🌸 MaatriCare</div>
            <div style={styles.roleContainer}>
                <span>Active User: <strong>{user.name}</strong> ({user.role.toUpperCase()})</span>
                <select value={user.role} onChange={(e) => switchRole(e.target.value)} style={styles.select}>
                    <option value="mother">Role: Mother</option>
                    <option value="husband">Role: Husband/Partner</option>
                    <option value="doctor">Role: Doctor</option>
                </select>
            </div>
        </nav>
    );
}

const styles = {
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#e91e63', color: '#fff' },
    logo: { fontSize: '22px', fontWeight: 'bold' },
    roleContainer: { display: 'flex', gap: '12px', alignItems: 'center' },
    select: { padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }
};