import React, { useState, useEffect } from 'react';
import { sendWatchNotification } from '../services/bleNotificationService';

export default function RemindersModule({ gattServer }) {
    const [waterTimer, setWaterTimer] = useState(7200); // 2 Hours (7200 seconds)

    const triggerWatchAlert = async () => {
        let watchSuccess = false;

        // 1. Primary Attempt: Push directly to Ultra3 Watch
        if (gattServer && gattServer.connected) {
            watchSuccess = await sendWatchNotification(gattServer, "MaatriCare: Time to drink water! 💧");
        }

        // 2. Fallback Attempt: Laptop Browser Notification (Only if watch fails or is disconnected)
        if (!watchSuccess && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('🌸 MaatriCare Water Reminder', {
                body: 'Please drink a glass of water now.'
            });
        }
    };

    // 2-Hour Timer Interval
    useEffect(() => {
        const timer = setInterval(() => {
            setWaterTimer((prev) => {
                if (prev <= 1) {
                    triggerWatchAlert();
                    return 7200; // Reset timer
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gattServer]);

    const formatTime = (sec) => {
        const hrs = Math.floor(sec / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        const secs = sec % 60;
        return `${hrs}h ${mins}m ${secs}s`;
    };

    return (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <h3>💧 2-Hour Hydration Timer</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#0288d1' }}>{formatTime(waterTimer)}</p>

            <button
                onClick={triggerWatchAlert}
                style={{ padding: '10px 18px', background: '#e91e63', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
                🔔 Test Send Alert to Smartwatch
            </button>
        </div>
    );
}