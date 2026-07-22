import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { HealthModule } from './health.module';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports ok with service identity and uptime', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();

    const controller = moduleRef.get(HealthController);
    const result = controller.check();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('api');
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
