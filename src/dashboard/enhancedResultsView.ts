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

export class EnhancedResultsView {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public showResults(results: DetailedAnalysisResult): void {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Two);
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'guardianEnhancedResults',
                '🛡️ Guardian Security - Detailed Results',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });
        }

        this.panel.webview.html = this.generateResultsHtml(results);
    }

    private generateResultsHtml(results: DetailedAnalysisResult): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guardian Security - Detailed Results</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: var(--vscode-sideBar-background);
            border-radius: 8px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background: var(--vscode-sideBar-background);
            border-radius: 8px;
        }
        .issue {
            margin: 10px 0;
            padding: 15px;
            border-left: 4px solid;
            border-radius: 4px;
        }
        .critical { border-left-color: #dc3545; background: rgba(220, 53, 69, 0.1); }
        .high { border-left-color: #fd7e14; background: rgba(253, 126, 20, 0.1); }
        .medium { border-left-color: #ffc107; background: rgba(255, 193, 7, 0.1); }
        .low { border-left-color: #28a745; background: rgba(40, 167, 69, 0.1); }
        .info { border-left-color: #17a2b8; background: rgba(23, 162, 184, 0.1); }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Guardian Security Analysis Results</h1>
        <p>Generated: ${results.timestamp}</p>
        ${results.filePath ? `<p>File: ${results.filePath}</p>` : ''}
    </div>

    ${results.vulnerabilities.length > 0 ? `
    <div class="section">
        <h2>🚨 Security Vulnerabilities (${results.vulnerabilities.length})</h2>
        ${results.vulnerabilities.map(vuln => `
            <div class="issue ${vuln.severity.toLowerCase()}">
                <strong>${vuln.type}</strong> - ${vuln.severity}
                <p>${vuln.message}</p>
                ${vuln.line ? `<small>Line: ${vuln.line}${vuln.column ? `, Column: ${vuln.column}` : ''}</small>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${results.secrets.length > 0 ? `
    <div class="section">
        <h2>🔐 Detected Secrets (${results.secrets.length})</h2>
        ${results.secrets.map(secret => `
            <div class="issue ${secret.severity.toLowerCase()}">
                <strong>${secret.type}</strong> - ${secret.severity}
                <p>${secret.message}</p>
                <small>Confidence: ${(secret.confidence * 100).toFixed(0)}%</small>
                ${secret.line ? `<br><small>Line: ${secret.line}${secret.column ? `, Column: ${secret.column}` : ''}</small>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${results.qualityIssues.length > 0 ? `
    <div class="section">
        <h2>📊 Code Quality Issues (${results.qualityIssues.length})</h2>
        ${results.qualityIssues.map(issue => `
            <div class="issue ${issue.severity.toLowerCase()}">
                <strong>${issue.type}</strong> - ${issue.severity}
                <p>${issue.message}</p>
                ${issue.line ? `<small>Line: ${issue.line}${issue.column ? `, Column: ${issue.column}` : ''}</small>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${results.suggestions.length > 0 ? `
    <div class="section">
        <h2>💡 AI Suggestions (${results.suggestions.length})</h2>
        ${results.suggestions.map(suggestion => `
            <div class="issue info">
                <p>${suggestion}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${results.vulnerabilities.length === 0 && results.secrets.length === 0 && results.qualityIssues.length === 0 ? `
    <div class="section">
        <h2>✅ All Clear!</h2>
        <p>No security vulnerabilities, secrets, or major quality issues detected.</p>
    </div>
    ` : ''}
</body>
</html>`;
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}