import { Injectable, Logger } from '@nestjs/common';
import type { TelemetryEnvelope } from '@vehiclelinq/shared';
import { DatabaseService } from '../database.service';

@Injectable()
export class PositionWriterService {
  private readonly logger = new Logger(PositionWriterService.name);

  constructor(private readonly database: DatabaseService) {}

  async persist(record: TelemetryEnvelope): Promise<void> {
    const trackerResult = await this.database.query<{
      id: string;
      company_id: string;
      vehicle_id: string | null;
    }>(
      `
        SELECT id, company_id, vehicle_id
        FROM trackers
        WHERE imei = $1
      `,
      [record.trackerImei],
    );

    const tracker = trackerResult.rows[0];
    if (!tracker?.vehicle_id) {
      await this.database.query(
        `
          INSERT INTO device_events (company_id, tracker_id, tracker_imei, type, payload)
          VALUES ($1, $2, $3, 'tracker.quarantine', $4::jsonb)
        `,
        [tracker?.company_id ?? null, tracker?.id ?? null, record.trackerImei, JSON.stringify(record)],
      );
      this.logger.warn(`Tracker ${record.trackerImei} staat in quarantine of heeft geen voertuig.`);
      return;
    }

    await this.database.query(
      `
        INSERT INTO telemetry_positions (
          company_id, vehicle_id, tracker_id, tracker_imei, lat, lng, speed_kph, heading, ignition, recorded_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        tracker.company_id,
        tracker.vehicle_id,
        tracker.id,
        record.trackerImei,
        record.lat,
        record.lng,
        record.speedKph,
        record.heading,
        record.ignition,
        record.timestamp,
      ],
    );

    await this.database.query(
      `
        UPDATE vehicles
        SET status = CASE
          WHEN $3 > 0 THEN 'online'
          ELSE 'idle'
        END
        WHERE id = $1
      `,
      [tracker.vehicle_id, tracker.company_id, record.speedKph],
    );

    await this.database.query(
      `
        INSERT INTO vehicle_last_state (
          vehicle_id, company_id, tracker_id, tracker_imei, lat, lng, speed_kph, heading, ignition, online, recorded_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10)
        ON CONFLICT (vehicle_id)
        DO UPDATE SET
          tracker_id = EXCLUDED.tracker_id,
          tracker_imei = EXCLUDED.tracker_imei,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          speed_kph = EXCLUDED.speed_kph,
          heading = EXCLUDED.heading,
          ignition = EXCLUDED.ignition,
          online = EXCLUDED.online,
          recorded_at = EXCLUDED.recorded_at
      `,
      [
        tracker.vehicle_id,
        tracker.company_id,
        tracker.id,
        record.trackerImei,
        record.lat,
        record.lng,
        record.speedKph,
        record.heading,
        record.ignition,
        record.timestamp,
      ],
    );
  }
}
