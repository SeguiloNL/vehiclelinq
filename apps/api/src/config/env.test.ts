import test from 'node:test';
import assert from 'node:assert/strict';
import { getConfig } from './env';

test('getConfig geeft standaardwaarden terug', () => {
  const config = getConfig();
  assert.equal(config.port, Number(process.env.API_PORT ?? 3000));
  assert.equal(typeof config.databaseUrl, 'string');
  assert.ok(config.jwtSecret.length > 0);
});
