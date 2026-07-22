import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

/**
 * ARCHITECTURE GATE — do not delete.
 *
 * Nest DI relies on decorator metadata that esbuild (vitest's default
 * transformer) silently drops; unplugin-swc supplies it. This test fails
 * loudly if that wiring ever breaks, instead of every future service
 * test failing with an opaque "can't resolve dependency" error.
 */
@Injectable()
class ProbeDependency {
  readonly value = 'wired';
}

@Injectable()
class ProbeService {
  constructor(readonly dependency: ProbeDependency) {}
}

@Module({ providers: [ProbeDependency, ProbeService] })
class ProbeModule {}

describe('Nest DI under vitest', () => {
  it('resolves constructor injection via decorator metadata', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProbeModule],
    }).compile();

    const service = moduleRef.get(ProbeService);
    expect(service.dependency.value).toBe('wired');
  });
});
