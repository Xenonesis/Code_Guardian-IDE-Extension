export declare class AiProvider {
    private apiUrl;
    private cache;
    private readonly maxCacheSize;
    private requestQueue;
    private isProcessing;
    constructor(apiUrl?: string);
    getSuggestions(code: string): Promise<string[]>;
    private generateSmartSuggestions;
    analyzeCode(code: string): Promise<any>;
    private calculateComplexity;
    private calculateMaintainability;
    private hashCode;
    private cacheResult;
    clearCache(): void;
}
//# sourceMappingURL=aiProvider.d.ts.map