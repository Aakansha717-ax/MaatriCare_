import React from 'react';
import { Card, PageHeader, MEDICAL_DISCLAIMER } from '../components/common/UI';

// Meal text is the original mealPlan from WellnessModule.jsx. Nutrient notes are general food information.
const MEALS = [
    { name: 'Breakfast', icon: '🍳', tone: 'sand', detail: 'Oatmeal with almonds, flaxseeds, and fresh berries + 1 glass milk', protein: 'Milk, almonds', carbs: 'Oats', nutrients: 'Calcium (milk), omega-3 (flaxseed), antioxidants (berries)' },
    { name: 'Lunch', icon: '🍱', tone: 'mint', detail: 'Whole grain chapati, spinach dal, paneer curry, and fresh curd', protein: 'Dal, paneer, curd', carbs: 'Whole grain chapati', nutrients: 'Iron and folate (spinach, dal), calcium (paneer, curd)' },
    { name: 'Snack', icon: '🥜', tone: 'soft', detail: 'Roasted makhana / walnuts with coconut water', protein: 'Makhana, walnuts', carbs: 'Makhana', nutrients: 'Healthy fats (walnuts), potassium (coconut water)' },
    { name: 'Dinner', icon: '🍲', tone: 'lav', detail: 'Steamed vegetable khichdi with ghee and green salad', protein: 'Lentils in khichdi', carbs: 'Rice', nutrients: 'Fibre and vitamins (vegetables, salad)' }
];
const TIPS = ['Eat small, regular meals instead of long gaps.', 'Sip water through the day; use the hydration reminder.', 'Wash fruit and vegetables well and eat freshly cooked food.', 'Ask your healthcare professional about supplements and foods to avoid.'];

export default function Nutrition() {
    return (
        <div>
            <PageHeader title="🥗 Today's Nutrition" subtitle="General nutrition information, not medical treatment." />
            <div className="mc-grid mc-grid--2">
                {MEALS.map((m) => (
                    <Card key={m.name} tone={m.tone} title={m.name} icon={m.icon}>
                        <p><strong>{m.detail}</strong></p>
                        <div className="mc-small"><div><strong>Protein:</strong> {m.protein}</div><div><strong>Carbohydrates:</strong> {m.carbs}</div><div><strong>Vitamins / nutrients:</strong> {m.nutrients}</div></div>
                    </Card>
                ))}
            </div>
            <Card title="Healthy suggestions" icon="💡" style={{ marginTop: 16 }}>
                <ul style={{ margin: 0, paddingLeft: 20 }}>{TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
            </Card>
            <p className="mc-muted mc-small" style={{ marginTop: 16 }}>{MEDICAL_DISCLAIMER}</p>
        </div>
    );
}
