// server/index.js
// Vercel Serverless Function Entry Point for Express

const app = require('./src/server');

// Check if app exports the express instance (it should)
// If src/server.js starts the server with app.listen, we need to export app instead.
// Let's modify src/server.js to export 'app' and only listen if run directly.

module.exports = app;
