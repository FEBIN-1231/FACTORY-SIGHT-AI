import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.json',
      template: 'raw-data',
      gzipSize: true,
    }),
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-three',
              test: /[\\/]node_modules[\\/]three[\\/]/,
              priority: 50,
            },
            {
              name: 'vendor-react-three',
              test: /[\\/]node_modules[\\/](?:@react-three|three-stdlib)[\\/]/,
              priority: 45,
            },
            {
              name: 'vendor-charts',
              test: /[\\/]node_modules[\\/](?:recharts|d3-|victory-vendor)/,
              priority: 40,
            },
            {
              name: 'vendor-motion',
              test: /[\\/]node_modules[\\/](?:framer-motion|motion-dom|motion-utils)/,
              priority: 35,
            },
            {
              name: 'vendor-firebase',
              test: /[\\/]node_modules[\\/](?:firebase|@firebase)/,
              priority: 30,
            },
            {
              name: 'vendor-react',
              test: /[\\/]node_modules[\\/](?:react|react-dom|react-router|react-router-dom)/,
              priority: 25,
            },
          ],
        },
      },
    },
  },
})
