import { Injectable } from '@nestjs/common';
import path from 'node:path';

export type AppEnvironment = 'development' | 'test' | 'production';
export type AppLogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

export interface AppConfig {
  environment: AppEnvironment;
  host: string;
  port: number;
  logLevel: AppLogLevel;
  rulesDataDir: string;
}

export function loadAppConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const environment = normalizeEnvironment(env.NODE_ENV);
  const port = parsePort(env.PORT);
  const host = normalizeHost(env.HOST);
  const logLevel = normalizeLogLevel(env.LOG_LEVEL, environment);
  const rulesDataDir = normalizeRulesDataDir(env.RULES_DATA_DIR);

  return {
    environment,
    host,
    port,
    logLevel,
    rulesDataDir
  };
}

@Injectable()
export class AppConfigService {
  readonly config = loadAppConfig();

  get environment(): AppEnvironment {
    return this.config.environment;
  }

  get host(): string {
    return this.config.host;
  }

  get port(): number {
    return this.config.port;
  }

  get logLevel(): AppLogLevel {
    return this.config.logLevel;
  }

  get rulesDataDir(): string {
    return this.config.rulesDataDir;
  }
}

function normalizeEnvironment(value: string | undefined): AppEnvironment {
  const environment = value ?? 'development';
  if (environment === 'development' || environment === 'test' || environment === 'production') {
    return environment;
  }

  throw new Error(
    `Invalid NODE_ENV "${String(value)}". Expected one of: development, test, production.`
  );
}

function parsePort(value: string | undefined): number {
  if (value == null || value === '') {
    return 3100;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT "${value}". Expected an integer between 1 and 65535.`);
  }

  return port;
}

function normalizeHost(value: string | undefined): string {
  const host = value?.trim() || '0.0.0.0';
  if (!host) {
    throw new Error('Invalid HOST. Expected a non-empty string.');
  }

  return host;
}

function normalizeLogLevel(
  value: string | undefined,
  environment: AppEnvironment
): AppLogLevel {
  if (value == null || value === '') {
    return environment === 'test' ? 'silent' : 'info';
  }

  if (value === 'silent' || value === 'error' || value === 'warn' || value === 'info' || value === 'debug') {
    return value;
  }

  throw new Error(
    `Invalid LOG_LEVEL "${String(value)}". Expected one of: silent, error, warn, info, debug.`
  );
}

function normalizeRulesDataDir(value: string | undefined): string {
  const configured = value?.trim();
  if (configured) {
    return path.resolve(process.cwd(), configured);
  }

  return path.resolve(process.cwd(), '..', 'data', '5etools', '5e-2024');
}
