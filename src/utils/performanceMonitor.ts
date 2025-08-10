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

export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetrics[] = [];
    private maxMetrics = 100; // Limit stored metrics to prevent memory issues

    private constructor() {}

    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    public startOperation(operation: string): string {
        const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return operationId;
    }

    public endOperation(operationId: string, operation: string, success: boolean = true, error?: string, metadata?: any): void {
        try {
            const endTime = Date.now();
            const startTime = this.extractStartTimeFromId(operationId);
            
            const metric: PerformanceMetrics = {
                operation,
                startTime,
                endTime,
                duration: endTime - startTime,
                success,
                error,
                metadata
            };

            this.addMetric(metric);
            
            // Log performance warnings
            if (metric.duration > 5000) {
                console.warn(`Slow operation detected: ${operation} took ${metric.duration}ms`);
            }
            
            if (!success && error) {
                console.error(`Operation failed: ${operation} - ${error}`);
            }
        } catch (err) {
            console.error('Error recording performance metric:', err);
        }
    }

    public async measureAsync<T>(operation: string, fn: () => Promise<T>, metadata?: any): Promise<T> {
        const operationId = this.startOperation(operation);
        try {
            const result = await fn();
            this.endOperation(operationId, operation, true, undefined, metadata);
            return result;
        } catch (error) {
            this.endOperation(operationId, operation, false, error instanceof Error ? error.message : 'Unknown error', metadata);
            throw error;
        }
    }

    public measure<T>(operation: string, fn: () => T, metadata?: any): T {
        const operationId = this.startOperation(operation);
        try {
            const result = fn();
            this.endOperation(operationId, operation, true, undefined, metadata);
            return result;
        } catch (error) {
            this.endOperation(operationId, operation, false, error instanceof Error ? error.message : 'Unknown error', metadata);
            throw error;
        }
    }

    public getMetrics(): PerformanceMetrics[] {
        return [...this.metrics];
    }

    public getMetricsByOperation(operation: string): PerformanceMetrics[] {
        return this.metrics.filter(m => m.operation === operation);
    }

    public getAverageTime(operation: string): number {
        const operationMetrics = this.getMetricsByOperation(operation);
        if (operationMetrics.length === 0) {
            return 0;
        }
        
        const totalTime = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
        return totalTime / operationMetrics.length;
    }

    public getSuccessRate(operation: string): number {
        const operationMetrics = this.getMetricsByOperation(operation);
        if (operationMetrics.length === 0) {
            return 0;
        }
        
        const successCount = operationMetrics.filter(m => m.success).length;
        return (successCount / operationMetrics.length) * 100;
    }

    public generateReport(): string {
        const operations = [...new Set(this.metrics.map(m => m.operation))];
        
        let report = '# Guardian Security Performance Report\n\n';
        report += `Generated: ${new Date().toISOString()}\n`;
        report += `Total Operations: ${this.metrics.length}\n\n`;

        for (const operation of operations) {
            const metrics = this.getMetricsByOperation(operation);
            const avgTime = this.getAverageTime(operation);
            const successRate = this.getSuccessRate(operation);
            const totalRuns = metrics.length;
            const failures = metrics.filter(m => !m.success).length;

            report += `## ${operation}\n`;
            report += `- Total Runs: ${totalRuns}\n`;
            report += `- Average Time: ${avgTime.toFixed(2)}ms\n`;
            report += `- Success Rate: ${successRate.toFixed(1)}%\n`;
            report += `- Failures: ${failures}\n`;

            if (failures > 0) {
                const errors = metrics.filter(m => !m.success && m.error);
                const uniqueErrors = [...new Set(errors.map(m => m.error))];
                report += `- Common Errors: ${uniqueErrors.join(', ')}\n`;
            }

            report += '\n';
        }

        return report;
    }

    public clearMetrics(): void {
        this.metrics = [];
    }

    private addMetric(metric: PerformanceMetrics): void {
        this.metrics.push(metric);
        
        // Limit stored metrics to prevent memory issues
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    }

    private extractStartTimeFromId(operationId: string): number {
        try {
            const parts = operationId.split('_');
            return parseInt(parts[1], 10);
        } catch {
            return Date.now(); // Fallback
        }
    }
}

// Convenience functions for common operations
export const perfMonitor = PerformanceMonitor.getInstance();

export function measureChatbotResponse<T>(fn: () => Promise<T>): Promise<T> {
    return perfMonitor.measureAsync('chatbot_response', fn);
}

export function measureAnalysis<T>(analysisType: string, fn: () => Promise<T>): Promise<T> {
    return perfMonitor.measureAsync(`analysis_${analysisType}`, fn);
}

export function measureWebviewOperation<T>(operation: string, fn: () => T): T {
    return perfMonitor.measure(`webview_${operation}`, fn);
}