import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.code',
  'req.body.password',
  'req.body.refreshToken',
];

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        genReqId: (req: IncomingMessage, res: ServerResponse) => {
          const existing = req.headers['x-request-id'];
          const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
        autoLogging: {
          ignore: (req: IncomingMessage) => req.url === '/api/health' || req.url === '/health',
        },
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true, translateTime: 'HH:MM:ss' } },
      },
    }),
  ],
})
export class LoggerModule {}
