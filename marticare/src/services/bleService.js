
import { parseWatchPayload } from "../utils/bleWatch.js";

const SERVICE_UUID = "6e400801-b5a3-f393-e0a9-e50e24dcca9d";
const NOTIFY_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9d";

let currentDevice = null;
let currentServer = null;
let currentCharacteristic = null;
let frameCallback = null;
let disconnectCallback = null;

export function isBluetoothSupported() {
    return (
        typeof navigator !== "undefined" &&
        !!navigator.bluetooth
    );
}

export async function connectWatch({
    onStatus,
    onFrame,
    onDisconnect
} = {}) {
    if (!isBluetoothSupported()) {
        throw new Error(
            "Web Bluetooth is not supported in this browser."
        );
    }

    // Clean up any previous connection before starting another.
    disconnectWatch();

    frameCallback = onFrame;
    disconnectCallback = onDisconnect;

    onStatus?.("Connecting");

    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{ name: "Ultra3" }],
            optionalServices: [
                SERVICE_UUID,
                "battery_service",
                "device_information"
            ]
        });

        currentDevice = device;
        device.addEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );

        currentServer = await device.gatt.connect();

        const service =
            await currentServer.getPrimaryService(SERVICE_UUID);

        const characteristics = await service.getCharacteristics();

        console.table(
            characteristics.map((c) => ({
                uuid: c.uuid,
                notify: c.properties.notify,
                indicate: c.properties.indicate,
                read: c.properties.read,
                write: c.properties.write,
                writeWithoutResponse: c.properties.writeWithoutResponse
            }))
        );


        currentCharacteristic =
            await service.getCharacteristic(NOTIFY_UUID);

        currentCharacteristic.addEventListener(
            "characteristicvaluechanged",
            handleNotification
        );

        await currentCharacteristic.startNotifications();
        console.log("✅ Notifications started");
        console.log("📡 Characteristic:", currentCharacteristic.uuid);
        console.log(
            "📡 Properties:",
            currentCharacteristic.properties
        );

        onStatus?.("Connected");

        console.log("BLE connected:", device.name);
        console.log("Notification subscription started.");

        return {
            device,
            server: currentServer
        };
    } catch (error) {
        console.error("BLE connection failed:", error);

        if (currentCharacteristic) {
            currentCharacteristic.removeEventListener(
                "characteristicvaluechanged",
                handleNotification
            );
        }

        if (currentDevice) {
            currentDevice.removeEventListener(
                "gattserverdisconnected",
                handleDisconnect
            );
        }

        if (currentDevice?.gatt?.connected) {
            currentDevice.gatt.disconnect();
        }

        currentDevice = null;
        currentServer = null;
        currentCharacteristic = null;

        onStatus?.("Failed to Connect");
        throw error;
    }
}

function handleNotification(event) {
    console.log("🔔 Notification event received!");

    const value = event.target.value;

    const bytes = new Uint8Array(
        value.buffer,
        value.byteOffset,
        value.byteLength
    );
    console.log(
        "📥 ULTRA3 RAW PACKET:",
        Array.from(bytes)
            .map(b => b.toString(16).padStart(2, "0"))
            .join(" ")
    );

    const rawHex = Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join(" ");

    console.log("WATCH NOTIFICATION BYTES:", rawHex);

    try {
        const parsed = parseWatchPayload(
            new DataView(
                value.buffer,
                value.byteOffset,
                value.byteLength
            )
        );

        console.log("PARSED WATCH DATA:", parsed);

        if (!parsed) {
            console.warn(
                "Packet received, but the parser did not recognize it."
            );
            return;
        }

        frameCallback?.({
            ...parsed,
            valid: true,
            rawHex
        });
    } catch (error) {
        console.error("Failed to parse watch packet:", error);
    }
}

function handleDisconnect() {
    console.log("Watch disconnected.");

    currentCharacteristic?.removeEventListener(
        "characteristicvaluechanged",
        handleNotification
    );

    currentDevice?.removeEventListener(
        "gattserverdisconnected",
        handleDisconnect
    );

    currentDevice = null;
    currentServer = null;
    currentCharacteristic = null;

    const callback = disconnectCallback;

    frameCallback = null;
    disconnectCallback = null;

    callback?.();
}

export function disconnectWatch() {
    const device = currentDevice;

    if (currentCharacteristic) {
        currentCharacteristic.removeEventListener(
            "characteristicvaluechanged",
            handleNotification
        );
    }

    if (device) {
        device.removeEventListener(
            "gattserverdisconnected",
            handleDisconnect
        );
    }

    currentCharacteristic = null;
    currentServer = null;
    currentDevice = null;

    frameCallback = null;
    disconnectCallback = null;

    if (device?.gatt?.connected) {
        device.gatt.disconnect();
    }
}
