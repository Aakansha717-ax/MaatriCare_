import React from 'react';

export default function WellnessModule() {
    const mealPlan = [
        { time: 'Breakfast', detail: 'Oatmeal with almonds, flaxseeds, and fresh berries + 1 glass milk' },
        { time: 'Lunch', detail: 'Whole grain chapati, spinach dal, paneer curry, and fresh curd' },
        { time: 'Evening Snack', detail: 'Roasted makhana / walnuts with coconut water' },
        { time: 'Dinner', detail: 'Steamed vegetable khichdi with ghee and green salad' }
    ];

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            {/* Nutrition Plan */}
            <div style={styles.card}>
                <h3>🥗 Maternal Nutrition & Meals</h3>
                {mealPlan.map((m, i) => (
                    <div key={i} style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #eee' }}>
                        <strong>{m.time}:</strong> {m.detail}
                    </div>
                ))}
            </div>

            {/* Yoga & Meditation */}
            <div style={styles.card}>
                <h3>🧘‍♀️ Prenatal Yoga & Guided Meditation</h3>
                <ul style={{ paddingLeft: '20px' }}>
                    <li><strong>Anulom Vilom (Pranayama):</strong> 10 mins daily for stress relief and oxygenation.</li>
                    <li><strong>Cat-Cow Stretch (Marjaryasana):</strong> Relieves lower back pressure during Trimester 2/3.</li>
                    <li><strong>Butterfly Pose (Bhadrasana):</strong> Enhances pelvic flexibility for natural delivery.</li>
                </ul>
                <button style={styles.audioBtn} onClick={() => alert('Playing 10-Minute Calming Prenatal Breathing Audio...')}>
                    🎧 Start 10-Min Guided Meditation Audio
                </button>
            </div>
        </div>
    );
}

const styles = {
    card: { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    audioBtn: { width: '100%', padding: '12px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '12px', fontWeight: 'bold' }
};