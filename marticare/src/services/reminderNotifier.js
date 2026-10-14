// src/services/reminderNotifier.js
// One call that fires all three channels: smartwatch (existing sendWatchNotification, unchanged),
// browser notification, and an audio chime.
import { sendWatchNotification } from './bleNotificationService';

export function notificationPermission() {
    return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

export async function requestNotificationPermission() {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'default') {
        try { return await Notification.requestPermission(); } catch { return 'denied'; }
    }
    return Notification.permission;
}

let audioCtx = null;
export function playChime() {
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return false;
        audioCtx = audioCtx || new Ctx();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        [0, 0.25].forEach((offset, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = i === 0 ? 660 : 880;
            gain.gain.setValueAtTime(0.0001, audioCtx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + offset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + offset + 0.22);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + offset);
            osc.stop(audioCtx.currentTime + offset + 0.25);
        });
        return true;
    } catch { return false; }
}

export async function fireReminder({ title, body, watchText, gattServer, browser = true, sound = true, watch = true }) {
    const result = { watch: false, browser: false, audio: false };
    if (watch && gattServer && gattServer.connected) {
        result.watch = await sendWatchNotification(gattServer, watchText || title);
    }
    if (browser && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try { new Notification(title, { body }); result.browser = true; } catch { /* ignore */ }
    }
    if (sound) result.audio = playChime();
    return result;
}
