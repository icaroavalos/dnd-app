export type AppEnvironment = 'development' | 'test' | 'production';
export type AppLogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';
export interface AppConfig {
    environment: AppEnvironment;
    host: string;
    port: number;
    logLevel: AppLogLevel;
    rulesDataDir: string;
}
export declare function loadAppConfig(env?: NodeJS.ProcessEnv): AppConfig;
export declare class AppConfigService {
    readonly config: AppConfig;
    get environment(): AppEnvironment;
    get host(): string;
    get port(): number;
    get logLevel(): AppLogLevel;
    get rulesDataDir(): string;
}
//# sourceMappingURL=app-config.d.ts.map