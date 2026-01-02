/**
 * Cloud Functions Entry Point
 */

const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp, applicationDefault } = require("firebase-admin/app");

initializeApp({
  credential: applicationDefault(),
});

const app = require("./app");

// Export a single "api" function that handles all routes
exports.api = onRequest({ region: "asia-northeast1" }, app);
