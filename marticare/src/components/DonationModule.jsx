import React from 'react';

export default function DonationModule() {
    const handleDonate = () => {
        alert('Thank you for supporting MaatriCare! Redirecting to Secure $5 Stripe Gateway...');
    };

    return (
        <div style={styles.card}>
            <h3>💖 Support MaatriCare Project</h3>
            <p>Your contribution helps us keep MaatriCare open-source and accessible for maternal healthcare everywhere.</p>
            <button onClick={handleDonate} style={styles.donateBtn}>
                Donate $5 for MaatriCare 🌸
            </button>
        </div>
    );
}

const styles = {
    card: { background: '#fce4ec', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '20px' },
    donateBtn: { background: '#d81b60', color: '#fff', padding: '12px 24px', fontSize: '16px', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }
};