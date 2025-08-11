// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/clicker-game/', // GitHub Pages用（リポジトリ名に合わせて変更）
  server: {
    open: true,
  },
});