// src/context/BleContext.jsx
// Exposes smartwatch state to the UI. All Bluetooth work stays in services/bleService.js.
// Connection state (status) and data reception (receiving / lastUpdated) are tracked separately:
// "Connected" does NOT mean health data is arriving.
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { connectWatch, disconnectWatch, isBluetoothSupported } from '../services/bleService';
import { apiService } from '../services/apiService';

const EMPTY_VITALS = { steps: null, temperature: null, heartRate: null, spo2: null, bpSystolic: null, bpDiastolic: null };
const VITAL_KEYS = Object.keys(EMPTY_VITALS);
const NO_DATA_WARNING_MS = 15000; // connected this long without any validated reading -> warn
const RECEIVING_WINDOW_MS = 30000; // a reading newer than this counts as "receiving"
const PUSH_INTERVAL_MS = 60000;
const BleContext = createContext(null);

export function BleProvider({ children }) {
    const [status, setStatus] = useState('Disconnected');
    const [vitals, setVitals] = useState(EMPTY_VITALS);
    const [rawHex, setRawHex] = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [history, setHistory] = useState([]);
    const [gattServer, setGattServer] = useState(null);
    const [error, setError] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [packetCount, setPacketCount] = useState(0); // any notification, even unrecognised
    const [lastPacketHex, setLastPacketHex] = useState('');
    const [diagnostics, setDiagnostics] = useState(null);
    const [connectedAt, setConnectedAt] = useState(null);
    const [now, setNow] = useState(Date.now());
    const lastPush = useRef(0);
    const vitalsRef = useRef(EMPTY_VITALS);

    useEffect(() => {
        if (status !== 'Connected') return undefined;
        const id = setInterval(() => setNow(Date.now()), 2000);
        return () => clearInterval(id);
    }, [status]);

    const pushToBackend = useCallback(async (snapshot) => {
        const payload = {};
        VITAL_KEYS.forEach((k) => { if (snapshot[k] != null) payload[k] = snapshot[k]; });
        if (Object.keys(payload).length === 0) return;
        try {
            const res = await apiService.pushVitals(payload);
            setUploadError(res.ok ? '' : (res.message || 'Could not save reading to the server.'));
        } catch (e) {
            setUploadError(e?.message || 'Could not save reading to the server.');
        }
    }, []);

    const handleFrame = useCallback((frame) => {
        if (!frame.valid) return;
        const t = Date.now();
        const patch = {};
        VITAL_KEYS.forEach((k) => { if (frame[k] != null) patch[k] = frame[k]; });
        if (Object.keys(patch).length === 0) return; // e.g. battery-only frame: not a vital
        const next = { ...vitalsRef.current, ...patch };
        vitalsRef.current = next;
        setVitals(next);
        setRawHex(frame.rawHex || '');
        setLastUpdated(t);
        setHistory((h) => [...h, { t, ...patch }].slice(-120));
        if (t - lastPush.current > PUSH_INTERVAL_MS) {
            lastPush.current = t;
            pushToBackend(next); // async, errors handled inside; never blocks BLE
        }
    }, [pushToBackend]);

    const handlePacket = useCallback((p) => {
        setPacketCount((c) => c + 1);
        setLastPacketHex(p.rawHex);
    }, []);

    const resetSession = () => {
        vitalsRef.current = EMPTY_VITALS;
        setVitals(EMPTY_VITALS);
        setLastUpdated(null);
        setRawHex('');
        setPacketCount(0);
        setLastPacketHex('');
    };

    const connect = useCallback(async () => {
        setError('');
        if (!isBluetoothSupported()) {
            setStatus('Failed to Connect');
            setError('Web Bluetooth is not available in this browser. Use Chrome or Edge on desktop/Android over HTTPS or localhost.');
            return;
        }
        resetSession();
        try {
            const { server } = await connectWatch({
                onStatus: setStatus,
                onFrame: handleFrame,
                onPacket: handlePacket,
                onDiagnostics: setDiagnostics,
                onDisconnect: () => { setGattServer(null); setConnectedAt(null); setStatus('Disconnected'); }
            });
            setGattServer(server);
            setConnectedAt(Date.now());
            setNow(Date.now());
        } catch (e) {
            if (e && e.name === 'NotFoundError') { setStatus('Disconnected'); return; } // chooser cancelled / no device
            setStatus('Failed to Connect');
            setError(e?.message || 'Could not connect to the watch.');
        }
    }, [handleFrame, handlePacket]);

    const disconnect = useCallback(() => {
        disconnectWatch();
        setGattServer(null);
        setConnectedAt(null);
        setStatus('Disconnected');
    }, []);

    useEffect(() => () => disconnectWatch({ silent: true }), []);

    const connected = status === 'Connected';
    const receiving = connected && lastUpdated != null && now - lastUpdated < RECEIVING_WINDOW_MS;
    const noDataWarning = connected && !receiving && connectedAt != null && now - (lastUpdated ?? connectedAt) > NO_DATA_WARNING_MS;

    const value = {
        status, connected, receiving, noDataWarning, vitals, rawHex, lastUpdated, history,
        gattServer, error, uploadError, packetCount, lastPacketHex, diagnostics,
        connect, disconnect, supported: isBluetoothSupported()
    };
    return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
}

export function useBle() {
    const ctx = useContext(BleContext);
    if (!ctx) throw new Error('useBle must be used inside <BleProvider>');
    return ctx;
}
