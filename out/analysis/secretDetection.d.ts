import { AnalysisResult } from '../types/index';
export declare class SecretDetection {
    private detectedSecrets;
    private cache;
    private readonly maxCacheSize;
    private readonly secretPatterns;
    detectSecrets(code: string): Promise<string[]>;
    getDetectedSecrets(): AnalysisResult;
    private maskSensitiveData;
    private getSeverityLevel;
    getSecretsBySeverity(): {
        critical: string[];
        high: string[];
        medium: string[];
        low: string[];
    };
    private hashCode;
    private cacheResult;
    clearCache(): void;
}
//# sourceMappingURL=secretDetection.d.ts.map