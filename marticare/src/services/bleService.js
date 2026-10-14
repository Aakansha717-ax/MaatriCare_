
import { parseWatchPayload } from "../utils/bleWatch.js";

const SERVICE_UUID = "6e400801-b5a3-f393-e0a9-e50e24dcca9d";
const NOTIFY_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9d";

let currentDevice = null;
let currentServer = null;
let currentCharacteristic = null;
let frameCallback = null;
let disconnectCallback = null;

export function isBluetoothSupported() {
    return typeof navigator !== "undefined" &&
        !!navigator.bluetooth;
}

export async function connectWatch({
    onStatus,
    onFrame,
    onDisconnect
} = {}) {
    if (!isBluetoothSupported()) {
        throw new Error("Web Bluetooth is not supported in this browser.");
    }

    frameCallback = onFrame;
    disconnectCallback = onDisconnect;

    onStatus?.("Connecting");

    const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: ["battery_service", "device_information"]
    });

    currentDevice = device;
    device.addEventListener("gattserverdisconnected", handleDisconnect);

    try {
        currentServer = await device.gatt.connect();

        const service = await currentServer.getPrimaryService(SERVICE_UUID);
        currentCharacteristic =
            await service.getCharacteristic(NOTIFY_UUID);

        currentCharacteristic.addEventListener(
            "characteristicvaluechanged",
            handleNotification
        );

        await currentCharacteristic.startNotifications();

        onStatus?.("Connected");

        return { device, server: currentServer };
    } catch (error) {
        onStatus?.("Failed to Connect");
        throw error;
    }
}

function handleNotification(event) {
    const value = event.target.value;

    const bytes = new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength
    );

    const parsed = parseWatchPayload(
        new DataView(value.buffer, value.byteOffset, value.byteLength)
    );

    if (!parsed) return;

    frameCallback?.({
        ...parsed,
        valid: true,
        rawHex: Array.from(bytes)
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join(" ")
    });
}

function handleDisconnect() {
    currentServer = null;
    currentCharacteristic = null;
    disconnectCallback?.();
}

export function disconnectWatch() {
    if (currentCharacteristic) {
        currentCharacteristic.removeEventListener(
            "characteristicvaluechanged",
            handleNotification
        );
    }

    if (currentDevice?.gatt?.connected) {
        currentDevice.gatt.disconnect();
    } else {
        handleDisconnect();
    }

    currentDevice = null;
    currentServer = null;
    currentCharacteristic = null;
}