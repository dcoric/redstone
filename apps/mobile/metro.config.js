const { getDefaultConfig } = require('expo/metro-config');

// SDK 52+ automatically configures monorepo support
const config = getDefaultConfig(__dirname);

module.exports = config;
