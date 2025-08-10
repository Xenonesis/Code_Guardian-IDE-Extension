"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarManager = void 0;
const vscode = __importStar(require("vscode"));
class StatusBarManager {
    constructor() {
        this.isAnalyzing = false;
        this.analysisProgress = 0;
        // Main status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'codeGuardian.showWebview';
        this.statusBarItem.show();
        // Progress indicator item
        this.progressItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
        this.updateStatus();
    }
    updateStatus(analysisData) {
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
        }
        else if (totalIssues <= 2) {
            this.showWarningStatus(totalIssues, qualityScore);
        }
        else {
            this.showErrorStatus(totalIssues, qualityScore);
        }
    }
    setAnalyzing(analyzing, progress) {
        this.isAnalyzing = analyzing;
        this.analysisProgress = progress || 0;
        if (analyzing) {
            this.showAnalyzingStatus();
        }
        else {
            this.hideProgress();
        }
    }
    showIdleStatus() {
        this.statusBarItem.text = '$(shield) Guardian Security';
        this.statusBarItem.tooltip = 'Click to open Guardian Security Dashboard';
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.color = undefined;
        this.hideProgress();
    }
    showSuccessStatus(qualityScore) {
        this.statusBarItem.text = `$(check) Guardian Security - All Clear (${qualityScore}%)`;
        this.statusBarItem.tooltip = `No security issues found. Code quality: ${qualityScore}%\nClick to view detailed report`;
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.color = new vscode.ThemeColor('statusBar.foreground');
        this.hideProgress();
    }
    showWarningStatus(issues, qualityScore) {
        this.statusBarItem.text = `$(warning) Guardian Security - ${issues} Issue${issues > 1 ? 's' : ''} (${qualityScore}%)`;
        this.statusBarItem.tooltip = `${issues} security issue${issues > 1 ? 's' : ''} found. Code quality: ${qualityScore}%\nClick to view details and recommendations`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.warningForeground');
        this.hideProgress();
    }
    showErrorStatus(issues, qualityScore) {
        this.statusBarItem.text = `$(error) Guardian Security - ${issues} Issues (${qualityScore}%)`;
        this.statusBarItem.tooltip = `${issues} security issues require attention. Code quality: ${qualityScore}%\nClick to view critical issues and fixes`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorForeground');
        this.hideProgress();
    }
    showAnalyzingStatus() {
        const progressBar = this.getProgressBar(this.analysisProgress);
        this.statusBarItem.text = `$(loading~spin) Guardian Security - Analyzing... ${Math.round(this.analysisProgress)}%`;
        this.statusBarItem.tooltip = `Analysis in progress: ${Math.round(this.analysisProgress)}%\n${progressBar}`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
        this.showProgress();
    }
    showProgress() {
        const progressBar = this.getProgressBar(this.analysisProgress);
        this.progressItem.text = `${progressBar}`;
        this.progressItem.tooltip = `Analysis Progress: ${Math.round(this.analysisProgress)}%`;
        this.progressItem.show();
    }
    hideProgress() {
        this.progressItem.hide();
    }
    getProgressBar(progress) {
        const barLength = 10;
        const filledLength = Math.round((progress / 100) * barLength);
        const emptyLength = barLength - filledLength;
        return '█'.repeat(filledLength) + '░'.repeat(emptyLength);
    }
    simulateProgress(duration = 3000) {
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
    showAutoAnalysisProgress() {
        this.statusBarItem.text = '$(loading~spin) Guardian Security - Auto-analyzing...';
        this.statusBarItem.tooltip = 'Automatic analysis in progress\nAnalyzing code as you type';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        this.statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
    }
    showCriticalIssuesFound(count) {
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
        vscode.window.showWarningMessage(`🚨 ${count} critical security issue${count > 1 ? 's' : ''} detected!`, 'View Details', 'Fix Now').then(selection => {
            if (selection === 'View Details' || selection === 'Fix Now') {
                vscode.commands.executeCommand('codeGuardian.showEnhancedWebview');
            }
        });
    }
    showLanguageDetected(languageId) {
        // Briefly show language detection
        const originalText = this.statusBarItem.text;
        this.statusBarItem.text = `$(file-code) Guardian Security - ${languageId.toUpperCase()} detected`;
        setTimeout(() => {
            this.statusBarItem.text = originalText;
        }, 1500);
    }
    dispose() {
        this.statusBarItem.dispose();
        this.progressItem.dispose();
    }
}
exports.StatusBarManager = StatusBarManager;
//# sourceMappingURL=statusBarManager.js.map