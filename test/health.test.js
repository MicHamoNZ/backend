'use strict';

const request = require('supertest');
const { expect } = require('chai');

// Import app — NEVER src/server.js (constitution Principle II)
const app = require('../src/app');

describe('GET /health', () => {
  let res;

  before(async () => {
    res = await request(app).get('/health');
  });

  it('1. responds with HTTP 200', () => {
    expect(res.status).to.equal(200);
  });

  it('2. Content-Type contains application/json', () => {
    expect(res.headers['content-type']).to.include('application/json');
  });

  it('3. res.body.status strictly equals "ok"', () => {
    expect(res.body.status).to.equal('ok');
  });

  it('4. res.body.timestamp is a string parseable as a valid Date', () => {
    expect(res.body.timestamp).to.be.a('string');
    const d = new Date(res.body.timestamp);
    expect(d.toString()).to.not.equal('Invalid Date');
  });

  it('5. res.body.uptimeSeconds is a non-negative integer', () => {
    expect(Number.isInteger(res.body.uptimeSeconds)).to.equal(true);
    expect(res.body.uptimeSeconds).to.be.at.least(0);
  });

  it('6. res.body.version is a non-empty string matching package.json version', () => {
    expect(res.body.version).to.be.a('string');
    expect(res.body.version.length).to.be.greaterThan(0);
    // US2: version field must reflect the deployed package.json version
    expect(res.body.version).to.equal(require('../package.json').version);
  });

  it('7. request without Authorization header still returns 200', async () => {
    const r = await request(app).get('/health');
    expect(r.status).to.equal(200);
  });
});


