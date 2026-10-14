// src/context/BleContext.jsx
// Exposes smartwatch state to the UI. All Bluetooth work stays in services/bleService.js.
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { connectWatch, disconnectWatch, isBluetoothSupported } from '../services/bleService';
import { apiService } from '../services/apiService';

const EMPTY_VITALS = { steps: null, temperature: null, heartRate: null, spo2: null, bpSystolic: null, bpDiastolic: null };
const BleContext = createContext(null);

export function BleProvider({ children }) {
    const [status, setStatus] = useState('Disconnected');
    const [vitals, setVitals] = useState(EMPTY_VITALS);
    const [rawHex, setRawHex] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [history, setHistory] = useState([]);
    const [gattServer, setGattServer] = useState(null);
    const [error, setError] = useState('');
    const lastPush = useRef(0);

    const handleFrame = useCallback((frame) => {
        if (!frame.valid) return;
        const now = Date.now();
        setRawHex(frame.rawHex);
        setLastUpdated(now);
        setVitals((prev) => {
            const next = {
                ...prev,
                steps: frame.steps,
                temperature: frame.temperature ?? prev.temperature,
                heartRate: frame.heartRate ?? prev.heartRate
            };
            if (now - lastPush.current > 60000) {
                lastPush.current = now;
                apiService.pushVitals(next); // no-op when the API is not configured
            }
            return next;
        });
        setHistory((h) => [...h, { t: now, steps: frame.steps, temperature: frame.temperature, heartRate: frame.heartRate }].slice(-120));
    }, []);

    const connect = useCallback(async () => {
        setError('');
        if (!isBluetoothSupported()) {
            setStatus('Failed to Connect');
            setError('Web Bluetooth is not available in this browser. Use Chrome or Edge on desktop/Android over HTTPS or localhost.');
            return;
        }
        try {
            const { server } = await connectWatch({
                onStatus: setStatus,
                onFrame: handleFrame,
                onDisconnect: () => { setGattServer(null); setStatus('Disconnected'); }
            });
            setGattServer(server);
        } catch (e) {
            if (e && e.name !== 'NotFoundError') setError(e.message || 'Could not connect to the watch.');
        }
    }, [handleFrame]);

    const disconnect = useCallback(() => {
        disconnectWatch();
        setGattServer(null);
        setStatus('Disconnected');
    }, []);

    const value = {
        status, connected: status === 'Connected', vitals, rawHex, lastUpdated, history,
        gattServer, error, connect, disconnect, supported: isBluetoothSupported()
    };
    return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
}

export function useBle() {
    const ctx = useContext(BleContext);
    if (!ctx) throw new Error('useBle must be used inside <BleProvider>');
    return ctx;
}
