/**
 * Performance monitoring utility for Guardian Security extension
 */
export interface PerformanceMetrics {
    operation: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
    error?: string;
    metadata?: any;
}
export declare class PerformanceMonitor {
    private static instance;
    private metrics;
    private maxMetrics;
    private constructor();
    static getInstance(): PerformanceMonitor;
    startOperation(operation: string): string;
    endOperation(operationId: string, operation: string, success?: boolean, error?: string, metadata?: any): void;
    measureAsync<T>(operation: string, fn: () => Promise<T>, metadata?: any): Promise<T>;
    measure<T>(operation: string, fn: () => T, metadata?: any): T;
    getMetrics(): PerformanceMetrics[];
    getMetricsByOperation(operation: string): PerformanceMetrics[];
    getAverageTime(operation: string): number;
    getSuccessRate(operation: string): number;
    generateReport(): string;
    clearMetrics(): void;
    private addMetric;
    private extractStartTimeFromId;
}
export declare const perfMonitor: PerformanceMonitor;
export declare function measureChatbotResponse<T>(fn: () => Promise<T>): Promise<T>;
export declare function measureAnalysis<T>(analysisType: string, fn: () => Promise<T>): Promise<T>;
export declare function measureWebviewOperation<T>(operation: string, fn: () => T): T;
//# sourceMappingURL=performanceMonitor.d.ts.map