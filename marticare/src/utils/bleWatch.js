
export function parseWatchPayload(dataView) {
    // Read only the bytes belonging to this Bluetooth packet.
    const bytes = new Uint8Array(
        dataView.buffer,
        dataView.byteOffset,
        dataView.byteLength
    );

    const rawHex = Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join(" ");

    console.log("Ultra3 raw packet:", {
        length: bytes.length,
        hex: rawHex,
        decimal: Array.from(bytes)
    });

    // We have not yet verified the Ultra3 packet format.
    // Do not guess which bytes represent health measurements.
    return null;
}
