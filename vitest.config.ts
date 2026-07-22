import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // No passWithNoTests: a glob that silently matches zero files must fail
    // rather than look green.
  },
});
