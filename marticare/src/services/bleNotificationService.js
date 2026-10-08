// src/services/bleNotificationService.js

/**
 * Sends a raw hardware alert packet directly to the Ultra3 Smartwatch
 * @param {BluetoothRemoteGATTServer} gattServer - Connected GATT server instance
 * @param {string} text - Message text to display on watch screen
 */
export async function sendWatchNotification(gattServer, text = "💧 Drink Water Now!") {
    if (!gattServer || !gattServer.connected) {
        console.warn("Watch GATT Server is not connected!");
        return false;
    }

    try {
        const service = await gattServer.getPrimaryService('6e400801-b5a3-f393-e0a9-e50e24dcca9d');
        const rxChar = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9d');

        const encoder = new TextEncoder();
        const textBytes = encoder.encode(text);

        // Ultra3 Binary Protocol Frame for Alert + Vibration Motor:
        // [0xAB] -> Packet Header
        // [0x00] -> High Byte
        // [Len ] -> Payload Length
        // [0x08] -> Command Type: Push App/System Alert
        // [0x02] -> Haptic Control: 2x Motor Vibrations
        // [...textBytes] -> Message Bytes

        const packetLength = 2 + textBytes.length;
        const packet = new Uint8Array(5 + textBytes.length);

        packet[0] = 0xAB; // Header byte
        packet[1] = 0x00;
        packet[2] = packetLength;
        packet[3] = 0x08; // Alert command ID
        packet[4] = 0x02; // Trigger vibration motor

        packet.set(textBytes, 5);

        // Send payload using writeValueWithoutResponse for faster execution
        await rxChar.writeValueWithoutResponse(packet);
        console.log("✓ Direct hardware notification sent to Ultra3 watch!");
        return true;

    } catch (error) {
        console.error("Failed to write BLE notification packet:", error);
        return false;
    }
}