import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@uswds/uswds/dist/css/uswds.min.css': resolve(__dirname, 'node_modules/@uswds/uswds/dist/css/uswds.min.css'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.{ts,tsx}'],
  },
});
