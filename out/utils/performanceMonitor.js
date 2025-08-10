"use strict";
/**
 * Performance monitoring utility for Guardian Security extension
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.measureWebviewOperation = exports.measureAnalysis = exports.measureChatbotResponse = exports.perfMonitor = exports.PerformanceMonitor = void 0;
class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.maxMetrics = 100; // Limit stored metrics to prevent memory issues
    }
    static getInstance() {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    startOperation(operation) {
        const operationId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return operationId;
    }
    endOperation(operationId, operation, success = true, error, metadata) {
        try {
            const endTime = Date.now();
            const startTime = this.extractStartTimeFromId(operationId);
            const metric = {
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
        }
        catch (err) {
            console.error('Error recording performance metric:', err);
        }
    }
    async measureAsync(operation, fn, metadata) {
        const operationId = this.startOperation(operation);
        try {
            const result = await fn();
            this.endOperation(operationId, operation, true, undefined, metadata);
            return result;
        }
        catch (error) {
            this.endOperation(operationId, operation, false, error instanceof Error ? error.message : 'Unknown error', metadata);
            throw error;
        }
    }
    measure(operation, fn, metadata) {
        const operationId = this.startOperation(operation);
        try {
            const result = fn();
            this.endOperation(operationId, operation, true, undefined, metadata);
            return result;
        }
        catch (error) {
            this.endOperation(operationId, operation, false, error instanceof Error ? error.message : 'Unknown error', metadata);
            throw error;
        }
    }
    getMetrics() {
        return [...this.metrics];
    }
    getMetricsByOperation(operation) {
        return this.metrics.filter(m => m.operation === operation);
    }
    getAverageTime(operation) {
        const operationMetrics = this.getMetricsByOperation(operation);
        if (operationMetrics.length === 0) {
            return 0;
        }
        const totalTime = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
        return totalTime / operationMetrics.length;
    }
    getSuccessRate(operation) {
        const operationMetrics = this.getMetricsByOperation(operation);
        if (operationMetrics.length === 0) {
            return 0;
        }
        const successCount = operationMetrics.filter(m => m.success).length;
        return (successCount / operationMetrics.length) * 100;
    }
    generateReport() {
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
    clearMetrics() {
        this.metrics = [];
    }
    addMetric(metric) {
        this.metrics.push(metric);
        // Limit stored metrics to prevent memory issues
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
    }
    extractStartTimeFromId(operationId) {
        try {
            const parts = operationId.split('_');
            return parseInt(parts[1], 10);
        }
        catch {
            return Date.now(); // Fallback
        }
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
// Convenience functions for common operations
exports.perfMonitor = PerformanceMonitor.getInstance();
function measureChatbotResponse(fn) {
    return exports.perfMonitor.measureAsync('chatbot_response', fn);
}
exports.measureChatbotResponse = measureChatbotResponse;
function measureAnalysis(analysisType, fn) {
    return exports.perfMonitor.measureAsync(`analysis_${analysisType}`, fn);
}
exports.measureAnalysis = measureAnalysis;
function measureWebviewOperation(operation, fn) {
    return exports.perfMonitor.measure(`webview_${operation}`, fn);
}
exports.measureWebviewOperation = measureWebviewOperation;
//# sourceMappingURL=performanceMonitor.js.map