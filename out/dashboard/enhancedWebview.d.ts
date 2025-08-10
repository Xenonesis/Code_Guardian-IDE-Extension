import * as vscode from 'vscode';
export declare class EnhancedWebview {
    private panel;
    private context;
    private currentTheme;
    private analysisHistory;
    private isAnalyzing;
    constructor(context: vscode.ExtensionContext);
    private detectTheme;
    createWebview(): void;
    updateWebview(data: any): void;
    private setAnalyzing;
    private addToHistory;
    private generateSummary;
    private clearHistory;
    private toggleTheme;
    private exportReport;
    private generateReport;
    private formatAnalysisDataForReport;
    private getEnhancedWebviewContent;
    private formatEnhancedAnalysisData;
    private formatOverviewContent;
    private formatDetailedContent;
    private formatHistoryContent;
    private getEnhancedDefaultContent;
}
//# sourceMappingURL=enhancedWebview.d.ts.map