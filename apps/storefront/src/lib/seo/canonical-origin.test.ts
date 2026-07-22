import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CANONICAL_ORIGIN = 'https://vexxx.co';
const configUrl = new URL('../../../astro.config.mjs', import.meta.url);

describe('canonical origin', () => {
  it('astro.config.mjs pins SITE_URL to the canonical origin', () => {
    const config = readFileSync(configUrl, 'utf8');
    expect(config).toContain(`const SITE_URL = '${CANONICAL_ORIGIN}';`);
  });

  it('the dead .com origin appears nowhere in the config', () => {
    expect(readFileSync(configUrl, 'utf8')).not.toContain('vexxx.com');
  });
});
