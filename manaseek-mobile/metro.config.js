const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
// Pure JS calculations are shared with Vite without coupling native UI to web UI.
config.watchFolders = [path.resolve(__dirname, "../packages")];
module.exports = config;
