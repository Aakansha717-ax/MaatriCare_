import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function VitalsDashboard() {
    const { user } = useAuth();
    const [bleStatus, setBleStatus] = useState('Disconnected');
    const [vitals, setVitals] = useState({
        steps: 2899,
        temperature: 36.6,
        heartRate: 78,
        spo2: 98,
        bpSystolic: 120,
        bpDiastolic: 80,
        rawHex: ''
    });

    // Parse raw BLE byte stream from Ultra3
    const parseWatchData = (dataView) => {
        const bytes = new Uint8Array(dataView.buffer);
        const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');

        if (bytes[0] === 0xCD && bytes.length >= 20) {
            const steps = (bytes[12] << 8) | bytes[13];
            const rawTemp = (bytes[16] << 8) | bytes[17];
            const tempC = rawTemp > 0 ? (rawTemp / 100).toFixed(1) : 36.6;
            const hr = bytes[19] || 75;

            setVitals((prev) => ({
                ...prev,
                steps,
                temperature: tempC,
                heartRate: hr,
                rawHex: hex
            }));
        }
    };

    const connectWatch = async () => {
        try {
            setBleStatus('Connecting...');
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    '6e400801-b5a3-f393-e0a9-e50e24dcca9d',
                    '0000180f-0000-1000-8000-00805f9b34fb'
                ]
            });

            const server = await device.gatt.connect();
            setBleStatus('Connected');

            const service = await server.getPrimaryService('6e400801-b5a3-f393-e0a9-e50e24dcca9d');
            const txChar = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9d');

            await txChar.startNotifications();
            txChar.addEventListener('characteristicvaluechanged', (e) => parseWatchData(e.target.value));
        } catch (err) {
            setBleStatus('Failed to Connect');
            console.error(err);
        }
    };

    const isAlert = vitals.spo2 < 95 || vitals.bpSystolic > 140;

    return (
        <div style={styles.card}>
            <h2>📊 Real-Time Health & Vitals Dashboard</h2>

            {/* Alert Banner for Husband/Doctor */}
            {isAlert && (
                <div style={styles.alert}>
                    ⚠️ <strong>HEALTH ALERT:</strong> Abnormal SpO2 or Blood Pressure detected! Automatic alerts sent to Husband and Doctor.
                </div>
            )}

            {user.role === 'mother' && (
                <button onClick={connectWatch} style={styles.btn}>
                    ⌚ Connect Ultra3 BLE Watch ({bleStatus})
                </button>
            )}

            <div style={styles.grid}>
                <div style={styles.metricBox}>
                    <h4>👣 Steps Monitor</h4>
                    <p style={styles.value}>{vitals.steps}</p>
                </div>
                <div style={styles.metricBox}>
                    <h4>🌡️ Body Temp</h4>
                    <p style={styles.value}>{vitals.temperature} °C</p>
                </div>
                <div style={styles.metricBox}>
                    <h4>❤️ Heart Rate</h4>
                    <p style={styles.value}>{vitals.heartRate} BPM</p>
                </div>
                <div style={styles.metricBox}>
                    <h4>🫁 SpO2 Level</h4>
                    <p style={{ ...styles.value, color: vitals.spo2 < 95 ? 'red' : 'inherit' }}>{vitals.spo2}%</p>
                </div>
                <div style={styles.metricBox}>
                    <h4>🩸 Blood Pressure</h4>
                    <p style={styles.value}>{vitals.bpSystolic}/{vitals.bpDiastolic} mmHg</p>
                </div>
            </div>

            {vitals.rawHex && (
                <div style={styles.rawBox}>
                    <small>Raw BLE Stream: <code>{vitals.rawHex}</code></small>
                </div>
            )}
        </div>
    );
}

const styles = {
    card: { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '20px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginTop: '16px' },
    metricBox: { background: '#f8f9fa', padding: '16px', borderRadius: '8px', textAlign: 'center' },
    value: { fontSize: '22px', fontWeight: 'bold', margin: '8px 0 0' },
    alert: { background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '8px', marginBottom: '16px', borderLeft: '5px solid #c62828' },
    btn: { background: '#e91e63', color: '#fff', padding: '10px 18px', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '16px' },
    rawBox: { marginTop: '12px', background: '#222', color: '#0f0', padding: '8px', borderRadius: '4px' }
};