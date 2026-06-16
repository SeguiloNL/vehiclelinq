import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Buffer } from 'node:buffer';
import net, { type Socket } from 'node:net';
import { getConfig } from '../config/env';
import { TelemetryNormalizerService } from '../pipeline/telemetry-normalizer.service';
import { PositionWriterService } from '../pipeline/position-writer.service';
import { parseCodec8Packet } from '../teltonika/codec8e-parser';
import { parseImeiHandshake } from '../teltonika/imei-handshake';

@Injectable()
export class TcpServerService implements OnModuleInit {
  private readonly logger = new Logger(TcpServerService.name);
  private readonly imeiBySocket = new WeakMap<Socket, string>();

  constructor(
    private readonly normalizer: TelemetryNormalizerService,
    private readonly writer: PositionWriterService,
  ) {}

  onModuleInit(): void {
    const server = net.createServer((socket: Socket) => {
      socket.on('data', async (buffer: Buffer) => {
        const existingImei = this.imeiBySocket.get(socket);

        if (!existingImei) {
          const imei = parseImeiHandshake(buffer);
          if (!imei) {
            socket.write(Buffer.from([0x00]));
            return;
          }

          this.imeiBySocket.set(socket, imei);
          socket.write(Buffer.from([0x01]));
          return;
        }

        const records = this.normalizer.normalize(parseCodec8Packet(buffer, existingImei));
        await Promise.all(records.map((record) => this.writer.persist(record)));
        const ack = Buffer.alloc(4);
        ack.writeUInt32BE(records.length, 0);
        socket.write(ack);
      });
    });

    server.listen(getConfig().tcpPort, '0.0.0.0', () => {
      this.logger.log(`TCP ingest luistert op poort ${getConfig().tcpPort}`);
    });
  }
}
