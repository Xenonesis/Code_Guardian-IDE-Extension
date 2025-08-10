export declare class SecurityAnalysis {
    private vulnerabilities;
    private cache;
    private readonly maxCacheSize;
    private readonly securityPatterns;
    analyzeSecurity(code: string): Promise<string[]>;
    private hashCode;
    private cacheResult;
    clearCache(): void;
    private extractVulnerabilities;
    getVulnerabilitiesBySeverity(): {
        high: string[];
        medium: string[];
        low: string[];
    };
    getVulnerabilities(): string[];
}
//# sourceMappingURL=securityAnalysis.d.ts.map