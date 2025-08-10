export interface ScanResult {
    filePath: string;
    vulnerabilities: string[];
    secrets: string[];
    qualityIssues: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface WorkspaceScanOptions {
    includePatterns?: string[];
    excludePatterns?: string[];
    maxFileSize?: number;
    enableRealTimeScanning?: boolean;
    scanDepth?: number;
}
export declare class WorkspaceScanner {
    private securityAnalysis;
    private secretDetection;
    private codeQuality;
    private fileWatcher;
    private scanResults;
    private diagnosticCollection;
    private isScanning;
    private scanProgress;
    constructor();
    private setupFileWatcher;
    scanWorkspace(options?: WorkspaceScanOptions): Promise<ScanResult[]>;
    private scanFolder;
    private getFilesToScan;
    scanFile(filePath: string): Promise<ScanResult | null>;
    private calculateSeverity;
    private updateFileDiagnostics;
    private getSeverityLevel;
    private updateAllDiagnostics;
    private updateAllDiagnosticsBatched;
    private hasIssues;
    private clearFileResults;
    getScanResults(): Map<string, ScanResult>;
    clearAllResults(): void;
    dispose(): void;
}
//# sourceMappingURL=workspaceScanner.d.ts.map