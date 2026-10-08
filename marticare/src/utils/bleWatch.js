// Parse incoming 20-byte payload from Ultra3 Smartwatch
export function parseWatchPayload(dataView) {
    const bytes = new Uint8Array(dataView.buffer);

    // Check frame header (0xCD)
    if (bytes[0] === 0xCD && bytes.length >= 20) {
        // 1. Step Counter (Bytes 12-13, Big-Endian)
        const steps = (bytes[12] << 8) | bytes[13];

        // 2. Body Temperature Estimation / Secondary Sensor (Bytes 16-17)
        // Converts raw ADC value into Celsius scale
        const rawTemp = (bytes[16] << 8) | bytes[17];
        const temperature = (rawTemp / 100).toFixed(1);

        // 3. Heart Rate or SpO2 Metric (Byte 19)
        const heartRate = bytes[19];

        return {
            steps,
            temperature: temperature > 0 ? temperature : "36.5", // Fallback standard
            heartRate,
            timestamp: new Date().toLocaleTimeString()
        };
    }
    return null;
}