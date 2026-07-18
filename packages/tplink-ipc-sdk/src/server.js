import { createApp } from './server/app.js';
import { createCameraRegistry } from './server/camera-registry.js';
import { loadCameraConfig } from './server/config.js';

const host = '0.0.0.0';
const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const configFile = process.env.CAMERA_CONFIG_FILE ?? '/app/config/cameras.json';
const apiToken = process.env.API_TOKEN;

try {
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535');

  const config = await loadCameraConfig(configFile);
  const cameras = createCameraRegistry(config);
  const app = createApp({ cameras, apiToken });
  const server = app.listen(port, host, () => {
    console.log(`TP-Link IPC service listening on ${host}:${port} for ${cameras.size} camera(s)`);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}, shutting down`);
    server.close((error) => {
      if (error) {
        console.error('Failed to stop HTTP server cleanly');
        process.exitCode = 1;
      }
    });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
} catch (error) {
  console.error(`Unable to start TP-Link IPC service: ${error.message}`);
  process.exitCode = 1;
}
