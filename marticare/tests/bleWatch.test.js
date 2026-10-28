// Run: node --test tests
import test from 'node:test';
import assert from 'node:assert';
import { parseStandardCharacteristic, HEART_RATE_MEASUREMENT, BATTERY_LEVEL } from '../src/utils/bleWatch.js';

const dv = (...b) => new DataView(new Uint8Array(b).buffer);
// NOTE: no captured Ultra3 packets exist yet; these use the Bluetooth SIG standard formats only.
test('8-bit heart rate', () => assert.deepStrictEqual(parseStandardCharacteristic(HEART_RATE_MEASUREMENT, dv(0, 72)), { heartRate: 72 }));
test('16-bit heart rate', () => assert.deepStrictEqual(parseStandardCharacteristic(HEART_RATE_MEASUREMENT, dv(1, 80, 0)), { heartRate: 80 }));
test('out-of-range heart rate rejected', () => assert.strictEqual(parseStandardCharacteristic(HEART_RATE_MEASUREMENT, dv(0, 0)), null));
test('truncated packet rejected', () => assert.strictEqual(parseStandardCharacteristic(HEART_RATE_MEASUREMENT, dv(1, 80)), null));
test('battery parsed', () => assert.deepStrictEqual(parseStandardCharacteristic(BATTERY_LEVEL, dv(55)), { batteryLevel: 55 }));
test('unknown Ultra3 packet never becomes vitals', () => assert.strictEqual(parseStandardCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9d', dv(0xcd, 1, 2, 3)), null));
