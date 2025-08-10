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
exports.NotificationManager = void 0;
const vscode = __importStar(require("vscode"));
class NotificationManager {
    constructor() {
        this.progressResolvers = new Map();
    }
    static getInstance() {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }
    async showAnalysisStarted(analysisType, options) {
        const message = `Starting ${analysisType} analysis...`;
        // Simplified - just show a quick message without complex progress handling
        if (options?.showProgress) {
            // Show a simple status message instead of complex progress
            vscode.window.showInformationMessage(message);
            return Promise.resolve();
        }
        const actions = options?.actions || [
            { title: 'View Dashboard', command: 'codeGuardian.showWebview' }
        ];
        const actionItems = actions.map(action => action.title);
        const result = await vscode.window.showInformationMessage(message, ...actionItems);
        if (result) {
            const action = actions.find(a => a.title === result);
            if (action) {
                vscode.commands.executeCommand(action.command, ...(action.arguments || []));
            }
        }
    }
    async showAnalysisCompleted(analysisType, results, options) {
        const vulnerabilities = results.vulnerabilities?.length || 0;
        const secrets = results.secrets?.length || 0;
        const qualityScore = results.qualityMetrics?.maintainabilityScore || 0;
        const suggestions = results.suggestions?.length || 0;
        const totalIssues = vulnerabilities + secrets;
        // Clean up any progress resolvers (simplified)
        const progressKey = `progress-${analysisType}`;
        if (this.progressResolvers.has(progressKey)) {
            this.progressResolvers.delete(progressKey);
        }
        let message;
        let severity = 'info';
        if (analysisType === 'comprehensive') {
            if (totalIssues === 0) {
                message = `✅ Analysis complete! No issues found. Quality score: ${qualityScore}%`;
                severity = 'info';
            }
            else if (totalIssues <= 2) {
                message = `⚠️ Analysis complete! Found ${totalIssues} issue${totalIssues > 1 ? 's' : ''}. Quality: ${qualityScore}%`;
                severity = 'warning';
            }
            else {
                message = `🚨 Analysis complete! Found ${totalIssues} issues requiring attention. Quality: ${qualityScore}%`;
                severity = 'error';
            }
        }
        else {
            switch (analysisType) {
                case 'security':
                    message = vulnerabilities === 0
                        ? '✅ Security analysis complete - No vulnerabilities found'
                        : `⚠️ Security analysis found ${vulnerabilities} vulnerability${vulnerabilities > 1 ? 's' : ''}`;
                    severity = vulnerabilities === 0 ? 'info' : vulnerabilities > 3 ? 'error' : 'warning';
                    break;
                case 'secrets':
                    message = secrets === 0
                        ? '✅ Secret detection complete - No secrets found'
                        : `🔐 Secret detection found ${secrets} potential secret${secrets > 1 ? 's' : ''}`;
                    severity = secrets === 0 ? 'info' : 'warning';
                    break;
                case 'quality':
                    message = `📊 Quality analysis complete - Score: ${qualityScore}%`;
                    severity = qualityScore >= 80 ? 'info' : qualityScore >= 60 ? 'warning' : 'error';
                    break;
                case 'ai':
                    message = `💡 AI analysis complete - Generated ${suggestions} suggestion${suggestions > 1 ? 's' : ''}`;
                    severity = 'info';
                    break;
                default:
                    message = 'Analysis complete';
                    severity = 'info';
            }
        }
        const actions = options?.actions || [
            { title: 'View Results', command: 'codeGuardian.showWebview' },
            ...(totalIssues > 0 ? [{ title: 'Fix Issues', command: 'codeGuardian.showWebview' }] : [])
        ];
        await this.showNotification(message, severity, actions);
    }
    async showAnalysisError(analysisType, error) {
        const message = `❌ ${analysisType} analysis failed: ${error}`;
        const actions = [
            { title: 'Retry', command: `codeGuardian.analyze${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}` },
            { title: 'View Logs', command: 'workbench.action.toggleDevTools' }
        ];
        await this.showNotification(message, 'error', actions);
    }
    async showQuickTip(tip, category) {
        const message = `💡 Guardian Tip: ${tip}`;
        const actions = [
            { title: 'Learn More', command: 'codeGuardian.showWebview' },
            { title: 'Dismiss', command: '' }
        ];
        await this.showNotification(message, 'info', actions, { autoHide: true });
    }
    async showSecurityAlert(vulnerability) {
        const message = `🚨 Critical Security Issue: ${vulnerability.type || 'Security vulnerability detected'}`;
        const actions = [
            { title: 'View Details', command: 'codeGuardian.showWebview' },
            { title: 'Fix Now', command: 'codeGuardian.showWebview' },
            { title: 'Ignore', command: '' }
        ];
        await this.showNotification(message, 'error', actions);
    }
    async showSecretAlert(secret) {
        const message = `🔐 Secret Detected: ${secret.type || 'Potential secret found in code'}`;
        const actions = [
            { title: 'Secure Now', command: 'codeGuardian.showWebview' },
            { title: 'View Details', command: 'codeGuardian.showWebview' },
            { title: 'Ignore', command: '' }
        ];
        await this.showNotification(message, 'warning', actions);
    }
    async showWelcomeMessage() {
        const message = '🛡️ Guardian Security is now active! Ready to protect your code.';
        const actions = [
            { title: 'Quick Start', command: 'codeGuardian.runAllAnalysis' },
            { title: 'Open Dashboard', command: 'codeGuardian.showWebview' },
            { title: 'Learn More', command: 'codeGuardian.showWebview' }
        ];
        await this.showNotification(message, 'info', actions);
    }
    async showUpdateNotification(version, features) {
        const message = `🎉 Guardian Security updated to v${version}! New features available.`;
        const actions = [
            { title: 'What\'s New', command: 'codeGuardian.showWebview' },
            { title: 'Try Now', command: 'codeGuardian.runAllAnalysis' }
        ];
        await this.showNotification(message, 'info', actions);
    }
    async showProgressNotification(message, key) {
        // Simplified approach - just show a quick progress and resolve immediately
        const progressKey = `progress-${key}`;
        // Store a simple resolver
        let resolveProgress;
        const progressPromise = new Promise((resolve) => {
            resolveProgress = resolve;
        });
        this.progressResolvers.set(progressKey, () => {
            if (resolveProgress) {
                resolveProgress();
                this.progressResolvers.delete(progressKey);
            }
        });
        // Show a simple progress notification that auto-completes
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: message,
            cancellable: false
        }, async (progress) => {
            // Quick progress simulation
            for (let i = 0; i <= 100; i += 25) {
                progress.report({ increment: 25, message: `${i}% complete` });
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            // Auto-resolve after showing progress
            setTimeout(() => {
                if (resolveProgress) {
                    resolveProgress();
                    this.progressResolvers.delete(progressKey);
                }
            }, 500);
        });
        // Return the promise that will be resolved when analysis completes
        return progressPromise;
    }
    async showNotification(message, severity, actions = [], options) {
        const actionItems = actions.map(action => action.title);
        let result;
        switch (severity) {
            case 'error':
                result = await vscode.window.showErrorMessage(message, ...actionItems);
                break;
            case 'warning':
                result = await vscode.window.showWarningMessage(message, ...actionItems);
                break;
            default:
                result = await vscode.window.showInformationMessage(message, ...actionItems);
                break;
        }
        if (result) {
            const action = actions.find(a => a.title === result);
            if (action && action.command) {
                vscode.commands.executeCommand(action.command, ...(action.arguments || []));
            }
        }
        // Auto-hide after delay if specified
        if (options?.autoHide) {
            setTimeout(() => {
                // Note: VS Code doesn't provide a direct way to hide notifications
                // This is a placeholder for potential future functionality
            }, 5000);
        }
    }
    async showContextualHelp(context) {
        const helpMessages = {
            'no-file-open': 'Open a code file to start analysis. Guardian Security works best with JavaScript, TypeScript, Python, and other common languages.',
            'first-analysis': 'Great! You\'ve run your first analysis. Check the results in the dashboard and tree view.',
            'high-complexity': 'Your code has high complexity. Consider breaking down large functions and reducing nested conditions.',
            'security-issues': 'Security issues detected! Review each vulnerability carefully and apply the suggested fixes.',
            'secrets-found': 'Secrets detected in your code! Move these to environment variables or secure configuration files.',
            'quality-low': 'Code quality could be improved. Focus on reducing complexity and technical debt.',
            'all-clear': 'Excellent! Your code passed all security and quality checks. Keep up the good work!'
        };
        const message = helpMessages[context] || 'Guardian Security is here to help improve your code quality and security.';
        // Different actions based on context
        let actions;
        if (context === 'no-file-open') {
            actions = [
                { title: 'Open File', command: 'workbench.action.files.openFile' },
                { title: 'Run Analysis', command: 'codeGuardian.smartAnalysis' },
                { title: 'Learn More', command: 'codeGuardian.showEnhancedWebview' }
            ];
        }
        else {
            actions = [
                { title: 'Learn More', command: 'codeGuardian.showEnhancedWebview' },
                { title: 'Run Analysis', command: 'codeGuardian.runAllAnalysis' }
            ];
        }
        await this.showNotification(`💡 ${message}`, 'info', actions, { autoHide: true });
    }
}
exports.NotificationManager = NotificationManager;
//# sourceMappingURL=notificationManager.js.map