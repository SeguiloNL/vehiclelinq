import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { parseCodec8Packet } from './codec8e-parser';

test('parseCodec8Packet parseert een eenvoudige Teltonika record', () => {
  const buffer = Buffer.alloc(4 + 4 + 1 + 1 + 8 + 1 + 4 + 4 + 2 + 2 + 1 + 2 + 1 + 1 + 4);
  let offset = 0;

  buffer.writeUInt32BE(0, offset);
  offset += 4;
  buffer.writeUInt32BE(buffer.length - 12, offset);
  offset += 4;
  buffer.writeUInt8(0x08, offset);
  offset += 1;
  buffer.writeUInt8(1, offset);
  offset += 1;
  buffer.writeBigUInt64BE(BigInt(Date.UTC(2024, 0, 1, 0, 0, 0)), offset);
  offset += 8;
  buffer.writeUInt8(0, offset);
  offset += 1;
  buffer.writeInt32BE(Math.round(4.8952 * 10_000_000), offset);
  offset += 4;
  buffer.writeInt32BE(Math.round(52.3702 * 10_000_000), offset);
  offset += 4;
  buffer.writeUInt16BE(0, offset);
  offset += 2;
  buffer.writeUInt16BE(180, offset);
  offset += 2;
  buffer.writeUInt8(5, offset);
  offset += 1;
  buffer.writeUInt16BE(56, offset);
  offset += 2;
  buffer.writeUInt8(1, offset);
  offset += 1;
  buffer.writeUInt8(0, offset);
  offset += 1;
  buffer.writeUInt32BE(0, offset);

  const [record] = parseCodec8Packet(buffer, '356307042441013');

  assert.equal(record?.trackerImei, '356307042441013');
  assert.equal(record?.lat, 52.3702);
  assert.equal(record?.lng, 4.8952);
  assert.equal(record?.speedKph, 56);
  assert.equal(record?.heading, 180);
});
