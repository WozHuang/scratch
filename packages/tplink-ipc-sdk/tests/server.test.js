import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TPIPCApiError } from '../src/api.js';
import { createApp } from '../src/server/app.js';

const API_TOKEN = 'test-api-token';
let client;
let request;
let logger;

beforeEach(async () => {
  client = {
    getLensMaskStatus: vi.fn().mockResolvedValue(false),
    setLensMaskOn: vi.fn().mockResolvedValue({}),
    setLensMaskOff: vi.fn().mockResolvedValue({})
  };
  const cameras = new Map([['living_room', client]]);
  logger = { error: vi.fn() };
  const app = createApp({ cameras, apiToken: API_TOKEN, logger });
  request = supertest(app);
});

describe('HTTP service', () => {
  it('reports health without contacting cameras or requiring authentication', async () => {
    const response = await request.get('/healthz');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', cameraCount: 1 });
    expect(client.getLensMaskStatus).not.toHaveBeenCalled();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('requires a valid bearer token for camera routes', async () => {
    const missing = await request.get('/api/cameras/living_room/lens-mask');
    const invalid = await request.get('/api/cameras/living_room/lens-mask').set('Authorization', 'Bearer wrong');

    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
  });

  it('returns the current lens mask state', async () => {
    client.getLensMaskStatus.mockResolvedValue(true);

    const response = await request
      .get('/api/cameras/living_room/lens-mask')
      .set('Authorization', `Bearer ${API_TOKEN}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ cameraId: 'living_room', enabled: true });
  });

  it.each([
    [true, 'setLensMaskOn'],
    [false, 'setLensMaskOff']
  ])('sets enabled=%s and returns the confirmed state', async (enabled, method) => {
    client.getLensMaskStatus.mockResolvedValue(enabled);

    const response = await request
      .post('/api/cameras/living_room/lens-mask')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send({ enabled });

    expect(response.status).toBe(200);
    expect(client[method]).toHaveBeenCalledOnce();
    expect(client.getLensMaskStatus).toHaveBeenCalledOnce();
    expect(response.body).toEqual({ cameraId: 'living_room', enabled });
  });

  it.each([{ enabled: 'true' }, {}, { enabled: null }])('rejects invalid state payload %j', async (body) => {
    const response = await request
      .post('/api/cameras/living_room/lens-mask')
      .set('Authorization', `Bearer ${API_TOKEN}`)
      .send(body);

    expect(response.status).toBe(400);
    expect(client.setLensMaskOn).not.toHaveBeenCalled();
    expect(client.setLensMaskOff).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown camera', async () => {
    const response = await request.get('/api/cameras/unknown/lens-mask').set('Authorization', `Bearer ${API_TOKEN}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ error: { code: 'CAMERA_NOT_FOUND' } });
  });

  it.each([
    [-40404, 409, 'CAMERA_LOCKED'],
    [null, 504, 'CAMERA_TIMEOUT'],
    [-1, 502, 'CAMERA_ERROR']
  ])('maps camera error %# to HTTP errors', async (errorCode, status, code) => {
    const message = status === 504 ? 'Network error during request: timeout of 10000ms exceeded' : 'camera failed';
    client.getLensMaskStatus.mockRejectedValue(new TPIPCApiError(message, errorCode));

    const response = await request
      .get('/api/cameras/living_room/lens-mask')
      .set('Authorization', `Bearer ${API_TOKEN}`);

    expect(response.status).toBe(status);
    expect(response.body).toMatchObject({ error: { code } });
  });

  it('returns sanitized 500 errors', async () => {
    client.getLensMaskStatus.mockRejectedValue(new Error('password=do-not-expose'));

    const response = await request
      .get('/api/cameras/living_room/lens-mask')
      .set('Authorization', `Bearer ${API_TOKEN}`);
    const body = response.body;

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    expect(JSON.stringify(body)).not.toContain('do-not-expose');
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('do-not-expose');
  });
});
