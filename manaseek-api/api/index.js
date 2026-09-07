/**
 * Vercel serverless entrypoint.
 *
 * Imports from `dist` rather than `src` on purpose: `nest build` rewrites the
 * `@/…` path aliases into relative requires, and nothing else does. The build
 * runs first (see vercel.json), and `includeFiles` ships dist with the
 * function.
 *
 * The Nest app is created once per warm instance and reused, so only a cold
 * start pays for bootstrapping.
 */
const express = require('express');
const { NestFactory } = require('@nestjs/core');
const { ExpressAdapter } = require('@nestjs/platform-express');

const { AppModule } = require('../dist/app.module');
const { AppConfigService } = require('../dist/common/config/config.service');

const server = express();
let bootstrapPromise = null;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bufferLogs: false,
  });

  const config = app.get(AppConfigService);
  app.setGlobalPrefix(config.get('API_PREFIX'));
  app.enableCors({ origin: config.corsOrigins, credentials: true });

  // init(), not listen(): Vercel owns the HTTP server.
  await app.init();
}

module.exports = async (req, res) => {
  bootstrapPromise ??= bootstrap();
  await bootstrapPromise;
  server(req, res);
};
