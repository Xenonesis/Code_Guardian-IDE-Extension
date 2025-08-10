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
exports.Webview = void 0;
const vscode = __importStar(require("vscode"));
class Webview {
    constructor(context) {
        this.currentTheme = 'dark';
        this.context = context;
        this.detectTheme();
    }
    detectTheme() {
        const config = vscode.workspace.getConfiguration();
        const theme = config.get('workbench.colorTheme', '');
        this.currentTheme = theme.toLowerCase().includes('light') ? 'light' : 'dark';
    }
    createWebview() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('codeGuardianWebview', 'Code Guardian Dashboard', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
        });
        this.panel.webview.html = this.getWebviewContent();
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'analyzeSecurity':
                    vscode.commands.executeCommand('codeGuardian.analyzeSecurity');
                    break;
                case 'analyzeQuality':
                    vscode.commands.executeCommand('codeGuardian.analyzeQuality');
                    break;
                case 'detectSecrets':
                    vscode.commands.executeCommand('codeGuardian.detectSecrets');
                    break;
                case 'getAiSuggestions':
                    vscode.commands.executeCommand('codeGuardian.getAiSuggestions');
                    break;
                case 'runAllAnalysis':
                    vscode.commands.executeCommand('codeGuardian.runAllAnalysis');
                    break;
            }
        }, undefined, this.context.subscriptions);
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }
    updateWebview(data) {
        if (this.panel) {
            this.panel.webview.html = this.getWebviewContent(data);
        }
    }
    getWebviewContent(data) {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Code Guardian Dashboard</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    .header {
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 20px;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    .controls {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 20px;
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                    .btn {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 10px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 500;
                        transition: background-color 0.2s;
                    }
                    .btn:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .btn-primary {
                        background-color: var(--vscode-button-background);
                    }
                    .btn-danger {
                        background-color: var(--vscode-inputValidation-errorBackground);
                        color: var(--vscode-inputValidation-errorForeground);
                    }
                    .btn-success {
                        background-color: var(--vscode-inputValidation-infoBackground);
                        color: var(--vscode-inputValidation-infoForeground);
                    }
                    .section {
                        margin-bottom: 30px;
                        padding: 15px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 5px;
                        background-color: var(--vscode-sideBar-background);
                    }
                    .section h2 {
                        margin-top: 0;
                        color: var(--vscode-textLink-foreground);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    .status-indicator {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        display: inline-block;
                    }
                    .status-success { background-color: #4CAF50; }
                    .status-warning { background-color: #FF9800; }
                    .status-error { background-color: #F44336; }
                    .status-info { background-color: #2196F3; }
                    .metric {
                        display: inline-block;
                        margin: 10px 15px 10px 0;
                        padding: 10px;
                        background-color: var(--vscode-button-background);
                        border-radius: 3px;
                        min-width: 100px;
                        text-align: center;
                    }
                    .vulnerability {
                        padding: 8px;
                        margin: 5px 0;
                        background-color: var(--vscode-inputValidation-errorBackground);
                        border-left: 3px solid var(--vscode-inputValidation-errorBorder);
                        border-radius: 3px;
                    }
                    .secret {
                        padding: 8px;
                        margin: 5px 0;
                        background-color: var(--vscode-inputValidation-warningBackground);
                        border-left: 3px solid var(--vscode-inputValidation-warningBorder);
                        border-radius: 3px;
                    }
                    .suggestion {
                        padding: 8px;
                        margin: 5px 0;
                        background-color: var(--vscode-inputValidation-infoBackground);
                        border-left: 3px solid var(--vscode-inputValidation-infoBorder);
                        border-radius: 3px;
                    }
                    pre {
                        background-color: var(--vscode-textCodeBlock-background);
                        padding: 10px;
                        border-radius: 3px;
                        overflow-x: auto;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🛡️ Guardian Security Dashboard</h1>
                    <p>AI-powered security analysis and code quality insights</p>
                </div>

                <div class="controls">
                    <button class="btn btn-danger" onclick="runAnalysis('analyzeSecurity')">
                        🚨 Security Analysis
                    </button>
                    <button class="btn btn-primary" onclick="runAnalysis('analyzeQuality')">
                        📊 Quality Analysis
                    </button>
                    <button class="btn btn-success" onclick="runAnalysis('detectSecrets')">
                        🔐 Secret Detection
                    </button>
                    <button class="btn btn-primary" onclick="runAnalysis('getAiSuggestions')">
                        💡 AI Suggestions
                    </button>
                    <button class="btn btn-primary" onclick="runAnalysis('runAllAnalysis')" style="background-color: var(--vscode-button-secondaryBackground);">
                        🔄 Run All Analysis
                    </button>
                </div>

                <div id="content">
                    ${data ? this.formatAnalysisData(data) : this.getDefaultContent()}
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function runAnalysis(command) {
                        vscode.postMessage({
                            command: command
                        });
                    }

                    // Auto-refresh every 30 seconds if there's data
                    ${data ? 'setTimeout(() => { vscode.postMessage({ command: "refresh" }); }, 30000);' : ''}
                </script>
            </body>
            </html>
        `;
    }
    formatAnalysisData(data) {
        let html = '';
        if (data.vulnerabilities) {
            const statusClass = data.vulnerabilities.length > 0 ? 'status-error' : 'status-success';
            html += `
                <div class="section">
                    <h2>
                        <span class="status-indicator ${statusClass}"></span>
                        🚨 Security Vulnerabilities (${data.vulnerabilities.length})
                    </h2>
                    ${data.vulnerabilities.length > 0
                ? data.vulnerabilities.map((vuln) => `
                            <div class="vulnerability">
                                <strong>⚠️ ${typeof vuln === 'object' ? (vuln.type || 'Security Issue') : 'Security Issue'}</strong><br>
                                <span style="color: var(--vscode-descriptionForeground);">
                                    Line ${typeof vuln === 'object' ? (vuln.line || 'Unknown') : 'Unknown'}: ${typeof vuln === 'object' ? (vuln.description || vuln.message || 'Security vulnerability detected') : vuln}
                                </span>
                                ${typeof vuln === 'object' && vuln.suggestion ? `<br><em>💡 Suggestion: ${vuln.suggestion}</em>` : ''}
                            </div>
                        `).join('')
                : '<p style="color: var(--vscode-testing-iconPassed);">✅ No security vulnerabilities detected.</p>'}
                </div>
            `;
        }
        if (data.secrets) {
            const statusClass = data.secrets.length > 0 ? 'status-error' : 'status-success';
            html += `
                <div class="section">
                    <h2>
                        <span class="status-indicator ${statusClass}"></span>
                        🔐 Detected Secrets (${data.secrets.length})
                    </h2>
                    ${data.secrets.length > 0
                ? data.secrets.map((secret) => `
                            <div class="secret">
                                <strong>🔑 ${typeof secret === 'object' ? (secret.type || 'Secret Detected') : 'Secret Detected'}</strong><br>
                                <span style="color: var(--vscode-descriptionForeground);">
                                    Line ${typeof secret === 'object' ? (secret.line || 'Unknown') : 'Unknown'}: ${typeof secret === 'object' ? (secret.description || secret.message || 'Secret detected') : secret}
                                </span>
                                <br><em style="color: var(--vscode-inputValidation-warningForeground);">
                                    ⚠️ This should be moved to environment variables or secure storage
                                </em>
                            </div>
                        `).join('')
                : '<p style="color: var(--vscode-testing-iconPassed);">✅ No secrets detected.</p>'}
                </div>
            `;
        }
        if (data.qualityMetrics) {
            const maintainabilityScore = data.qualityMetrics.maintainabilityScore || 0;
            const statusClass = maintainabilityScore >= 80 ? 'status-success' :
                maintainabilityScore >= 60 ? 'status-warning' : 'status-error';
            html += `
                <div class="section">
                    <h2>
                        <span class="status-indicator ${statusClass}"></span>
                        📊 Code Quality Metrics
                    </h2>
                    <div class="metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div class="metric">
                            <strong>Maintainability Score</strong>
                            <div style="background: var(--vscode-progressBar-background); height: 8px; border-radius: 4px; margin: 5px 0;">
                                <div style="background: ${maintainabilityScore >= 80 ? '#4CAF50' : maintainabilityScore >= 60 ? '#FF9800' : '#F44336'};
                                           height: 100%; width: ${maintainabilityScore}%; border-radius: 4px;"></div>
                            </div>
                            <span style="font-size: 18px; font-weight: bold;">${maintainabilityScore}/100</span>
                        </div>
                        <div class="metric">
                            <strong>Complexity Score</strong><br>
                            <span style="font-size: 18px; color: var(--vscode-textLink-foreground);">
                                ${data.qualityMetrics.complexityScore || 'N/A'}
                            </span>
                        </div>
                        <div class="metric">
                            <strong>Technical Debt</strong><br>
                            <span style="font-size: 18px; color: var(--vscode-inputValidation-warningForeground);">
                                ${data.qualityMetrics.technicalDebt || 'Low'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }
        if (data.suggestions) {
            html += `
                <div class="section">
                    <h2>
                        <span class="status-indicator status-info"></span>
                        💡 AI Suggestions (${data.suggestions.length})
                    </h2>
                    ${data.suggestions.map((suggestion, index) => `
                        <div class="suggestion" style="margin-bottom: 15px; padding: 12px; background: var(--vscode-inputValidation-infoBackground); border-radius: 6px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                <span style="background: var(--vscode-button-background); color: var(--vscode-button-foreground);
                                           padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                    ${index + 1}
                                </span>
                                <strong>${typeof suggestion === 'object' ? (suggestion.title || 'Improvement Suggestion') : 'Improvement Suggestion'}</strong>
                            </div>
                            <div style="color: var(--vscode-descriptionForeground); margin-bottom: 8px;">
                                ${typeof suggestion === 'object' ? (suggestion.description || suggestion.message || 'AI suggestion') : suggestion}
                            </div>
                            ${typeof suggestion === 'object' && suggestion.code ? `
                                <pre style="background: var(--vscode-textCodeBlock-background); padding: 8px; border-radius: 4px; font-size: 12px;">
                                    ${suggestion.code}
                                </pre>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        return html || this.getDefaultContent();
    }
    getDefaultContent() {
        return `
            <div class="section">
                <h2>
                    <span class="status-indicator status-info"></span>
                    Welcome to Guardian Security
                </h2>
                <p style="font-size: 16px; margin-bottom: 20px;">
                    🛡️ Your AI-powered code security and quality assistant
                </p>
                <div style="background: var(--vscode-textCodeBlock-background); padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                    <h3 style="margin-top: 0; color: var(--vscode-textLink-foreground);">Quick Start:</h3>
                    <ol style="margin: 0; padding-left: 20px;">
                        <li>Open any code file in the editor</li>
                        <li>Click any analysis button above</li>
                        <li>View real-time results here</li>
                    </ol>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <div style="padding: 15px; border: 1px solid var(--vscode-panel-border); border-radius: 6px;">
                        <h4 style="margin-top: 0; color: var(--vscode-inputValidation-errorForeground);">🚨 Security Analysis</h4>
                        <p style="margin: 0; font-size: 14px;">Detect vulnerabilities, unsafe patterns, and security risks</p>
                    </div>
                    <div style="padding: 15px; border: 1px solid var(--vscode-panel-border); border-radius: 6px;">
                        <h4 style="margin-top: 0; color: var(--vscode-textLink-foreground);">📊 Quality Analysis</h4>
                        <p style="margin: 0; font-size: 14px;">Assess maintainability, complexity, and technical debt</p>
                    </div>
                    <div style="padding: 15px; border: 1px solid var(--vscode-panel-border); border-radius: 6px;">
                        <h4 style="margin-top: 0; color: var(--vscode-inputValidation-warningForeground);">🔐 Secret Detection</h4>
                        <p style="margin: 0; font-size: 14px;">Find exposed API keys, passwords, and credentials</p>
                    </div>
                    <div style="padding: 15px; border: 1px solid var(--vscode-panel-border); border-radius: 6px;">
                        <h4 style="margin-top: 0; color: var(--vscode-inputValidation-infoForeground);">💡 AI Suggestions</h4>
                        <p style="margin: 0; font-size: 14px;">Get intelligent recommendations for improvements</p>
                    </div>
                </div>
            </div>
        `;
    }
}
exports.Webview = Webview;
//# sourceMappingURL=webview.js.map