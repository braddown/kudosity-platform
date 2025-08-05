import { KudosityConfig } from '../types/index.js';
declare class ConfigManager {
    private config;
    constructor();
    private loadConfig;
    private validateConfig;
    getConfig(): KudosityConfig;
}
export declare const configManager: ConfigManager;
export default configManager;
//# sourceMappingURL=config.d.ts.map