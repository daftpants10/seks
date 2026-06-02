"""
Polar H10 accelerometer stream — macOS (bleak / CoreBluetooth)

Usage:
    pip install bleak
    python polar_h10_acc.py

The script scans for a device whose name starts with "Polar H10",
connects, starts a 50 Hz ACC stream, and prints live x/y/z values.
Press Ctrl+C to stop.
"""

import asyncio
import struct
from bleak import BleakScanner, BleakClient

# Polar Measurement Data (PMD) service
PMD_SERVICE       = "fb005c80-02e7-f387-1cad-8acd2d8df0c8"
PMD_CONTROL_POINT = "fb005c81-02e7-f387-1cad-8acd2d8df0c8"
PMD_DATA          = "fb005c82-02e7-f387-1cad-8acd2d8df0c8"

# PMD commands
GET_ACC_SETTINGS  = bytes([0x01, 0x02])           # request available ACC settings
START_ACC         = bytes([
    0x02,        # start measurement
    0x02,        # measurement type: ACC
    0x00, 0x01,  # setting type: sample rate
    0x01,        # array length
    0x32, 0x00,  # 50 Hz (little-endian uint16)
    0x01, 0x01,  # setting type: resolution
    0x01,        # array length
    0x10, 0x00,  # 16-bit resolution
    0x04, 0x01,  # setting type: range
    0x01,        # array length
    0x08, 0x00,  # ±8g range
])
STOP_ACC          = bytes([0x03, 0x02])            # stop ACC


def parse_acc_frame(data: bytearray) -> None:
    """Parse a PMD ACC data frame and print x/y/z samples."""
    print(f"  [raw frame] {len(data)} bytes: {data[:16].hex()}")
    if len(data) < 10:
        return
    measurement_type = data[0]
    if measurement_type != 0x02:  # not ACC
        print(f"  [skipped] measurement_type=0x{measurement_type:02x} (not ACC)")
        return

    # Bytes 1-8: timestamp (uint64 nanoseconds)
    timestamp_ns = struct.unpack_from("<Q", data, 1)[0]
    frame_type = data[9]

    if frame_type == 0x00:
        # Frame type 0: raw 16-bit signed x/y/z samples
        offset = 10
        sample_count = 0
        while offset + 5 < len(data):
            x = struct.unpack_from("<h", data, offset)[0]
            y = struct.unpack_from("<h", data, offset + 2)[0]
            z = struct.unpack_from("<h", data, offset + 4)[0]
            offset += 6
            sample_count += 1
            ts_ms = timestamp_ns // 1_000_000
            print(f"ts={ts_ms}ms  x={x:6d} mG  y={y:6d} mG  z={z:6d} mG")
    elif frame_type == 0x02:
        # Frame type 2: delta-compressed samples — first sample is full 16-bit
        offset = 10
        ref_x = struct.unpack_from("<h", data, offset)[0]
        ref_y = struct.unpack_from("<h", data, offset + 2)[0]
        ref_z = struct.unpack_from("<h", data, offset + 4)[0]
        ts_ms = timestamp_ns // 1_000_000
        print(f"ts={ts_ms}ms  x={ref_x:6d} mG  y={ref_y:6d} mG  z={ref_z:6d} mG")


async def run():
    print("Scanning for Polar H10...")
    device = await BleakScanner.find_device_by_filter(
        lambda d, _: d.name and d.name.startswith("Polar H10"),
        timeout=10.0,
    )
    if device is None:
        print("No Polar H10 found. Make sure the strap is worn and nearby.")
        return

    print(f"Found: {device.name}  ({device.address})")

    async with BleakClient(device) as client:
        print("Connected. Starting ACC stream at 50 Hz...")

        def on_control_point(_, data):
            print(f"[ctrl response] {bytearray(data).hex()}")

        # Enable notifications on control point and data characteristic
        await client.start_notify(PMD_CONTROL_POINT, on_control_point)
        await client.start_notify(PMD_DATA, lambda _, data: parse_acc_frame(bytearray(data)))

        # Query available settings first
        print("Querying ACC settings...")
        await client.write_gatt_char(PMD_CONTROL_POINT, GET_ACC_SETTINGS, response=True)
        await asyncio.sleep(1)

        # Start the ACC stream
        print(f"Sending START_ACC: {START_ACC.hex()}")
        await client.write_gatt_char(PMD_CONTROL_POINT, START_ACC, response=True)
        await asyncio.sleep(1)
        print("Streaming — press Ctrl+C to stop.\n")

        try:
            while True:
                await asyncio.sleep(1)
        except (KeyboardInterrupt, asyncio.CancelledError):
            print("\nStopping...")
            await client.write_gatt_char(PMD_CONTROL_POINT, STOP_ACC, response=True)


if __name__ == "__main__":
    asyncio.run(run())
