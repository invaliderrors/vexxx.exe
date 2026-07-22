import { describe, expect, it } from 'vitest';
import { parseAccessRequest } from './access';

describe('parseAccessRequest', () => {
  it('normalizes a valid digital id', () => {
    expect(parseAccessRequest({ email: '  VX@EXAMPLE.COM ' })).toEqual({
      email: 'vx@example.com',
    });
  });

  it('rejects malformed and non-strict input', () => {
    expect(parseAccessRequest({ email: 'not-an-email' })).toBeNull();
    expect(parseAccessRequest({ email: 'vx@example.com', role: 'admin' })).toBeNull();
  });
});
