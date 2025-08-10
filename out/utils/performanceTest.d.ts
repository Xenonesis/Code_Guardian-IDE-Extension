/**
 * Performance test utility for Guardian Security extension
 */
export declare class PerformanceTest {
    private securityAnalysis;
    private codeQuality;
    private secretDetection;
    private aiProvider;
    runPerformanceTests(): Promise<void>;
    private testSecurityAnalysis;
    private testCodeQuality;
    private testSecretDetection;
    private testAiProvider;
    private testCachePerformance;
    private getSmallCodeSample;
    private getMediumCodeSample;
    private getLargeCodeSample;
    private getComplexCodeSample;
}
export declare const performanceTest: PerformanceTest;
//# sourceMappingURL=performanceTest.d.ts.map