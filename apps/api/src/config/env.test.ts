import { describe, expect, it } from 'vitest';
import { moneySchema } from '@vexxx/contracts';
import { loadEnv } from './env';

describe('loadEnv', () => {
  it('applies defaults for an empty environment', () => {
    const env = loadEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3300);
  });

  it('coerces PORT from string', () => {
    expect(loadEnv({ PORT: '8080' }).PORT).toBe(8080);
  });

  it('rejects invalid PORT values', () => {
    expect(() => loadEnv({ PORT: 'not-a-port' })).toThrow(
      /Invalid environment/,
    );
    expect(() => loadEnv({ PORT: '-1' })).toThrow(/Invalid environment/);
  });

  it('rejects unknown NODE_ENV values', () => {
    expect(() => loadEnv({ NODE_ENV: 'staging' })).toThrow(
      /Invalid environment/,
    );
  });
});

describe('workspace integration', () => {
  it('consumes @vexxx/contracts from the API package', () => {
    expect(moneySchema.parse({ amount: 100, currency: 'EUR' })).toEqual({
      amount: 100,
      currency: 'EUR',
    });
  });
});
