import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { HealthController } from './health/health.controller';
import { PositionWriterService } from './pipeline/position-writer.service';
import { TelemetryNormalizerService } from './pipeline/telemetry-normalizer.service';
import { TcpServerService } from './server/tcp-server';
import { UdpServerService } from './server/udp-server';

@Module({
  controllers: [HealthController],
  providers: [
    DatabaseService,
    TelemetryNormalizerService,
    PositionWriterService,
    TcpServerService,
    UdpServerService,
  ],
})
export class AppModule {}
