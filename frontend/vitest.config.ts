import { defineConfig } from 'vitest/config';
export default defineConfig({test:{environment:'jsdom',include:['test/**/*.test.ts'],maxWorkers:4,testTimeout:10000}});
