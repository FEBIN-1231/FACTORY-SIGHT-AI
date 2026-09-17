import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

function apiAnalyzePlugin() {
  return {
    name: 'api-analyze-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/analyze' || req.url?.startsWith('/api/analyze?')) {
          try {
            const { default: handler } = await import('./api/analyze.js');
            let bodyStr = '';
            req.on('data', chunk => { bodyStr += chunk; });
            req.on('end', async () => {
              req.body = bodyStr ? JSON.parse(bodyStr) : {};
              res.status = function(code) {
                this.statusCode = code;
                return this;
              };
              res.json = function(data) {
                this.setHeader('Content-Type', 'application/json');
                this.end(JSON.stringify(data));
                return this;
              };
              await handler(req, res);
            });
            return;
          } catch (err) {
            console.error('[Vite Dev API Proxy Error]:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Expose SNS server env vars to process.env during local vite dev
  if (env.SNS_WEBHOOK_URL) process.env.SNS_WEBHOOK_URL = env.SNS_WEBHOOK_URL;
  if (env.SNS_WEBHOOK_SECRET) process.env.SNS_WEBHOOK_SECRET = env.SNS_WEBHOOK_SECRET;
  if (env.SNS_API_KEY) process.env.SNS_API_KEY = env.SNS_API_KEY;

  return {
    plugins: [
      react(),
      apiAnalyzePlugin(),
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
  }
})
