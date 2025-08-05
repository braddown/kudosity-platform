import { logger } from './logger.js';
class ConfigManager {
    config;
    constructor() {
        this.config = this.loadConfig();
        this.validateConfig();
    }
    loadConfig() {
        const config = {
            apiKey: process.env.KUDOSITY_API_KEY || '',
            defaultSender: process.env.KUDOSITY_DEFAULT_SENDER || '',
            logLevel: process.env.LOG_LEVEL || 'info',
            timeout: parseInt(process.env.KUDOSITY_TIMEOUT || '30000'),
            retryAttempts: parseInt(process.env.KUDOSITY_RETRY_ATTEMPTS || '3')
        };
        logger.info('Configuration loaded', {
            hasApiKey: !!config.apiKey,
            hasDefaultSender: !!config.defaultSender,
            defaultSender: config.defaultSender || 'Not set',
            logLevel: config.logLevel,
            timeout: config.timeout,
            retryAttempts: config.retryAttempts
        });
        return config;
    }
    validateConfig() {
        if (!this.config.apiKey) {
            throw new Error('KUDOSITY_API_KEY environment variable is required');
        }
        if (this.config.timeout && this.config.timeout < 1000) {
            logger.warn('Timeout is very low, this may cause request failures');
        }
        if (this.config.retryAttempts && this.config.retryAttempts > 5) {
            logger.warn('High retry attempts may cause delays');
        }
    }
    getConfig() {
        return { ...this.config };
    }
}
// Export singleton instance
export const configManager = new ConfigManager();
export default configManager;
//# sourceMappingURL=config.js.map