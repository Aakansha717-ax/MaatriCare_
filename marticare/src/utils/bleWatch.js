// Parsers for Ultra3 BLE data.
//
// IMPORTANT: The Ultra3's proprietary protocol (service 6e400801-..., notify 6e400003-...) is NOT
// documented and no real packet has been captured yet. The earlier "0xCD / 20 byte" layout was an
// unverified guess and has been removed. Packets from unknown characteristics are only logged.
//
// Only formats defined by the Bluetooth SIG are decoded here:
//   0x2A37 Heart Rate Measurement, 0x2A19 Battery Level.

export const HEART_RATE_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';
export const BATTERY_LEVEL = '00002a19-0000-1000-8000-00805f9b34fb';

export const VALID_RANGES = {
    heartRate: { min: 30, max: 250 }
};

export function toHex(dataView) {
    return Array.from(new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');
}

// Returns { heartRate } | { batteryLevel } | null (unknown / malformed / out of range).
export function parseStandardCharacteristic(uuid, dataView) {
    const id = String(uuid).toLowerCase();
    if (id === HEART_RATE_MEASUREMENT) {
        if (dataView.byteLength < 2) return null;
        const flags = dataView.getUint8(0);
        const is16 = (flags & 0x01) !== 0;
        if (is16 && dataView.byteLength < 3) return null;
        const hr = is16 ? dataView.getUint16(1, true) : dataView.getUint8(1);
        const { min, max } = VALID_RANGES.heartRate;
        return hr >= min && hr <= max ? { heartRate: hr } : null;
    }
    if (id === BATTERY_LEVEL) {
        if (dataView.byteLength < 1) return null;
        const level = dataView.getUint8(0);
        return level <= 100 ? { batteryLevel: level } : null;
    }
    return null;
}
