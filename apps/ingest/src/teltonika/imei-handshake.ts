export function parseImeiHandshake(buffer: Buffer): string | null {
  if (buffer.length < 4) {
    return null;
  }

  const length = buffer.readUInt16BE(0);
  const imei = buffer.subarray(2, 2 + length).toString('utf8');

  if (!/^\d{15}$/.test(imei)) {
    return null;
  }

  return imei;
}
