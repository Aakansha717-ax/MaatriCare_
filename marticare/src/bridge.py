import asyncio
from bleak import BleakScanner, BleakClient

# Nordic UART Service and Characteristics UUIDs
SERVICE_UUID = "6e400801-b5a3-f393-e0a9-e50e24dcca9d"
TX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9d"  # Notify (Watch -> PC)

def notification_handler(sender, data):
    # Print the raw bytes received from the watch
    print(f"Received from Watch: {data.hex().upper()}")
    # Here you could also send this data to your local React backend via HTTP POST!

async def main():
    print("Searching for Ultra3 Watch...")
    device = await BleakScanner.find_device_by_name("Ultra3")
    
    if not device:
        print("Ultra3 watch not found. Make sure it's turned on and unpaired from Windows settings.")
        return

    print(f"Connecting to {device.address}...")
    async with BleakClient(device) as client:
        print("Connected successfully via Python Bleak!")
        
        # Start listening for notifications from the watch
        await client.start_notify(TX_CHAR_UUID, notification_handler)
        
        print("Listening for data... Press Ctrl+C to stop.")
        while True:
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())