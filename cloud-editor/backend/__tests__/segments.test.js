const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');

const setupApp = async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'segments-'));
  process.env.SEGMENTS_PATH = tempDir;
  const serverModule = require('../server');

  const findRoute = (method, routePath) => {
    const layer = serverModule.app._router.stack.find(
      (candidate) => candidate.route && candidate.route.path === routePath && candidate.route.methods[method]
    );

    if (!layer) {
      throw new Error(`Route ${method.toUpperCase()} ${routePath} not found`);
    }

    return layer.route.stack[0].handle;
  };

  const invokeRoute = async ({ method, routePath, params = {}, body = {} }) => {
    const handler = findRoute(method, routePath);

    return new Promise((resolve, reject) => {
      const responsePayload = { statusCode: 200, body: undefined };
      const req = { params, body };
      const res = {
        status(code) {
          responsePayload.statusCode = code;
          return this;
        },
        json(payload) {
          responsePayload.body = payload;
          resolve(responsePayload);
        },
      };

      try {
        const maybePromise = handler(req, res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(responsePayload);
          }
        });

        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.catch(reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  return {
    app: serverModule.app,
    segmentsDir: tempDir,
    invokeRoute,
    cleanup: async () => {
      await fs.remove(tempDir);
      delete process.env.SEGMENTS_PATH;
      delete require.cache[require.resolve('../server')];
    },
  };
};

test('creating a segment persists to disk with normalized id', async (t) => {
  const { invokeRoute, segmentsDir, cleanup } = await setupApp();
  t.after(cleanup);

  const { statusCode, body } = await invokeRoute({
    method: 'post',
    routePath: '/api/segments',
    body: { id: 'morning-show', name: 'Morning Show', duration: 120 },
  });

  assert.equal(statusCode, 200);
  assert.equal(body.id, 'morning-show');
  assert.ok(await fs.pathExists(path.join(segmentsDir, 'morning-show.json')));
});

test('invalid ids are rejected for read and write operations', async (t) => {
  const { invokeRoute, cleanup } = await setupApp();
  t.after(cleanup);

  const readAttempt = await invokeRoute({
    method: 'get',
    routePath: '/api/segments/:id',
    params: { id: '../etc/passwd' },
  });
  assert.equal(readAttempt.statusCode, 400);

  const writeAttempt = await invokeRoute({
    method: 'post',
    routePath: '/api/segments',
    body: { id: '../etc/passwd' },
  });
  assert.equal(writeAttempt.statusCode, 400);
});

test('segment listing ignores filenames that do not match the allow-list', async (t) => {
  const { invokeRoute, segmentsDir, cleanup } = await setupApp();
  t.after(cleanup);

  const invalidPath = path.join(segmentsDir, '../invalid.json');
  await fs.writeJson(path.join(segmentsDir, 'valid.json'), { id: 'valid' });
  await fs.writeJson(invalidPath, { id: 'invalid' });

  const listResponse = await invokeRoute({ method: 'get', routePath: '/api/segments' });
  assert.equal(listResponse.statusCode, 200);
  assert.deepEqual(listResponse.body.map((segment) => segment.id), ['valid']);
  await fs.remove(invalidPath);
});
