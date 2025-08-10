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
exports.EnhancedCodeGuardianTreeProvider = exports.EnhancedCodeGuardianTreeItem = void 0;
const vscode = __importStar(require("vscode"));
class EnhancedCodeGuardianTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, command, iconPath, contextValue, tooltip, description, severity) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.iconPath = iconPath;
        this.contextValue = contextValue;
        this.tooltip = tooltip;
        this.description = description;
        this.severity = severity;
        this.tooltip = tooltip || this.label;
        this.description = description;
        // Set icon color based on severity
        if (severity && iconPath instanceof vscode.ThemeIcon) {
            switch (severity) {
                case 'critical':
                    this.iconPath = new vscode.ThemeIcon(iconPath.id, new vscode.ThemeColor('errorForeground'));
                    break;
                case 'high':
                    this.iconPath = new vscode.ThemeIcon(iconPath.id, new vscode.ThemeColor('warningForeground'));
                    break;
                case 'medium':
                    this.iconPath = new vscode.ThemeIcon(iconPath.id, new vscode.ThemeColor('notificationsWarningIcon.foreground'));
                    break;
                case 'low':
                    this.iconPath = new vscode.ThemeIcon(iconPath.id, new vscode.ThemeColor('notificationsInfoIcon.foreground'));
                    break;
            }
        }
    }
}
exports.EnhancedCodeGuardianTreeItem = EnhancedCodeGuardianTreeItem;
class EnhancedCodeGuardianTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.analysisResults = {};
        this.analysisHistory = [];
        this.isAnalyzing = false;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    updateResults(results) {
        this.analysisResults = results;
        this.addToHistory(results);
        this.isAnalyzing = false;
        this.refresh();
    }
    setAnalyzing(analyzing) {
        this.isAnalyzing = analyzing;
        this.refresh();
    }
    updateWorkspaceResults(workspaceResults) {
        // Store workspace results for display in tree view
        this.analysisResults.workspaceResults = workspaceResults;
        this.refresh();
    }
    addToHistory(results) {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            data: results,
            summary: this.generateSummary(results)
        };
        this.analysisHistory.unshift(historyEntry);
        if (this.analysisHistory.length > 20) {
            this.analysisHistory = this.analysisHistory.slice(0, 20);
        }
    }
    generateSummary(data) {
        const vulnerabilities = data.vulnerabilities?.length || 0;
        const secrets = data.secrets?.length || 0;
        const qualityScore = data.qualityMetrics?.maintainabilityScore || 0;
        const suggestions = data.suggestions?.length || 0;
        return `${vulnerabilities}V ${secrets}S ${qualityScore}%Q ${suggestions}AI`;
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Root level items
            return Promise.resolve([
                new EnhancedCodeGuardianTreeItem('Quick Actions', vscode.TreeItemCollapsibleState.Expanded, undefined, new vscode.ThemeIcon('zap'), 'quickActions', 'Quick access to analysis tools'),
                new EnhancedCodeGuardianTreeItem('Analysis Results', vscode.TreeItemCollapsibleState.Expanded, undefined, new vscode.ThemeIcon('output'), 'results', 'Current analysis results'),
                new EnhancedCodeGuardianTreeItem('Analysis History', vscode.TreeItemCollapsibleState.Collapsed, undefined, new vscode.ThemeIcon('history'), 'history', `View past analysis results (${this.analysisHistory.length} entries)`),
                new EnhancedCodeGuardianTreeItem('Settings & Tools', vscode.TreeItemCollapsibleState.Collapsed, undefined, new vscode.ThemeIcon('settings-gear'), 'settings', 'Configuration and additional tools')
            ]);
        }
        if (element.contextValue === 'quickActions') {
            const items = [
                new EnhancedCodeGuardianTreeItem(this.isAnalyzing ? 'Running Analysis...' : 'Run All Analysis', vscode.TreeItemCollapsibleState.None, this.isAnalyzing ? undefined : {
                    command: 'codeGuardian.runAllAnalysis',
                    title: 'Run All Analysis'
                }, new vscode.ThemeIcon(this.isAnalyzing ? 'loading~spin' : 'play-circle'), 'runAll', 'Run comprehensive security and quality analysis', this.isAnalyzing ? 'Analyzing...' : undefined),
                new EnhancedCodeGuardianTreeItem('Security Analysis', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.analyzeSecurity',
                    title: 'Run Security Analysis'
                }, new vscode.ThemeIcon('shield'), 'securityAnalysis', 'Detect security vulnerabilities and risks'),
                new EnhancedCodeGuardianTreeItem('Quality Analysis', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.analyzeQuality',
                    title: 'Run Quality Analysis'
                }, new vscode.ThemeIcon('graph'), 'qualityAnalysis', 'Assess code maintainability and complexity'),
                new EnhancedCodeGuardianTreeItem('Secret Detection', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.detectSecrets',
                    title: 'Run Secret Detection'
                }, new vscode.ThemeIcon('key'), 'secretDetection', 'Find exposed secrets and credentials'),
                new EnhancedCodeGuardianTreeItem('AI Suggestions', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.getAiSuggestions',
                    title: 'Get AI Suggestions'
                }, new vscode.ThemeIcon('lightbulb'), 'aiSuggestions', 'Get intelligent improvement recommendations')
            ];
            return Promise.resolve(items);
        }
        if (element.contextValue === 'results') {
            const items = [];
            // Overall status
            const totalIssues = (this.analysisResults.vulnerabilities?.length || 0) +
                (this.analysisResults.secrets?.length || 0);
            if (Object.keys(this.analysisResults).length > 0) {
                items.push(new EnhancedCodeGuardianTreeItem(totalIssues === 0 ? 'All Clear ✅' : `${totalIssues} Issues Found ⚠️`, vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.showWebview',
                    title: 'Open Dashboard'
                }, new vscode.ThemeIcon(totalIssues === 0 ? 'check' : 'warning'), 'overallStatus', totalIssues === 0 ? 'No security issues detected' : `${totalIssues} issues require attention`, undefined, totalIssues === 0 ? 'low' : totalIssues > 5 ? 'high' : 'medium'));
            }
            // Security vulnerabilities
            if (this.analysisResults.vulnerabilities !== undefined) {
                const count = this.analysisResults.vulnerabilities.length;
                const severity = count === 0 ? 'low' : count > 3 ? 'critical' : count > 1 ? 'high' : 'medium';
                items.push(new EnhancedCodeGuardianTreeItem('Security Issues', count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon(count > 0 ? 'error' : 'check'), 'securityResults', `${count} security vulnerabilities detected`, `${count} found`, severity));
            }
            // Secrets
            if (this.analysisResults.secrets !== undefined) {
                const count = this.analysisResults.secrets.length;
                const severity = count === 0 ? 'low' : count > 2 ? 'high' : 'medium';
                items.push(new EnhancedCodeGuardianTreeItem('Secrets', count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon(count > 0 ? 'key' : 'check'), 'secretResults', `${count} potential secrets detected`, `${count} found`, severity));
            }
            // Quality metrics
            if (this.analysisResults.qualityMetrics) {
                const score = this.analysisResults.qualityMetrics.maintainabilityScore || 0;
                const severity = score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high';
                items.push(new EnhancedCodeGuardianTreeItem('Code Quality', vscode.TreeItemCollapsibleState.Collapsed, undefined, new vscode.ThemeIcon(score >= 80 ? 'check' : score >= 60 ? 'warning' : 'error'), 'qualityResults', `Maintainability score: ${score}/100`, `${score}%`, severity));
            }
            // AI suggestions
            if (this.analysisResults.suggestions !== undefined) {
                const count = this.analysisResults.suggestions.length;
                items.push(new EnhancedCodeGuardianTreeItem('AI Suggestions', count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('lightbulb'), 'suggestionResults', `${count} AI-generated improvement suggestions`, `${count} available`, 'low'));
            }
            return Promise.resolve(items.length > 0 ? items : [
                new EnhancedCodeGuardianTreeItem('No analysis results yet', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.runAllAnalysis',
                    title: 'Run Analysis'
                }, new vscode.ThemeIcon('info'), 'noResults', 'Click to run your first analysis')
            ]);
        }
        if (element.contextValue === 'history') {
            if (this.analysisHistory.length === 0) {
                return Promise.resolve([
                    new EnhancedCodeGuardianTreeItem('No history available', vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('info'), 'noHistory', 'Analysis history will appear here')
                ]);
            }
            return Promise.resolve(this.analysisHistory.slice(0, 10).map((item, index) => new EnhancedCodeGuardianTreeItem(`Analysis #${this.analysisHistory.length - index}`, vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('history'), 'historyItem', `${new Date(item.timestamp).toLocaleString()}\n${item.summary}`, new Date(item.timestamp).toLocaleDateString())));
        }
        if (element.contextValue === 'settings') {
            return Promise.resolve([
                new EnhancedCodeGuardianTreeItem('Open Dashboard', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.showWebview',
                    title: 'Open Dashboard'
                }, new vscode.ThemeIcon('dashboard'), 'dashboard', 'Open the main Guardian Security dashboard'),
                new EnhancedCodeGuardianTreeItem('Export Report', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.exportReport',
                    title: 'Export Report'
                }, new vscode.ThemeIcon('export'), 'exportReport', 'Export analysis results to file'),
                new EnhancedCodeGuardianTreeItem('Clear History', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.clearHistory',
                    title: 'Clear History'
                }, new vscode.ThemeIcon('trash'), 'clearHistory', 'Clear analysis history'),
                new EnhancedCodeGuardianTreeItem('Settings', vscode.TreeItemCollapsibleState.None, {
                    command: 'workbench.action.openSettings',
                    title: 'Open Settings',
                    arguments: ['guardian-security']
                }, new vscode.ThemeIcon('settings'), 'openSettings', 'Configure Guardian Security settings')
            ]);
        }
        // Show individual results
        if (element.contextValue === 'securityResults' && this.analysisResults.vulnerabilities) {
            return Promise.resolve(this.analysisResults.vulnerabilities.slice(0, 15).map((vuln, index) => {
                const severity = this.determineSeverity(vuln);
                return new EnhancedCodeGuardianTreeItem(`${vuln.type || 'Security Issue'}`, vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('error'), 'vulnerability', `${vuln.description || vuln.message || 'Security vulnerability detected'}\nLine: ${vuln.line || 'Unknown'}`, vuln.line ? `Line ${vuln.line}` : undefined, severity);
            }));
        }
        if (element.contextValue === 'secretResults' && this.analysisResults.secrets) {
            return Promise.resolve(this.analysisResults.secrets.slice(0, 15).map((secret, index) => new EnhancedCodeGuardianTreeItem(`${secret.type || 'Secret'}`, vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('key'), 'secret', `${secret.description || secret.message || 'Secret detected'}\nLine: ${secret.line || 'Unknown'}`, secret.line ? `Line ${secret.line}` : undefined, 'medium')));
        }
        if (element.contextValue === 'qualityResults' && this.analysisResults.qualityMetrics) {
            const metrics = this.analysisResults.qualityMetrics;
            return Promise.resolve([
                new EnhancedCodeGuardianTreeItem('Maintainability Score', vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('graph'), 'maintainability', `Current maintainability score: ${metrics.maintainabilityScore}/100`, `${metrics.maintainabilityScore}/100`, metrics.maintainabilityScore >= 80 ? 'low' : metrics.maintainabilityScore >= 60 ? 'medium' : 'high'),
                new EnhancedCodeGuardianTreeItem('Complexity Score', vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('symbol-numeric'), 'complexity', `Code complexity score: ${metrics.complexityScore}`, `${metrics.complexityScore}`, metrics.complexityScore <= 5 ? 'low' : metrics.complexityScore <= 10 ? 'medium' : 'high'),
                new EnhancedCodeGuardianTreeItem('Technical Debt', vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('debt'), 'technicalDebt', `Technical debt level: ${metrics.technicalDebt}`, `${metrics.technicalDebt}`, metrics.technicalDebt <= 10 ? 'low' : metrics.technicalDebt <= 30 ? 'medium' : 'high')
            ]);
        }
        if (element.contextValue === 'suggestionResults' && this.analysisResults.suggestions) {
            return Promise.resolve(this.analysisResults.suggestions.slice(0, 15).map((suggestion, index) => new EnhancedCodeGuardianTreeItem(suggestion.title || `Suggestion ${index + 1}`, vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('lightbulb'), 'suggestion', suggestion.description || suggestion.message || 'AI-generated improvement suggestion', `#${index + 1}`, 'low')));
        }
        return Promise.resolve([]);
    }
    determineSeverity(vuln) {
        if (typeof vuln === 'object' && vuln.severity) {
            return vuln.severity;
        }
        const vulnText = typeof vuln === 'string' ? vuln : (vuln.description || vuln.message || '');
        if (vulnText.toLowerCase().includes('injection') ||
            vulnText.toLowerCase().includes('xss') ||
            vulnText.toLowerCase().includes('eval')) {
            return 'critical';
        }
        if (vulnText.toLowerCase().includes('password') ||
            vulnText.toLowerCase().includes('insecure')) {
            return 'high';
        }
        return 'medium';
    }
    clearHistory() {
        this.analysisHistory = [];
        this.refresh();
    }
}
exports.EnhancedCodeGuardianTreeProvider = EnhancedCodeGuardianTreeProvider;
//# sourceMappingURL=enhancedTreeViewProvider.js.map