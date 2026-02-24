'use strict';

const assert = require('assert');
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/v1/status', function () {
  it('should return HTTP 200 with the correct status body', async function () {
    const response = await request(app)
      .get('/api/v1/status')
      .expect(200);

    // success flag
    assert.strictEqual(response.body.success, true);

    // human-readable message
    assert.strictEqual(response.body.message, 'API v1 status OK');

    // API version
    assert.strictEqual(response.body.version, 'v1');

    // timestamp must exist and be a string
    assert.ok(response.body.timestamp, 'timestamp should be present');
    assert.strictEqual(typeof response.body.timestamp, 'string');
  });
});

