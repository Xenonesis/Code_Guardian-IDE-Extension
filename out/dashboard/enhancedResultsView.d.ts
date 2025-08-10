/**
 * Enhanced Results View - Detailed and beautiful analysis results interface
 */
import * as vscode from 'vscode';
export interface DetailedVulnerability {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    line?: number;
    column?: number;
    file?: string;
}
export interface DetailedSecret {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    line?: number;
    column?: number;
    file?: string;
    confidence: number;
}
export interface DetailedQualityIssue {
    type: string;
    severity: 'INFO' | 'WARNING' | 'ERROR';
    message: string;
    line?: number;
    column?: number;
    file?: string;
}
export interface DetailedAnalysisResult {
    vulnerabilities: DetailedVulnerability[];
    secrets: DetailedSecret[];
    qualityIssues: DetailedQualityIssue[];
    suggestions: string[];
    timestamp: string;
    filePath?: string;
}
export declare class EnhancedResultsView {
    private panel;
    private context;
    constructor(context: vscode.ExtensionContext);
    showResults(results: DetailedAnalysisResult): void;
    private generateResultsHtml;
    dispose(): void;
}
//# sourceMappingURL=enhancedResultsView.d.ts.map