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
exports.CodeGuardianTreeProvider = exports.CodeGuardianTreeItem = void 0;
const vscode = __importStar(require("vscode"));
class CodeGuardianTreeItem extends vscode.TreeItem {
    constructor(label, collapsibleState, command, iconPath, contextValue) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.iconPath = iconPath;
        this.contextValue = contextValue;
        this.tooltip = this.label;
    }
}
exports.CodeGuardianTreeItem = CodeGuardianTreeItem;
class CodeGuardianTreeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.analysisResults = {};
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    updateResults(results) {
        this.analysisResults = results;
        this.refresh();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Root level items
            return Promise.resolve([
                new CodeGuardianTreeItem('Analysis Tools', vscode.TreeItemCollapsibleState.Expanded, undefined, new vscode.ThemeIcon('tools'), 'analysisTools'),
                new CodeGuardianTreeItem('Results', vscode.TreeItemCollapsibleState.Expanded, undefined, new vscode.ThemeIcon('output'), 'results'),
                new CodeGuardianTreeItem('Dashboard', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.showWebview',
                    title: 'Open Dashboard'
                }, new vscode.ThemeIcon('dashboard'), 'dashboard')
            ]);
        }
        if (element.contextValue === 'analysisTools') {
            return Promise.resolve([
                new CodeGuardianTreeItem('Security Analysis', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.analyzeSecurity',
                    title: 'Run Security Analysis'
                }, new vscode.ThemeIcon('shield'), 'securityAnalysis'),
                new CodeGuardianTreeItem('Quality Analysis', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.analyzeQuality',
                    title: 'Run Quality Analysis'
                }, new vscode.ThemeIcon('graph'), 'qualityAnalysis'),
                new CodeGuardianTreeItem('Secret Detection', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.detectSecrets',
                    title: 'Run Secret Detection'
                }, new vscode.ThemeIcon('key'), 'secretDetection'),
                new CodeGuardianTreeItem('AI Suggestions', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.getAiSuggestions',
                    title: 'Get AI Suggestions'
                }, new vscode.ThemeIcon('lightbulb'), 'aiSuggestions'),
                new CodeGuardianTreeItem('Run All Analysis', vscode.TreeItemCollapsibleState.None, {
                    command: 'codeGuardian.runAllAnalysis',
                    title: 'Run All Analysis'
                }, new vscode.ThemeIcon('play-circle'), 'runAll')
            ]);
        }
        if (element.contextValue === 'results') {
            const items = [];
            // Security vulnerabilities
            if (this.analysisResults.vulnerabilities) {
                const count = this.analysisResults.vulnerabilities.length;
                const icon = count > 0 ? new vscode.ThemeIcon('error') : new vscode.ThemeIcon('check');
                items.push(new CodeGuardianTreeItem(`Security Issues (${count})`, count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, undefined, icon, 'securityResults'));
            }
            // Secrets
            if (this.analysisResults.secrets) {
                const count = this.analysisResults.secrets.length;
                const icon = count > 0 ? new vscode.ThemeIcon('warning') : new vscode.ThemeIcon('check');
                items.push(new CodeGuardianTreeItem(`Secrets Found (${count})`, count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, undefined, icon, 'secretResults'));
            }
            // Quality metrics
            if (this.analysisResults.qualityMetrics) {
                const score = this.analysisResults.qualityMetrics.maintainabilityScore || 0;
                const icon = score >= 80 ? new vscode.ThemeIcon('check') :
                    score >= 60 ? new vscode.ThemeIcon('warning') : new vscode.ThemeIcon('error');
                items.push(new CodeGuardianTreeItem(`Quality Score: ${score}/100`, vscode.TreeItemCollapsibleState.None, undefined, icon, 'qualityResults'));
            }
            // AI suggestions
            if (this.analysisResults.suggestions) {
                const count = this.analysisResults.suggestions.length;
                items.push(new CodeGuardianTreeItem(`AI Suggestions (${count})`, count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('lightbulb'), 'suggestionResults'));
            }
            return Promise.resolve(items.length > 0 ? items : [
                new CodeGuardianTreeItem('No results yet', vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('info'), 'noResults')
            ]);
        }
        // Show individual results
        if (element.contextValue === 'securityResults' && this.analysisResults.vulnerabilities) {
            return Promise.resolve(this.analysisResults.vulnerabilities.slice(0, 10).map((vuln, index) => new CodeGuardianTreeItem(`${vuln.type || 'Security Issue'} (Line ${vuln.line || '?'})`, vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('error'), 'vulnerability')));
        }
        if (element.contextValue === 'secretResults' && this.analysisResults.secrets) {
            return Promise.resolve(this.analysisResults.secrets.slice(0, 10).map((secret, index) => new CodeGuardianTreeItem(`${secret.type || 'Secret'} (Line ${secret.line || '?'})`, vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('key'), 'secret')));
        }
        if (element.contextValue === 'suggestionResults' && this.analysisResults.suggestions) {
            return Promise.resolve(this.analysisResults.suggestions.slice(0, 10).map((suggestion, index) => new CodeGuardianTreeItem(suggestion.title || `Suggestion ${index + 1}`, vscode.TreeItemCollapsibleState.None, undefined, new vscode.ThemeIcon('lightbulb'), 'suggestion')));
        }
        return Promise.resolve([]);
    }
}
exports.CodeGuardianTreeProvider = CodeGuardianTreeProvider;
//# sourceMappingURL=treeViewProvider.js.map