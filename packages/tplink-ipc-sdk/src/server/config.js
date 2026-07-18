import { readFile } from 'node:fs/promises';

const CAMERA_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const REQUIRED_FIELDS = ['id', 'name', 'host', 'username', 'password'];

export function validateCameraConfig(config) {
  if (!config || !Array.isArray(config.cameras) || config.cameras.length === 0) {
    throw new Error('cameras must be a non-empty array');
  }

  const ids = new Set();
  for (const camera of config.cameras) {
    for (const field of REQUIRED_FIELDS) {
      if (typeof camera?.[field] !== 'string' || camera[field].trim() === '') {
        throw new Error(`camera ${field} must be a non-empty string`);
      }
    }

    if (!CAMERA_ID_PATTERN.test(camera.id)) {
      throw new Error(`camera has invalid id: ${camera.id}`);
    }
    if (ids.has(camera.id)) {
      throw new Error(`duplicate id: ${camera.id}`);
    }
    if (/^https?:\/\//i.test(camera.host)) {
      throw new Error(`camera ${camera.id} host must not include a URL scheme`);
    }
    ids.add(camera.id);
  }

  return config;
}

export async function loadCameraConfig(path) {
  let contents;
  try {
    contents = await readFile(path, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read camera configuration: ${error.message}`);
  }

  let config;
  try {
    config = JSON.parse(contents);
  } catch {
    throw new Error('Camera configuration is not valid JSON');
  }

  return validateCameraConfig(config);
}
