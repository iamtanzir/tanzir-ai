"use strict";

const { backendName } = require("../lib/learn-store");

/**
 * /api/health — lets the browser discover whether cloud "Learn" sync is on.
 * Returns no secrets: just the backend name, so the UI can show a status.
 */
module.exports = async function handler(req, res) {
  const backend = backendName();
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(
    JSON.stringify({
      ok: true,
      learn: { enabled: Boolean(backend), backend: backend || null },
      time: new Date().toISOString(),
    })
  );
};
