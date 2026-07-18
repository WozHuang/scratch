import { TPLinkIPCApiClient } from '../api.js';

export function createCameraRegistry(config, Client = TPLinkIPCApiClient) {
  return new Map(
    config.cameras.map((camera) => [camera.id, new Client(camera.host, camera.username, camera.password)])
  );
}
