import { registerAs } from '@nestjs/config';

export const tokaConfig = registerAs('toka', () => ({
  baseUrl: process.env.TOKA_BASE_URL,
  appId: process.env.TOKA_APP_ID,
}));
