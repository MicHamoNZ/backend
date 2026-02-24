'use strict';

const request = require('supertest');
const { expect } = require('chai');

// Import app — never src/server.js
const app = require('../src/app');

describe('GET /health', () => {
  let res;

  before(async () => {
    res = await request(app).get('/api/health');
  });

  it('responds with HTTP 200', () => {
    expect(res.status).to.equal(200);
  });

  it('response.body.success equals true', () => {
    expect(res.body.success).to.equal(true);
  });

  it('response.body.message equals "OK"', () => {
    expect(res.body.message).to.equal('OK');
  });

  it('response.body.timestamp exists and is a string', () => {
    expect(res.body.timestamp).to.be.a('string');
  });
});
