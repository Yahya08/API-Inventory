const { notFound, errorHandler } = require('./middlewares/errorHandler');

const express = require('express');
const helmet = require('helmet');

const app = express();

app.use(helmet());
app.use(express.json({ limit: '100kb' }));

// Endpoint uji kesehatan server
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', require('./modules/auth/auth.routes'));
app.use('/items', require('./modules/items/items.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
