'use strict';

const assert = require('assert');
const request = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');

// Test suite for user-related endpoints

// ---------------------------------------------------------------------------------------------------------------------
// Tests for the Users resource - GET /api/v1/users
// ---------------------------------------------------------------------------------------------------------------------
describe('Users API', function() {
    // ---------------------------------------------------------------------------------------------------------------
    // GET /api/v1/users - should return a list of all users
    // ---------------------------------------------------------------------------------------------------------------
    describe('GET /api/v1/users', function() {
        let getUsersResponse;

        before(async () => {
            getUsersResponse = await request(app).get('/api/v1/users');
        });

        it('should return HTTP 200', async function() {
            assert.strictEqual(getUsersResponse.status, 200);
        });

        it('should have success: true', async function() {
            assert.strictEqual(getUsersResponse.body.success, true);
        });

        it('should have a numeric count', async function() {
            assert.strictEqual(typeof getUsersResponse.body.count, 'number');
        });

        it('should have a data array', async function () {
            assert.ok(Array.isArray(getUsersResponse.body.data));
        });

        it('should have at least 1 user in data', async function () {
            assert.ok(getUsersResponse.body.data.length > 0);
        });
    });

    // -------------------------------------------------------------------------
    // GET /api/v1/users/1 – get a single user that exists
    // -------------------------------------------------------------------------
    describe('GET /api/v1/users/1', function() {
        let getUserByIdResponse;

        before(async () => {
            getUserByIdResponse = await request(app).get('/api/v1/users/1');
        });

        it('should return HTTP 200', async function () {
            assert.strictEqual(getUserByIdResponse.status, 200);
        });

        it('should have success: true', async function () {
            assert.strictEqual(getUserByIdResponse.body.success, true);
        });

        it('should have a data object', async function () {
            assert.ok(getUserByIdResponse.body.data);
        });

        it('should have id equal to 1', async function () {
            assert.strictEqual(getUserByIdResponse.body.data.id, 1);
        });

        it('should have a name property', async function () {
            assert.ok(getUserByIdResponse.body.data.name);
        });

        it('should have an email property', async function () {
            assert.ok(getUserByIdResponse.body.data.email);
        });

        it('should have a role property', async function () {
            assert.ok(getUserByIdResponse.body.data.role);
        });
    });

    // -------------------------------------------------------------------------
    // GET /api/v1/users/999 – get a user that does NOT exist
    // -------------------------------------------------------------------------
    describe('GET /api/v1/users/999', function(){
        let getNonExistentUserResponse;

        before(async () => {
            getNonExistentUserResponse = await request(app).get('/api/v1/users/999');
        });

        it('should return HTTP 404', async function () {
            assert.strictEqual(getNonExistentUserResponse.status, 404);
        });

        it('should have success: false', async function () {
            assert.strictEqual(getNonExistentUserResponse.body.success, false);
        });

        it('should have message "User not found"', async function () {
            assert.strictEqual(getNonExistentUserResponse.body.message, 'User not found');
        });
    });
});