// src/utils/vitalsRanges.js
// Configurable "outside range" checks. Defaults are placeholders the user can edit in the
// Health page; they are NOT clinical thresholds. SpO2 < 95 and systolic > 140 match the
// original VitalsDashboard; the rest are additions.
export const DEFAULT_RANGES = {
    heartRate: { min: 50, max: 120 },
    spo2: { min: 95 },
    bpSystolic: { max: 140 },
    bpDiastolic: { max: 90 },
    temperature: { min: 35.5, max: 37.8 }
};

export const VITAL_META = {
    heartRate: { label: 'Heart rate', unit: 'BPM' },
    spo2: { label: 'SpO2', unit: '%' },
    bpSystolic: { label: 'Systolic BP', unit: 'mmHg' },
    bpDiastolic: { label: 'Diastolic BP', unit: 'mmHg' },
    temperature: { label: 'Body temperature', unit: '°C' }
};

export function evaluateVitals(vitals, ranges = DEFAULT_RANGES) {
    const issues = [];
    Object.keys(VITAL_META).forEach((key) => {
        const v = vitals && vitals[key];
        const r = ranges[key];
        if (v == null || !r) return;
        if ((r.min != null && v < r.min) || (r.max != null && v > r.max)) {
            issues.push({ key, value: v, ...VITAL_META[key] });
        }
    });
    return issues;
}
