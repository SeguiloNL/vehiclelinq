import { Injectable } from '@nestjs/common';
import type { TelemetryEnvelope } from '@vehiclelinq/shared';

@Injectable()
export class TelemetryNormalizerService {
  normalize(records: TelemetryEnvelope[]): TelemetryEnvelope[] {
    return records.filter(
      (record) =>
        Number.isFinite(record.lat) &&
        Number.isFinite(record.lng) &&
        Math.abs(record.lat) <= 90 &&
        Math.abs(record.lng) <= 180,
    );
  }
}
