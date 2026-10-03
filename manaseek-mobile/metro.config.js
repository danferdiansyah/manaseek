const path = require("node:path");
const { createHash } = require("node:crypto");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
// Pure JS calculations are shared with Vite without coupling native UI to web UI.
config.watchFolders = [path.resolve(__dirname, "../packages")];
// Release builds run in CI mode, where Expo retains the transform cache.
// Invalidate it when public values embedded in the JavaScript bundle change.
const publicEnvironment = Object.entries(process.env)
  .filter(([key]) => key.startsWith("EXPO_PUBLIC_"))
  .sort(([a], [b]) => a.localeCompare(b));
config.cacheVersion = `${config.cacheVersion ?? ""}:${createHash("sha256")
  .update(JSON.stringify(publicEnvironment))
  .digest("hex")}`;
module.exports = config;
