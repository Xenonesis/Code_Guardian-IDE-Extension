import * as vscode from 'vscode';

export interface NotificationOptions {
    showProgress?: boolean;
    showInStatusBar?: boolean;
    autoHide?: boolean;
    actions?: Array<{
        title: string;
        command: string;
        arguments?: any[];
    }>;
}

export class NotificationManager {
    private static instance: NotificationManager;
    private progressResolvers: Map<string, () => void> = new Map();

    private constructor() {}

    public static getInstance(): NotificationManager {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    public async showAnalysisStarted(analysisType: string, options?: NotificationOptions): Promise<void> {
        const message = `Starting ${analysisType} analysis...`;
        
        // Use proper progress notification when showProgress is true
        if (options?.showProgress) {
            return this.showProgressNotification(message, analysisType);
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

    public async showAnalysisCompleted(
        analysisType: string, 
        results: any, 
        options?: NotificationOptions
    ): Promise<void> {
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

        let message: string;
        let severity: 'info' | 'warning' | 'error' = 'info';
        
        if (analysisType === 'comprehensive') {
            if (totalIssues === 0) {
                message = `✅ Analysis complete! No issues found. Quality score: ${qualityScore}%`;
                severity = 'info';
            } else if (totalIssues <= 2) {
                message = `⚠️ Analysis complete! Found ${totalIssues} issue${totalIssues > 1 ? 's' : ''}. Quality: ${qualityScore}%`;
                severity = 'warning';
            } else {
                message = `🚨 Analysis complete! Found ${totalIssues} issues requiring attention. Quality: ${qualityScore}%`;
                severity = 'error';
            }
        } else {
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

    public async showAnalysisError(analysisType: string, error: string): Promise<void> {
        const message = `❌ ${analysisType} analysis failed: ${error}`;
        
        const actions = [
            { title: 'Retry', command: `codeGuardian.analyze${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}` },
            { title: 'View Logs', command: 'workbench.action.toggleDevTools' }
        ];

        await this.showNotification(message, 'error', actions);
    }

    public async showQuickTip(tip: string): Promise<void> {
        const message = `💡 Guardian Tip: ${tip}`;
        
        const actions = [
            { title: 'Learn More', command: 'codeGuardian.showWebview' },
            { title: 'Dismiss', command: '' }
        ];

        await this.showNotification(message, 'info', actions, { autoHide: true });
    }

    public async showSecurityAlert(vulnerability: any): Promise<void> {
        const message = `🚨 Critical Security Issue: ${vulnerability.type || 'Security vulnerability detected'}`;
        
        const actions = [
            { title: 'View Details', command: 'codeGuardian.showWebview' },
            { title: 'Fix Now', command: 'codeGuardian.showWebview' },
            { title: 'Ignore', command: '' }
        ];

        await this.showNotification(message, 'error', actions);
    }

    public async showSecretAlert(secret: any): Promise<void> {
        const message = `🔐 Secret Detected: ${secret.type || 'Potential secret found in code'}`;
        
        const actions = [
            { title: 'Secure Now', command: 'codeGuardian.showWebview' },
            { title: 'View Details', command: 'codeGuardian.showWebview' },
            { title: 'Ignore', command: '' }
        ];

        await this.showNotification(message, 'warning', actions);
    }

    public async showWelcomeMessage(): Promise<void> {
        const message = '🛡️ Guardian Security is now active! Ready to protect your code.';
        
        const actions = [
            { title: 'Quick Start', command: 'codeGuardian.runAllAnalysis' },
            { title: 'Open Dashboard', command: 'codeGuardian.showWebview' },
            { title: 'Learn More', command: 'codeGuardian.showWebview' }
        ];

        await this.showNotification(message, 'info', actions);
    }

    public async showUpdateNotification(version: string): Promise<void> {
        const message = `🎉 Guardian Security updated to v${version}! New features available.`;
        
        const actions = [
            { title: 'What\'s New', command: 'codeGuardian.showWebview' },
            { title: 'Try Now', command: 'codeGuardian.runAllAnalysis' }
        ];

        await this.showNotification(message, 'info', actions);
    }

    private async showProgressNotification(message: string, key: string): Promise<void> {
        const progressKey = `progress-${key}`;
        
        // Store a resolver that will be called when analysis completes
        let resolveProgress: (() => void) | undefined;
        const progressPromise = new Promise<void>((resolve) => {
            resolveProgress = resolve;
        });
        
        this.progressResolvers.set(progressKey, () => {
            if (resolveProgress) {
                resolveProgress();
                this.progressResolvers.delete(progressKey);
            }
        });

        // Show progress notification that waits for external completion
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: message,
            cancellable: false
        }, async (progress) => {
            // Show initial progress
            progress.report({ increment: 0, message: '0% complete' });
            
            // Wait for the analysis to complete
            await progressPromise;
            
            // Show completion
            progress.report({ increment: 100, message: '100% complete' });
            
            // Brief delay to show completion before auto-dismissing
            await new Promise(resolve => setTimeout(resolve, 500));
        });

        // Don't return the promise - let the progress notification handle its own lifecycle
    }

    // Method to complete a progress notification
    public completeProgress(analysisType: string): void {
        const progressKey = `progress-${analysisType}`;
        const resolver = this.progressResolvers.get(progressKey);
        if (resolver) {
            resolver();
        }
    }

    private async showNotification(
        message: string, 
        severity: 'info' | 'warning' | 'error',
        actions: Array<{ title: string; command: string; arguments?: any[] }> = [],
        options?: NotificationOptions
    ): Promise<void> {
        const actionItems = actions.map(action => action.title);
        let result: string | undefined;

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

    public async showContextualHelp(context: string): Promise<void> {
        const helpMessages: { [key: string]: string } = {
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
        let actions: Array<{ title: string; command: string; arguments?: any[] }>;
        
        if (context === 'no-file-open') {
            actions = [
                { title: 'Open File', command: 'workbench.action.files.openFile' },
                { title: 'Run Analysis', command: 'codeGuardian.smartAnalysis' },
                { title: 'Learn More', command: 'codeGuardian.showEnhancedWebview' }
            ];
        } else {
            actions = [
                { title: 'Learn More', command: 'codeGuardian.showEnhancedWebview' },
                { title: 'Run Analysis', command: 'codeGuardian.runAllAnalysis' }
            ];
        }

        await this.showNotification(`💡 ${message}`, 'info', actions, { autoHide: true });
    }
}