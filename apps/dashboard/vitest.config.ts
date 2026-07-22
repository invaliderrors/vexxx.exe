import { defineConfig } from 'vitest/config';

export default defineConfig({
  // tsconfig has jsx: "preserve" for Next's SWC; vitest's esbuild must
  // transform JSX itself or tests can't run.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
