import type { TelemetryEnvelope } from '@vehiclelinq/shared';

export function parseCodec8Packet(packet: Buffer, trackerImei: string): TelemetryEnvelope[] {
  const records: TelemetryEnvelope[] = [];

  if (packet.length < 20) {
    return records;
  }

  const codecId = packet.readUInt8(8);
  if (codecId !== 0x08 && codecId !== 0x8e) {
    return records;
  }

  const recordCount = packet.readUInt8(9);
  let offset = 10;

  for (let index = 0; index < recordCount; index += 1) {
    const timestamp = Number(packet.readBigUInt64BE(offset));
    offset += 8;

    offset += 1;
    const lng = packet.readInt32BE(offset) / 10_000_000;
    offset += 4;
    const lat = packet.readInt32BE(offset) / 10_000_000;
    offset += 4;

    offset += 2;
    const heading = packet.readUInt16BE(offset);
    offset += 2;
    offset += 1;
    const speedKph = packet.readUInt16BE(offset);
    offset += 2;

    const eventCode = packet.readUInt8(offset);
    offset += 1;
    const totalIo = packet.readUInt8(offset);
    offset += 1;

    offset += totalIo * 2;

    records.push({
      trackerImei,
      timestamp: new Date(timestamp).toISOString(),
      lat,
      lng,
      speedKph,
      heading,
      ignition: speedKph > 0,
      eventCode,
    });
  }

  return records;
}
