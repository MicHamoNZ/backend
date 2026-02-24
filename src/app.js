'use strict';

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const healthRouter = require('./routes/health.routes');
const dbHealthRouter = require('./routes/dbHealth.routes');
const apiRouter = require('./routes');

const app = express();

// Middleware — order mandated by constitution (Principles I & IV)
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Feature routes (after body parsers, before error handler)
app.use('/api/health', healthRouter);
app.use('/api/db-health', dbHealthRouter);
app.use('/api', apiRouter); // versioned routes (e.g. /api/v1/status)


// 4-arg error handler (LAST middleware — per constitution Principle IV)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;


