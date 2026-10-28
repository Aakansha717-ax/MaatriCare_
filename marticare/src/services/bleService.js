// Web Bluetooth service for the Ultra3 watch.
// Diagnostic approach: enumerate every accessible service/characteristic, attach listeners BEFORE
// startNotifications(), and log every raw packet. Nothing is written to the watch (its protocol is
// undocumented). Only validated, standards-defined readings are passed to onFrame.
import { parseStandardCharacteristic, toHex } from '../utils/bleWatch.js';

export const CUSTOM_SERVICE_UUID = '6e400801-b5a3-f393-e0a9-e50e24dcca9d';
const OPTIONAL_SERVICES = [CUSTOM_SERVICE_UUID, 'battery_service', 'device_information', 'heart_rate'];

let currentDevice = null;
let subscriptions = []; // { characteristic, handler }
let callbacks = {};

export function isBluetoothSupported() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
}

function props(c) {
    const p = c.properties;
    return { read: p.read, write: p.write, writeWithoutResponse: p.writeWithoutResponse, notify: p.notify, indicate: p.indicate };
}

function removeSubscriptions() {
    subscriptions.forEach(({ characteristic, handler }) => {
        try { characteristic.removeEventListener('characteristicvaluechanged', handler); } catch { /* ignore */ }
    });
    subscriptions = [];
}

function cleanupDevice() {
    removeSubscriptions();
    if (currentDevice) {
        currentDevice.removeEventListener('gattserverdisconnected', handleDisconnect);
        currentDevice = null;
    }
}

function makeHandler(characteristic) {
    return (event) => {
        const value = event.target.value;
        const rawHex = toHex(value);
        console.log(`🔔 Notification ${characteristic.uuid}: ${rawHex}`);
        const parsed = parseStandardCharacteristic(characteristic.uuid, value);
        callbacks.onPacket?.({ uuid: characteristic.uuid, rawHex, recognised: !!parsed, t: Date.now() });
        if (!parsed) return; // unknown/malformed: logged only, never converted into vitals
        callbacks.onFrame?.({ ...parsed, valid: true, rawHex, uuid: characteristic.uuid });
    };
}

export async function connectWatch({ onStatus, onFrame, onPacket, onDisconnect, onDiagnostics } = {}) {
    if (!isBluetoothSupported()) throw new Error('Web Bluetooth is not supported in this browser.');

    // Drop any previous connection/listeners so handlers are never duplicated.
    disconnectWatch({ silent: true });
    callbacks = { onFrame, onPacket, onDisconnect };
    onStatus?.('Connecting');

    const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [CUSTOM_SERVICE_UUID] }, { namePrefix: 'Ultra' }],
        optionalServices: OPTIONAL_SERVICES
    });
    currentDevice = device;
    device.addEventListener('gattserverdisconnected', handleDisconnect);
    console.log('Selected device name:', device.name ?? '(name unavailable)', 'id:', device.id);

    try {
        const server = await device.gatt.connect();
        console.log('GATT connected:', server.connected);

        const diagnostics = { deviceName: device.name ?? null, services: [], subscribed: [], errors: [] };
        const services = await server.getPrimaryServices();
        for (const service of services) {
            const entry = { uuid: service.uuid, characteristics: [] };
            let chars = [];
            try { chars = await service.getCharacteristics(); } catch (e) { diagnostics.errors.push(`${service.uuid}: ${e.message}`); }
            for (const characteristic of chars) {
                entry.characteristics.push({ uuid: characteristic.uuid, properties: props(characteristic) });
                console.log(`📡 ${service.uuid} / ${characteristic.uuid}`, props(characteristic));
                if (characteristic.properties.notify || characteristic.properties.indicate) {
                    const handler = makeHandler(characteristic); // listener first, then subscribe
                    characteristic.addEventListener('characteristicvaluechanged', handler);
                    try {
                        await characteristic.startNotifications();
                        subscriptions.push({ characteristic, handler });
                        diagnostics.subscribed.push(characteristic.uuid);
                        console.log('✅ Notifications started:', characteristic.uuid);
                    } catch (e) {
                        characteristic.removeEventListener('characteristicvaluechanged', handler);
                        diagnostics.errors.push(`notify ${characteristic.uuid}: ${e.message}`);
                    }
                } else if (characteristic.properties.read && characteristic.uuid.startsWith('00002a19')) {
                    try {
                        const v = await characteristic.readValue();
                        const parsed = parseStandardCharacteristic(characteristic.uuid, v);
                        if (parsed) onFrame?.({ ...parsed, valid: true, rawHex: toHex(v), uuid: characteristic.uuid });
                    } catch (e) { diagnostics.errors.push(`read ${characteristic.uuid}: ${e.message}`); }
                }
            }
            diagnostics.services.push(entry);
        }
        onDiagnostics?.(diagnostics);
        if (diagnostics.subscribed.length === 0) throw new Error('No notifying characteristic could be subscribed.');
        onStatus?.('Connected');
        return { device, server };
    } catch (error) {
        onStatus?.('Failed to Connect');
        cleanupDevice();
        throw error;
    }
}

function handleDisconnect() {
    removeSubscriptions();
    callbacks.onDisconnect?.();
}

export function disconnectWatch({ silent = false } = {}) {
    const device = currentDevice;
    removeSubscriptions();
    if (device) device.removeEventListener('gattserverdisconnected', handleDisconnect);
    currentDevice = null;
    if (device?.gatt?.connected) device.gatt.disconnect();
    if (!silent) callbacks.onDisconnect?.();
}

export function isWatchConnected() {
    return !!currentDevice?.gatt?.connected;
}
