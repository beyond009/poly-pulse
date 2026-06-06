export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };
let currentLevel: LogLevel = (process.env.PMXT_LOG_LEVEL as LogLevel) || 'warn';

function shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

export const logger = {
    debug(message: string, context?: Record<string, unknown>): void {
        if (!shouldLog('debug')) return;
        context ? console.debug(`[pmxt] ${message}`, context) : console.debug(`[pmxt] ${message}`);
    },
    info(message: string, context?: Record<string, unknown>): void {
        if (!shouldLog('info')) return;
        context ? console.info(`[pmxt] ${message}`, context) : console.info(`[pmxt] ${message}`);
    },
    warn(message: string, context?: Record<string, unknown>): void {
        if (!shouldLog('warn')) return;
        context ? console.warn(`[pmxt] ${message}`, context) : console.warn(`[pmxt] ${message}`);
    },
    error(message: string, context?: Record<string, unknown>): void {
        if (!shouldLog('error')) return;
        context ? console.error(`[pmxt] ${message}`, context) : console.error(`[pmxt] ${message}`);
    },
    setLevel(level: LogLevel): void { currentLevel = level; },
    getLevel(): LogLevel { return currentLevel; },
};
