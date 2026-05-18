import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // ДОБАВЛЯЕМ ЭТОТ БЛОК:
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});