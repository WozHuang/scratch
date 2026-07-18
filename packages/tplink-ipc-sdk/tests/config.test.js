import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCameraConfig, validateCameraConfig } from '../src/server/config.js';
import { createCameraRegistry } from '../src/server/camera-registry.js';

const camera = {
  id: 'living_room',
  name: '客厅摄像头',
  host: '192.168.1.100',
  username: 'admin',
  password: 'secret'
};

describe('validateCameraConfig', () => {
  it('accepts multiple cameras', () => {
    const config = validateCameraConfig({
      cameras: [camera, { ...camera, id: 'garage', host: '192.168.1.101' }]
    });

    expect(config.cameras).toHaveLength(2);
  });

  it.each([
    [{ cameras: [] }, 'non-empty array'],
    [{ cameras: [{ ...camera, id: 'living room' }] }, 'invalid id'],
    [{ cameras: [camera, { ...camera }] }, 'duplicate id'],
    [{ cameras: [{ ...camera, host: 'http://192.168.1.100' }] }, 'must not include'],
    [{ cameras: [{ ...camera, password: '  ' }] }, 'password must be a non-empty string']
  ])('rejects invalid configuration %#', (config, message) => {
    expect(() => validateCameraConfig(config)).toThrow(message);
  });
});

describe('loadCameraConfig', () => {
  it('reads and validates a JSON configuration file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tplink-ipc-'));
    const path = join(directory, 'cameras.json');
    await writeFile(path, JSON.stringify({ cameras: [camera] }));

    await expect(loadCameraConfig(path)).resolves.toEqual({ cameras: [camera] });
  });

  it('reports invalid JSON without exposing file contents', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'tplink-ipc-'));
    const path = join(directory, 'cameras.json');
    await writeFile(path, '{"password":"do-not-log"');

    await expect(loadCameraConfig(path)).rejects.toThrow('Camera configuration is not valid JSON');
  });
});

describe('createCameraRegistry', () => {
  it('creates one reusable client per camera id', () => {
    const created = [];
    const Client = class {
      constructor(host, username, password) {
        created.push({ host, username, password });
      }
    };

    const registry = createCameraRegistry({ cameras: [camera] }, Client);

    expect(registry.get('living_room')).toBe(registry.get('living_room'));
    expect(created).toEqual([{ host: camera.host, username: camera.username, password: camera.password }]);
  });
});
