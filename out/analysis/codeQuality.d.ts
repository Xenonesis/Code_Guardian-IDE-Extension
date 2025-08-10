import { QualityMetrics } from '../types';
export declare class CodeQuality {
    private cache;
    private readonly maxCacheSize;
    private readonly patterns;
    analyzeQuality(code: string): Promise<QualityMetrics>;
    getQualityMetrics(code: string): {
        qualityScore: number;
        issues: string[];
    };
    private calculateMetrics;
    private hashCode;
    private cacheResult;
    clearCache(): void;
}
//# sourceMappingURL=codeQuality.d.ts.map