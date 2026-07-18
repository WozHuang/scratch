import { timingSafeEqual } from 'node:crypto';
import express from 'express';
import { TPIPCApiError } from '../api.js';

function apiError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function tokenMatches(actual, expected) {
  if (typeof actual !== 'string' || typeof expected !== 'string') return false;
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function cameraErrorDetails(error) {
  if (!(error instanceof TPIPCApiError)) {
    return { status: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' };
  }
  if (error.errorCode === -40404) {
    return { status: 409, code: 'CAMERA_LOCKED', message: 'Camera is temporarily locked' };
  }
  if (/timeout|timed out/i.test(error.message)) {
    return { status: 504, code: 'CAMERA_TIMEOUT', message: 'Camera request timed out' };
  }
  return { status: 502, code: 'CAMERA_ERROR', message: 'Camera request failed' };
}

export function createApp({ cameras, apiToken, logger = console }) {
  if (!(cameras instanceof Map)) throw new Error('cameras must be a Map');
  if (typeof apiToken !== 'string' || apiToken.length === 0) throw new Error('API_TOKEN must be set');

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.get('/healthz', (_request, response) => {
    response.json({ status: 'ok', cameraCount: cameras.size });
  });

  app.use('/api', (request, response, next) => {
    const authorization = request.get('authorization');
    if (!authorization?.startsWith('Bearer ') || !tokenMatches(authorization.slice(7), apiToken)) {
      return next(apiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }
    next();
  });

  app.param('cameraId', (request, _response, next, cameraId) => {
    const camera = cameras.get(cameraId);
    if (!camera) return next(apiError(404, 'CAMERA_NOT_FOUND', 'Camera not found'));
    request.camera = camera;
    next();
  });

  app.get('/api/cameras/:cameraId/lens-mask', async (request, response, next) => {
    try {
      const enabled = await request.camera.getLensMaskStatus();
      response.json({ cameraId: request.params.cameraId, enabled });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/cameras/:cameraId/lens-mask', async (request, response, next) => {
    try {
      if (typeof request.body?.enabled !== 'boolean') {
        throw apiError(400, 'INVALID_REQUEST', 'enabled must be a boolean');
      }

      if (request.body.enabled) await request.camera.setLensMaskOn();
      else await request.camera.setLensMaskOff();

      const enabled = await request.camera.getLensMaskStatus();
      response.json({ cameraId: request.params.cameraId, enabled });
    } catch (error) {
      next(error);
    }
  });

  app.use((request, _response, next) => {
    next(apiError(404, 'NOT_FOUND', `Route not found: ${request.method} ${request.path}`));
  });

  app.use((error, _request, response, _next) => {
    let details;
    if (error?.type === 'entity.parse.failed' || error?.type === 'entity.too.large') {
      details = { status: 400, code: 'INVALID_REQUEST', message: 'Invalid JSON request body' };
    } else if (error?.status && error?.code) {
      details = { status: error.status, code: error.code, message: error.message };
    } else {
      details = cameraErrorDetails(error);
      logger.error('Request failed', { errorName: error?.name ?? 'UnknownError', code: details.code });
    }
    response.status(details.status).json({ error: { code: details.code, message: details.message } });
  });

  return app;
}
