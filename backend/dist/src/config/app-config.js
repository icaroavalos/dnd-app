var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import path from 'node:path';
export function loadAppConfig(env = process.env) {
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
let AppConfigService = class AppConfigService {
    config = loadAppConfig();
    get environment() {
        return this.config.environment;
    }
    get host() {
        return this.config.host;
    }
    get port() {
        return this.config.port;
    }
    get logLevel() {
        return this.config.logLevel;
    }
    get rulesDataDir() {
        return this.config.rulesDataDir;
    }
};
AppConfigService = __decorate([
    Injectable()
], AppConfigService);
export { AppConfigService };
function normalizeEnvironment(value) {
    const environment = value ?? 'development';
    if (environment === 'development' || environment === 'test' || environment === 'production') {
        return environment;
    }
    throw new Error(`Invalid NODE_ENV "${String(value)}". Expected one of: development, test, production.`);
}
function parsePort(value) {
    if (value == null || value === '') {
        return 3100;
    }
    const port = Number(value);
    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        throw new Error(`Invalid PORT "${value}". Expected an integer between 1 and 65535.`);
    }
    return port;
}
function normalizeHost(value) {
    const host = value?.trim() || '0.0.0.0';
    if (!host) {
        throw new Error('Invalid HOST. Expected a non-empty string.');
    }
    return host;
}
function normalizeLogLevel(value, environment) {
    if (value == null || value === '') {
        return environment === 'test' ? 'silent' : 'info';
    }
    if (value === 'silent' || value === 'error' || value === 'warn' || value === 'info' || value === 'debug') {
        return value;
    }
    throw new Error(`Invalid LOG_LEVEL "${String(value)}". Expected one of: silent, error, warn, info, debug.`);
}
function normalizeRulesDataDir(value) {
    const configured = value?.trim();
    if (configured) {
        return path.resolve(process.cwd(), configured);
    }
    return path.resolve(process.cwd(), '..', 'data', '5etools', '5e-2024');
}
//# sourceMappingURL=app-config.js.map