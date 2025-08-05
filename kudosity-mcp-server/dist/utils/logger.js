import winston from 'winston';
const logLevel = process.env.LOG_LEVEL || 'info.js';
export const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        return JSON.stringify({
            timestamp,
            level,
            message,
            service: service || 'kudosity-mcp-server',
            ...meta
        });
    })),
    defaultMeta: { service: 'kudosity-mcp-server' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple())
        })
    ]
});
export default logger;
//# sourceMappingURL=logger.js.map