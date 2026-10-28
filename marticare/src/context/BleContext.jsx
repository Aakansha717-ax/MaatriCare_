
import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef
} from "react";

import {
    connectWatch,
    disconnectWatch,
    isBluetoothSupported
} from "../services/bleService";

import { apiService } from "../services/apiService";

const EMPTY_VITALS = {
    steps: null,
    temperature: null,
    heartRate: null,
    spo2: null,
    bpSystolic: null,
    bpDiastolic: null
};

const BleContext = createContext(null);

export function BleProvider({ children }) {
    const [status, setStatus] = useState("Disconnected");
    const [vitals, setVitals] = useState(EMPTY_VITALS);
    const [rawHex, setRawHex] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);
    const [history, setHistory] = useState([]);
    const [gattServer, setGattServer] = useState(null);
    const [error, setError] = useState("");

    const lastPush = useRef(0);

    const handleFrame = useCallback((frame) => {
        if (!frame?.valid) return;

        const now = Date.now();

        setRawHex(frame.rawHex || "");
        setLastUpdated(now);

        setVitals((previous) => {
            const next = {
                ...previous,
                steps: frame.steps ?? previous.steps,
                temperature:
                    frame.temperature ?? previous.temperature,
                heartRate:
                    frame.heartRate ?? previous.heartRate,
                spo2: frame.spo2 ?? previous.spo2,
                bpSystolic:
                    frame.bpSystolic ?? previous.bpSystolic,
                bpDiastolic:
                    frame.bpDiastolic ?? previous.bpDiastolic
            };

            if (now - lastPush.current >= 60000) {
                lastPush.current = now;

                Promise.resolve(apiService.pushVitals(next))
                    .catch((err) => {
                        console.error(
                            "Failed to sync vitals:",
                            err
                        );
                    });
            }

            return next;
        });

        setHistory((previous) => [
            ...previous,
            {
                t: now,
                ...frame
            }
        ].slice(-120));
    }, []);

    const connect = useCallback(async () => {
        setError("");

        if (!isBluetoothSupported()) {
            setStatus("Failed to Connect");
            setError(
                "Web Bluetooth is unavailable. Try Chrome or Edge on localhost."
            );
            return;
        }

        setStatus("Connecting");

        try {
            const result = await connectWatch({
                onStatus: (nextStatus) => {
                    setStatus(nextStatus);
                },

                onFrame: handleFrame,

                onDisconnect: () => {
                    setGattServer(null);
                    setStatus("Disconnected");
                }
            });

            setGattServer(result.server);
            setStatus("Connected");
        } catch (err) {
            setGattServer(null);
            setStatus(
                err?.name === "NotFoundError"
                    ? "Disconnected"
                    : "Failed to Connect"
            );

            setError(
                err?.name === "NotFoundError"
                    ? "No device selected. Select Ultra3 to connect."
                    : err?.message || "Could not connect to Ultra3."
            );

            console.error("MaatriCare BLE error:", err);
        }
    }, [handleFrame]);

    const connectMock = useCallback(() => {
        setError("");
        setStatus("Connected");

        setGattServer({ connected: true });

        // DEMO VALUES ONLY — not measurements from the watch.
        setVitals({
            steps: 4280,
            temperature: 36.6,
            heartRate: 78,
            spo2: 98,
            bpSystolic: 120,
            bpDiastolic: 80
        });

        setLastUpdated(Date.now());
    }, []);

    const disconnect = useCallback(() => {
        disconnectWatch();

        setGattServer(null);
        setStatus("Disconnected");
        setVitals(EMPTY_VITALS);
        setRawHex("");
        setLastUpdated(null);
        setError("");
    }, []);

    const value = {
        status,
        connected: status === "Connected",
        vitals,
        rawHex,
        lastUpdated,
        history,
        gattServer,
        error,
        connect,
        disconnect,
        connectMock,
        supported: isBluetoothSupported()
    };

    return (
        <BleContext.Provider value={value}>
            {children}
        </BleContext.Provider>
    );
}

export function useBle() {
    const context = useContext(BleContext);

    if (!context) {
        throw new Error(
            "useBle must be used inside <BleProvider>"
        );
    }

    return context;
}
