import * as vscode from 'vscode';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private progressItem: vscode.StatusBarItem;
    private isAnalyzing: boolean = false;
    private analysisProgress: number = 0;

    constructor() {
        // Main status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left, 
            100
        );
        this.statusBarItem.command = 'codeGuardian.showWebview';
        this.statusBarItem.show();

        // Progress indicator item
        this.progressItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left, 
            99
        );

        this.updateStatus();
    }

    public updateStatus(analysisData?: any): void {
        if (this.isAnalyzing) {
            this.showAnalyzingStatus();
            return;
        }

        if (!analysisData || Object.keys(analysisData).length === 0) {
            this.showIdleStatus();
            return;
        }

        const vulnerabilities = analysisData.vulnerabilities?.length || 0;
        const secrets = analysisData.secrets?.length || 0;
        const qualityScore = analysisData.qualityMetrics?.maintainabilityScore || 0;
        const totalIssues = vulnerabilities + secrets;

        if (totalIssues === 0) {
            this.showSuccessStatus(qualityScore);
        } else if (totalIssues <= 2) {
            this.showWarningStatus(totalIssues, qualityScore);
        } else {
            this.showErrorStatus(totalIssues, qualityScore);
        }
    }

    public setAnalyzing(analyzing: boolean, progress?: number): void {
        this.isAnalyzing = analyzing;
        this.analysisProgress = progress || 0;
        
        if (analyzing) {
            this.showAnalyzingStatus();
        } else {
            this.hideProgress();
        }
    }

    private showIdleStatus(): void {
        this.statusBarItem.text = '$(shield) Guardian Security';
        this.statusBarItem.tooltip = 'Click to open Guardian Security Dashboard';
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.color = undefined;
        this.hideProgress();
    }

    private showSuccessStatus(qualityScore: number): void {
        this.statusBarItem.text = `$(check) Guardian Security - All Clear (${qualityScore}%)`;
        this.statusBarItem.tooltip = `No security issues found. Code quality: ${qualityScore}%\nClick to view detailed report`;
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.color = new vscode.ThemeColor('statusBar.foreground');
        this.hideProgress();
    }

    private showWarningStatus(issues: number, qualityScore: number): void {
        this.statusBarItem.text = `$(warning) Guardian Security - ${issues} Issue${issues > 1 ? 's' : ''} (${qualityScore}%)`;
        this.statusBarItem.tooltip = `${issues} security issue${issues > 1 ? 's' : ''} found. Code quality: ${qualityScore}%\nClick to view details and recommendations`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
        this.hideProgress();
    }

    private showErrorStatus(issues: number, qualityScore: number): void {
        this.statusBarItem.text = `$(error) Guardian Security - ${issues} Issues (${qualityScore}%)`;
        this.statusBarItem.tooltip = `${issues} security issues require attention. Code quality: ${qualityScore}%\nClick to view critical issues and fixes`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorForeground');
        this.hideProgress();
    }

    private showAnalyzingStatus(): void {
        const progressBar = this.getProgressBar(this.analysisProgress);
        this.statusBarItem.text = `$(loading~spin) Guardian Security - Analyzing... ${Math.round(this.analysisProgress)}%`;
        this.statusBarItem.tooltip = `Analysis in progress: ${Math.round(this.analysisProgress)}%\n${progressBar}`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
        
        this.showProgress();
    }

    private showProgress(): void {
        const progressBar = this.getProgressBar(this.analysisProgress);
        this.progressItem.text = `${progressBar}`;
        this.progressItem.tooltip = `Analysis Progress: ${Math.round(this.analysisProgress)}%`;
        this.progressItem.show();
    }

    private hideProgress(): void {
        this.progressItem.hide();
    }

    private getProgressBar(progress: number): string {
        const barLength = 10;
        const filledLength = Math.round((progress / 100) * barLength);
        const emptyLength = barLength - filledLength;
        
        return '█'.repeat(filledLength) + '░'.repeat(emptyLength);
    }

    public simulateProgress(duration: number = 3000): void {
        this.setAnalyzing(true, 0);
        
        const steps = 20;
        const stepDuration = duration / steps;
        let currentStep = 0;

        const progressInterval = setInterval(() => {
            currentStep++;
            const progress = (currentStep / steps) * 100;
            this.analysisProgress = progress;
            
            if (this.isAnalyzing) {
                this.showAnalyzingStatus();
            }
            
            // Stop the interval when we reach 100% or analyzing is manually stopped
            if (currentStep >= steps || !this.isAnalyzing) {
                clearInterval(progressInterval);
                // Just update to 100% but don't auto-stop analyzing
                if (currentStep >= steps) {
                    this.analysisProgress = 100;
                    this.showAnalyzingStatus();
                }
            }
        }, stepDuration);
    }

    public showAutoAnalysisProgress(): void {
        this.statusBarItem.text = '$(loading~spin) Guardian Security - Auto-analyzing...';
        this.statusBarItem.tooltip = 'Automatic analysis in progress\nAnalyzing code as you type';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
    }

    public showCriticalIssuesFound(count: number): void {
        // Flash the status bar to draw attention to critical issues
        const originalBg = this.statusBarItem.backgroundColor;
        const originalColor = this.statusBarItem.color;
        
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorForeground');
        
        // Restore original colors after 2 seconds
        setTimeout(() => {
            this.statusBarItem.backgroundColor = originalBg;
            this.statusBarItem.color = originalColor;
        }, 2000);
        
        // Show notification for critical issues
        vscode.window.showWarningMessage(
            `🚨 ${count} critical security issue${count > 1 ? 's' : ''} detected!`,
            'View Details',
            'Fix Now'
        ).then(selection => {
            if (selection === 'View Details' || selection === 'Fix Now') {
                vscode.commands.executeCommand('codeGuardian.showEnhancedWebview');
            }
        });
    }

    public showLanguageDetected(languageId: string): void {
        // Briefly show language detection
        const originalText = this.statusBarItem.text;
        this.statusBarItem.text = `$(file-code) Guardian Security - ${languageId.toUpperCase()} detected`;
        
        setTimeout(() => {
            this.statusBarItem.text = originalText;
        }, 1500);
    }

    public dispose(): void {
        this.statusBarItem.dispose();
        this.progressItem.dispose();
    }
}