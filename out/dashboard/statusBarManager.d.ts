export declare class StatusBarManager {
    private statusBarItem;
    private progressItem;
    private isAnalyzing;
    private analysisProgress;
    constructor();
    updateStatus(analysisData?: any): void;
    setAnalyzing(analyzing: boolean, progress?: number): void;
    private showIdleStatus;
    private showSuccessStatus;
    private showWarningStatus;
    private showErrorStatus;
    private showAnalyzingStatus;
    private showProgress;
    private hideProgress;
    private getProgressBar;
    simulateProgress(duration?: number): void;
    showAutoAnalysisProgress(): void;
    showCriticalIssuesFound(count: number): void;
    showLanguageDetected(languageId: string): void;
    dispose(): void;
}
//# sourceMappingURL=statusBarManager.d.ts.map