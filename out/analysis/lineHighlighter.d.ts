import * as vscode from 'vscode';
export interface HighlightInfo {
    line: number;
    column: number;
    length: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
    type: 'security' | 'secret' | 'quality';
}
export declare class LineHighlighter {
    private decorationTypes;
    private activeHighlights;
    constructor();
    private initializeDecorationTypes;
    private setupEventListeners;
    highlightSecurityIssues(document: vscode.TextDocument, vulnerabilities: string[]): HighlightInfo[];
    highlightSecrets(document: vscode.TextDocument, secrets: string[]): HighlightInfo[];
    highlightQualityIssues(document: vscode.TextDocument, qualityIssues: string[]): HighlightInfo[];
    private findSecurityIssuesInLine;
    private findSecretsInLine;
    private findQualityIssuesInLine;
    private extractSecretPattern;
    private getSecuritySeverity;
    updateHighlights(editor: vscode.TextEditor): void;
    setHighlights(filePath: string, highlights: HighlightInfo[]): void;
    clearHighlights(filePath: string): void;
    dispose(): void;
}
//# sourceMappingURL=lineHighlighter.d.ts.map