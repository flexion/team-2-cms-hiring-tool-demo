import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@uswds/uswds/dist/css/uswds.min.css': resolve(__dirname, 'node_modules/@uswds/uswds/dist/css/uswds.min.css'),
    },
  },
});
