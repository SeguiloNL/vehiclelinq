import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { getConfig } from './config/env';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool = new Pool({
    connectionString: getConfig().databaseUrl,
  });

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async query<T extends QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>> {
    this.logger.debug(text);
    return this.pool.query<T>(text, values);
  }
}
