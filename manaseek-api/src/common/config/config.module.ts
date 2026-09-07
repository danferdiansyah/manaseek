import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';
import { validateEnv } from './configuration';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
