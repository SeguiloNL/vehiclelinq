import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Buffer } from 'node:buffer';
import dgram, { type RemoteInfo } from 'node:dgram';
import { getConfig } from '../config/env';

@Injectable()
export class UdpServerService implements OnModuleInit {
  private readonly logger = new Logger(UdpServerService.name);

  onModuleInit(): void {
    const server = dgram.createSocket('udp4');

    server.on('message', (_message: Buffer, remote: RemoteInfo) => {
      this.logger.log(`UDP bericht ontvangen van ${remote.address}:${remote.port}`);
    });

    server.bind(getConfig().udpPort, '0.0.0.0', () => {
      this.logger.log(`UDP ingest luistert op poort ${getConfig().udpPort}`);
    });
  }
}
