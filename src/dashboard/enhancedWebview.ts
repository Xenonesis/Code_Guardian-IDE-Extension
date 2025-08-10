import * as vscode from 'vscode';
import { modernThemeCSS, modernJavaScript } from './modernTheme';

export class EnhancedWebview {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private currentTheme: string = 'dark';
    private analysisHistory: any[] = [];
    private isAnalyzing: boolean = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.detectTheme();
    }

    private detectTheme() {
        const config = vscode.workspace.getConfiguration();
        const theme = config.get('workbench.colorTheme', '');
        this.currentTheme = theme.toLowerCase().includes('light') ? 'light' : 'dark';
    }

    public createWebview() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'guardianEnhancedWebview',
            '🛡️ Guardian Security - Enhanced Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
            }
        );

        this.panel.webview.html = this.getEnhancedWebviewContent();

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'analyzeSecurity':
                        this.setAnalyzing(true);
                        vscode.commands.executeCommand('codeGuardian.analyzeSecurity');
                        break;
                    case 'analyzeQuality':
                        this.setAnalyzing(true);
                        vscode.commands.executeCommand('codeGuardian.analyzeQuality');
                        break;
                    case 'detectSecrets':
                        this.setAnalyzing(true);
                        vscode.commands.executeCommand('codeGuardian.detectSecrets');
                        break;
                    case 'getAiSuggestions':
                        this.setAnalyzing(true);
                        vscode.commands.executeCommand('codeGuardian.getAiSuggestions');
                        break;
                    case 'runAllAnalysis':
                        this.setAnalyzing(true);
                        vscode.commands.executeCommand('codeGuardian.runAllAnalysis');
                        break;
                    case 'exportReport':
                        this.exportReport(message.data);
                        break;
                    case 'clearHistory':
                        this.clearHistory();
                        break;
                    case 'toggleTheme':
                        this.toggleTheme();
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }

    public updateWebview(data: any) {
        if (this.panel) {
            this.setAnalyzing(false);
            this.addToHistory(data);
            this.panel.webview.html = this.getEnhancedWebviewContent(data);
        }
    }

    private setAnalyzing(analyzing: boolean) {
        this.isAnalyzing = analyzing;
        if (this.panel) {
            this.panel.webview.postMessage({ command: 'setAnalyzing', analyzing });
        }
    }

    private addToHistory(data: any) {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            data: data,
            summary: this.generateSummary(data)
        };
        this.analysisHistory.unshift(historyEntry);
        if (this.analysisHistory.length > 10) {
            this.analysisHistory = this.analysisHistory.slice(0, 10);
        }
    }

    private generateSummary(data: any): string {
        const vulnerabilities = data.vulnerabilities?.length || 0;
        const secrets = data.secrets?.length || 0;
        const qualityScore = data.qualityMetrics?.maintainabilityScore || 0;
        const suggestions = data.suggestions?.length || 0;

        return `${vulnerabilities} vulnerabilities, ${secrets} secrets, ${qualityScore}% quality, ${suggestions} suggestions`;
    }

    private clearHistory() {
        this.analysisHistory = [];
        if (this.panel) {
            this.panel.webview.html = this.getEnhancedWebviewContent();
        }
    }

    private toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        if (this.panel) {
            this.panel.webview.html = this.getEnhancedWebviewContent();
        }
    }

    private async exportReport(data: any) {
        const report = this.generateReport(data);
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('guardian-security-report.html'),
            filters: {
                'HTML Files': ['html'],
                'JSON Files': ['json'],
                'Text Files': ['txt']
            }
        });

        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(report, 'utf8'));
            vscode.window.showInformationMessage(`Report exported to ${uri.fsPath}`);
        }
    }

    private generateReport(data: any): string {
        const timestamp = new Date().toLocaleString();
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Guardian Security Report - ${timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .vulnerability { background: #ffebee; padding: 10px; margin: 5px 0; border-left: 4px solid #f44336; }
        .secret { background: #fff3e0; padding: 10px; margin: 5px 0; border-left: 4px solid #ff9800; }
        .suggestion { background: #e3f2fd; padding: 10px; margin: 5px 0; border-left: 4px solid #2196f3; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Guardian Security Report</h1>
        <p>Generated on: ${timestamp}</p>
    </div>
    ${this.formatAnalysisDataForReport(data)}
</body>
</html>`;
    }

    private formatAnalysisDataForReport(data: any): string {
        let html = '';

        if (data.vulnerabilities) {
            html += `
                <div class="section">
                    <h2>🚨 Security Vulnerabilities (${data.vulnerabilities.length})</h2>
                    ${data.vulnerabilities.map((vuln: any) => `
                        <div class="vulnerability">
                            <strong>${typeof vuln === 'object' ? (vuln.type || 'Security Issue') : 'Security Issue'}</strong><br>
                            ${typeof vuln === 'object' ? (vuln.description || vuln.message || 'Security vulnerability detected') : vuln}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.secrets) {
            html += `
                <div class="section">
                    <h2>🔐 Detected Secrets (${data.secrets.length})</h2>
                    ${data.secrets.map((secret: any) => `
                        <div class="secret">
                            <strong>${typeof secret === 'object' ? (secret.type || 'Secret Detected') : 'Secret Detected'}</strong><br>
                            ${typeof secret === 'object' ? (secret.description || secret.message || 'Secret detected') : secret}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.suggestions) {
            html += `
                <div class="section">
                    <h2>💡 AI Suggestions (${data.suggestions.length})</h2>
                    ${data.suggestions.map((suggestion: any) => `
                        <div class="suggestion">
                            <strong>${typeof suggestion === 'object' ? (suggestion.title || 'Improvement Suggestion') : 'Improvement Suggestion'}</strong><br>
                            ${typeof suggestion === 'object' ? (suggestion.description || suggestion.message || 'AI suggestion') : suggestion}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return html;
    }

    private getEnhancedWebviewContent(data?: any): string {
        const analysisMetadata = data?.metadata || {};
        const isAutoAnalysis = analysisMetadata.autoAnalysis || false;
        const fileName = analysisMetadata.fileName ? analysisMetadata.fileName.split('/').pop() : 'Unknown File';
        const languageId = analysisMetadata.languageId || 'unknown';
        const lineCount = analysisMetadata.lineCount || 0;
        const analyzedAt = analysisMetadata.analyzedAt ? new Date(analysisMetadata.analyzedAt).toLocaleString() : 'Unknown';

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Guardian Security - Enhanced Dashboard</title>
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
                <style>
                    :root {
                        --primary-color: #007acc;
                        --success-color: #4caf50;
                        --warning-color: #ff9800;
                        --error-color: #f44336;
                        --info-color: #2196f3;
                        --border-radius: 8px;
                        --shadow: 0 2px 8px rgba(0,0,0,0.1);
                        --transition: all 0.3s ease;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                        margin: 0;
                        padding: 0;
                        background: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        line-height: 1.6;
                        overflow-x: hidden;
                        scroll-behavior: smooth;
                    }

                    .container {
                        max-width: 1400px;
                        margin: 0 auto;
                        padding: 20px;
                        animation: fadeIn 0.6s ease-out;
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateX(-20px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }
                    
                    @keyframes shimmer {
                        0% { background-position: -200px 0; }
                        100% { background-position: calc(200px + 100%) 0; }
                    }

                    .header {
                        background: linear-gradient(135deg, var(--primary-color), var(--info-color));
                        color: white;
                        padding: 40px 30px;
                        border-radius: var(--border-radius);
                        margin-bottom: 30px;
                        text-align: center;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                        position: relative;
                        overflow: hidden;
                        animation: slideIn 0.8s ease-out;
                    }
                    
                    .header::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                        animation: shimmer 3s infinite;
                    }

                    .header h1 {
                        margin: 0 0 10px 0;
                        font-size: 2.5em;
                        font-weight: 300;
                    }

                    .header p {
                        margin: 0;
                        opacity: 0.9;
                        font-size: 1.1em;
                    }

                    .toolbar {
                        display: flex;
                        gap: 15px;
                        margin-bottom: 30px;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        padding: 20px;
                        background: var(--vscode-sideBar-background);
                        border-radius: var(--border-radius);
                        box-shadow: var(--shadow);
                    }

                    .controls {
                        display: flex;
                        gap: 10px;
                        flex-wrap: wrap;
                    }

                    .btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 12px 20px;
                        border-radius: var(--border-radius);
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        text-decoration: none;
                        position: relative;
                        overflow: hidden;
                        transform: translateY(0);
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    
                    .btn::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                        transition: left 0.5s;
                        overflow: hidden;
                    }

                    .btn:hover {
                        background: var(--vscode-button-hoverBackground);
                        transform: translateY(-3px);
                        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
                    }
                    
                    .btn:hover::before {
                        left: 100%;
                    }
                    
                    .btn:active {
                        transform: translateY(-1px);
                        transition: transform 0.1s;
                    }

                    .btn:active {
                        transform: translateY(0);
                    }

                    .btn-primary { background: var(--primary-color); }
                    .btn-success { background: var(--success-color); }
                    .btn-warning { background: var(--warning-color); }
                    .btn-danger { background: var(--error-color); }
                    .btn-info { background: var(--info-color); }

                    .btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                        transform: none;
                    }

                    .loading-spinner {
                        width: 16px;
                        height: 16px;
                        border: 2px solid transparent;
                        border-top: 2px solid currentColor;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }

                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 25px;
                        margin-bottom: 30px;
                        animation: fadeIn 0.8s ease-out 0.2s both;
                    }

                    .stat-card {
                        background: var(--vscode-sideBar-background);
                        padding: 30px 25px;
                        border-radius: 12px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        text-align: center;
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        border-left: 4px solid var(--primary-color);
                        position: relative;
                        overflow: hidden;
                        cursor: pointer;
                        transform: translateY(0);
                    }
                    
                    .stat-card::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: linear-gradient(90deg, var(--primary-color), var(--info-color));
                        transform: scaleX(0);
                        transition: transform 0.3s ease;
                    }

                    .stat-card:hover {
                        transform: translateY(-8px);
                        box-shadow: 0 12px 40px rgba(0,0,0,0.2);
                    }
                    
                    .stat-card:hover::before {
                        transform: scaleX(1);
                    }

                    .stat-number {
                        font-size: 3em;
                        font-weight: 700;
                        margin: 15px 0;
                        color: var(--primary-color);
                        background: linear-gradient(45deg, var(--primary-color), var(--info-color));
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        animation: pulse 2s infinite;
                    }

                    .stat-label {
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }

                    .section {
                        background: var(--vscode-sideBar-background);
                        margin-bottom: 30px;
                        border-radius: var(--border-radius);
                        box-shadow: var(--shadow);
                        overflow: hidden;
                        transition: var(--transition);
                    }

                    .section:hover {
                        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    }

                    .section-header {
                        padding: 20px 25px;
                        background: var(--vscode-panel-background);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    }

                    .section-title {
                        margin: 0;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        font-size: 1.3em;
                        font-weight: 600;
                    }

                    .section-content {
                        padding: 25px;
                    }

                    .status-indicator {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        display: inline-block;
                        animation: pulse 2s infinite;
                    }

                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.5; }
                        100% { opacity: 1; }
                    }

                    .status-success { background: var(--success-color); }
                    .status-warning { background: var(--warning-color); }
                    .status-error { background: var(--error-color); }
                    .status-info { background: var(--info-color); }

                    .issue-item {
                        padding: 15px;
                        margin: 10px 0;
                        border-radius: var(--border-radius);
                        border-left: 4px solid;
                        transition: var(--transition);
                        cursor: pointer;
                    }

                    .issue-item:hover {
                        transform: translateX(5px);
                        box-shadow: var(--shadow);
                    }

                    .vulnerability {
                        background: rgba(244, 67, 54, 0.1);
                        border-left-color: var(--error-color);
                    }

                    .secret {
                        background: rgba(255, 152, 0, 0.1);
                        border-left-color: var(--warning-color);
                    }

                    .suggestion {
                        background: rgba(33, 150, 243, 0.1);
                        border-left-color: var(--info-color);
                    }

                    .progress-bar {
                        width: 100%;
                        height: 8px;
                        background: var(--vscode-progressBar-background);
                        border-radius: 4px;
                        overflow: hidden;
                        margin: 10px 0;
                    }

                    .progress-fill {
                        height: 100%;
                        border-radius: 4px;
                        transition: width 0.5s ease;
                    }

                    .tabs {
                        display: flex;
                        background: var(--vscode-panel-background);
                        border-radius: var(--border-radius) var(--border-radius) 0 0;
                        overflow: hidden;
                    }

                    .tab {
                        padding: 15px 25px;
                        cursor: pointer;
                        transition: var(--transition);
                        border-bottom: 3px solid transparent;
                        flex: 1;
                        text-align: center;
                    }

                    .tab:hover {
                        background: var(--vscode-button-hoverBackground);
                    }

                    .tab.active {
                        background: var(--vscode-sideBar-background);
                        border-bottom-color: var(--primary-color);
                    }

                    .tab-content {
                        display: none;
                        padding: 25px;
                    }

                    .tab-content.active {
                        display: block;
                    }

                    .history-item {
                        padding: 15px;
                        margin: 10px 0;
                        background: var(--vscode-panel-background);
                        border-radius: var(--border-radius);
                        border-left: 4px solid var(--info-color);
                        cursor: pointer;
                        transition: var(--transition);
                    }

                    .history-item:hover {
                        background: var(--vscode-button-hoverBackground);
                        transform: translateX(5px);
                    }

                    .history-timestamp {
                        font-size: 0.8em;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 5px;
                    }

                    .empty-state {
                        text-align: center;
                        padding: 60px 20px;
                        color: var(--vscode-descriptionForeground);
                    }

                    .empty-state-icon {
                        font-size: 4em;
                        margin-bottom: 20px;
                        opacity: 0.5;
                    }

                    .welcome-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                        gap: 20px;
                        margin-top: 30px;
                    }

                    .feature-card {
                        padding: 25px;
                        background: var(--vscode-panel-background);
                        border-radius: var(--border-radius);
                        border: 1px solid var(--vscode-panel-border);
                        transition: var(--transition);
                        cursor: pointer;
                    }

                    .feature-card:hover {
                        transform: translateY(-5px);
                        box-shadow: var(--shadow);
                        border-color: var(--primary-color);
                    }

                    .feature-icon {
                        font-size: 2.5em;
                        margin-bottom: 15px;
                    }

                    .feature-title {
                        font-size: 1.2em;
                        font-weight: 600;
                        margin-bottom: 10px;
                        color: var(--vscode-textLink-foreground);
                    }

                    .feature-description {
                        color: var(--vscode-descriptionForeground);
                        line-height: 1.5;
                    }

                    @media (max-width: 768px) {
                        .container {
                            padding: 10px;
                        }
                        
                        .toolbar {
                            flex-direction: column;
                            align-items: stretch;
                        }
                        
                        .controls {
                            justify-content: center;
                        }
                        
                        .stats-grid {
                            grid-template-columns: 1fr;
                        }
                    }
                
                    /* Modern Theme Enhancements */
                    ${modernThemeCSS}
                    
                    /* Ripple Effect */
                    .ripple {
                        position: absolute;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.3);
                        transform: scale(0);
                        animation: ripple 0.6s linear;
                        pointer-events: none;
                    }
                    
                    @keyframes ripple {
                        to {
                            transform: scale(4);
                            opacity: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🛡️ Guardian Security</h1>
                        <p>Enhanced AI-powered security analysis and code quality insights</p>
                    </div>

                    <div class="toolbar">
                        <div class="controls">
                            <button class="btn btn-danger" onclick="runAnalysis('analyzeSecurity')" id="securityBtn">
                                <span>🚨</span> Security Analysis
                            </button>
                            <button class="btn btn-primary" onclick="runAnalysis('analyzeQuality')" id="qualityBtn">
                                <span>📊</span> Quality Analysis
                            </button>
                            <button class="btn btn-warning" onclick="runAnalysis('detectSecrets')" id="secretsBtn">
                                <span>🔐</span> Secret Detection
                            </button>
                            <button class="btn btn-info" onclick="runAnalysis('getAiSuggestions')" id="aiBtn">
                                <span>💡</span> AI Suggestions
                            </button>
                            <button class="btn btn-success" onclick="runAnalysis('runAllAnalysis')" id="allBtn">
                                <span>🔄</span> Run All Analysis
                            </button>
                        </div>
                        <div class="controls">
                            <button class="btn" onclick="exportReport()" id="exportBtn">
                                <span>📄</span> Export Report
                            </button>
                            <button class="btn" onclick="clearHistory()" id="clearBtn">
                                <span>🗑️</span> Clear History
                            </button>
                        </div>
                    </div>

                    <div id="content">
                        ${data ? this.formatEnhancedAnalysisData(data) : this.getEnhancedDefaultContent()}
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    let isAnalyzing = false;

                    function runAnalysis(command) {
                        if (isAnalyzing) return;
                        
                        setAnalyzing(true);
                        vscode.postMessage({ command: command });
                    }

                    function exportReport() {
                        vscode.postMessage({ 
                            command: 'exportReport',
                            data: ${JSON.stringify(data || {})}
                        });
                    }

                    function clearHistory() {
                        vscode.postMessage({ command: 'clearHistory' });
                    }

                    function setAnalyzing(analyzing) {
                        isAnalyzing = analyzing;
                        const buttons = document.querySelectorAll('.btn');
                        buttons.forEach(btn => {
                            if (analyzing) {
                                btn.disabled = true;
                                const spinner = document.createElement('div');
                                spinner.className = 'loading-spinner';
                                btn.insertBefore(spinner, btn.firstChild);
                            } else {
                                btn.disabled = false;
                                const spinner = btn.querySelector('.loading-spinner');
                                if (spinner) spinner.remove();
                            }
                        });
                    }

                    function switchTab(tabName) {
                        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
                        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                        
                        document.querySelector(\`[data-tab="\${tabName}"]\`).classList.add('active');
                        document.getElementById(\`\${tabName}-content\`).classList.add('active');
                    }

                    function showHistoryItem(index) {
                        const history = ${JSON.stringify(this.analysisHistory)};
                        if (history[index]) {
                            // Update content with historical data
                            document.getElementById('content').innerHTML = formatAnalysisData(history[index].data);
                        }
                    }

                    // Listen for messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.command === 'setAnalyzing') {
                            setAnalyzing(message.analyzing);
                        }
                    });

                    // Initialize tooltips and animations
                    document.addEventListener('DOMContentLoaded', function() {
                        // Add smooth scrolling
                        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                            anchor.addEventListener('click', function (e) {
                                e.preventDefault();
                                document.querySelector(this.getAttribute('href')).scrollIntoView({
                                    behavior: 'smooth'
                                });
                            });
                        });

                        // Add intersection observer for animations
                        const observer = new IntersectionObserver((entries) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    entry.target.style.opacity = '1';
                                    entry.target.style.transform = 'translateY(0)';
                                }
                            });
                        });

                        document.querySelectorAll('.section, .stat-card').forEach(el => {
                            el.style.opacity = '0';
                            el.style.transform = 'translateY(20px)';
                            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                            observer.observe(el);
                        });
                    });
                    
                    ${modernJavaScript}
                </script>
                
                <!-- Floating Action Button for Quick Analysis -->
                <button class="fab tooltip" data-tooltip="Run Quick Analysis" onclick="runAnalysis('runAllAnalysis')">
                    🔍
                </button>
            </body>
            </html>
        `;
    }

    private formatEnhancedAnalysisData(data: any): string {
        const vulnerabilities = data.vulnerabilities?.length || 0;
        const secrets = data.secrets?.length || 0;
        const qualityScore = data.qualityMetrics?.maintainabilityScore || 0;
        const suggestions = data.suggestions?.length || 0;

        const html = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number" style="color: ${vulnerabilities > 0 ? 'var(--error-color)' : 'var(--success-color)'}">
                        ${vulnerabilities}
                    </div>
                    <div class="stat-label">Security Issues</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: ${secrets > 0 ? 'var(--warning-color)' : 'var(--success-color)'}">
                        ${secrets}
                    </div>
                    <div class="stat-label">Secrets Found</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: ${qualityScore >= 80 ? 'var(--success-color)' : qualityScore >= 60 ? 'var(--warning-color)' : 'var(--error-color)'}">
                        ${qualityScore}%
                    </div>
                    <div class="stat-label">Quality Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" style="color: var(--info-color)">
                        ${suggestions}
                    </div>
                    <div class="stat-label">AI Suggestions</div>
                </div>
            </div>

            <div class="section">
                <div class="tabs">
                    <div class="tab active" data-tab="overview" onclick="switchTab('overview')">
                        📊 Overview
                    </div>
                    <div class="tab" data-tab="details" onclick="switchTab('details')">
                        🔍 Details
                    </div>
                    <div class="tab" data-tab="history" onclick="switchTab('history')">
                        📈 History
                    </div>
                </div>
                
                <div id="overview-content" class="tab-content active">
                    ${this.formatOverviewContent(data)}
                </div>
                
                <div id="details-content" class="tab-content">
                    ${this.formatDetailedContent(data)}
                </div>
                
                <div id="history-content" class="tab-content">
                    ${this.formatHistoryContent()}
                </div>
            </div>
        `;

        return html;
    }

    private formatOverviewContent(data: any): string {
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">';

        if (data.vulnerabilities && data.vulnerabilities.length > 0) {
            html += `
                <div style="padding: 20px; background: rgba(244, 67, 54, 0.1); border-radius: var(--border-radius); border-left: 4px solid var(--error-color);">
                    <h3 style="margin-top: 0; color: var(--error-color);">🚨 Security Alert</h3>
                    <p>Found ${data.vulnerabilities.length} security issue${data.vulnerabilities.length > 1 ? 's' : ''} that need immediate attention.</p>
                    <div style="margin-top: 15px;">
                        ${data.vulnerabilities.slice(0, 3).map((vuln: any) => `
                            <div style="font-size: 0.9em; margin: 5px 0; opacity: 0.8;">
                                • ${typeof vuln === 'object' ? (vuln.type || 'Security Issue') : 'Security Issue'}
                            </div>
                        `).join('')}
                        ${data.vulnerabilities.length > 3 ? `<div style="font-size: 0.9em; opacity: 0.6;">... and ${data.vulnerabilities.length - 3} more</div>` : ''}
                    </div>
                </div>
            `;
        }

        if (data.secrets && data.secrets.length > 0) {
            html += `
                <div style="padding: 20px; background: rgba(255, 152, 0, 0.1); border-radius: var(--border-radius); border-left: 4px solid var(--warning-color);">
                    <h3 style="margin-top: 0; color: var(--warning-color);">🔐 Secrets Detected</h3>
                    <p>Found ${data.secrets.length} potential secret${data.secrets.length > 1 ? 's' : ''} in your code.</p>
                    <div style="margin-top: 15px;">
                        ${data.secrets.slice(0, 3).map((secret: any) => `
                            <div style="font-size: 0.9em; margin: 5px 0; opacity: 0.8;">
                                • ${typeof secret === 'object' ? (secret.type || 'Secret') : 'Secret'}
                            </div>
                        `).join('')}
                        ${data.secrets.length > 3 ? `<div style="font-size: 0.9em; opacity: 0.6;">... and ${data.secrets.length - 3} more</div>` : ''}
                    </div>
                </div>
            `;
        }

        if (data.qualityMetrics) {
            const score = data.qualityMetrics.maintainabilityScore || 0;
            html += `
                <div style="padding: 20px; background: rgba(33, 150, 243, 0.1); border-radius: var(--border-radius); border-left: 4px solid var(--info-color);">
                    <h3 style="margin-top: 0; color: var(--info-color);">📊 Code Quality</h3>
                    <p>Maintainability Score: ${score}/100</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${score}%; background: ${score >= 80 ? 'var(--success-color)' : score >= 60 ? 'var(--warning-color)' : 'var(--error-color)'};"></div>
                    </div>
                    <div style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">
                        Complexity: ${data.qualityMetrics.complexityScore || 'N/A'} | 
                        Technical Debt: ${data.qualityMetrics.technicalDebt || 'Low'}
                    </div>
                </div>
            `;
        }

        if (data.suggestions && data.suggestions.length > 0) {
            html += `
                <div style="padding: 20px; background: rgba(76, 175, 80, 0.1); border-radius: var(--border-radius); border-left: 4px solid var(--success-color);">
                    <h3 style="margin-top: 0; color: var(--success-color);">💡 AI Insights</h3>
                    <p>Generated ${data.suggestions.length} improvement suggestion${data.suggestions.length > 1 ? 's' : ''}.</p>
                    <div style="margin-top: 15px;">
                        ${data.suggestions.slice(0, 2).map((suggestion: any, index: number) => `
                            <div style="font-size: 0.9em; margin: 5px 0; opacity: 0.8;">
                                ${index + 1}. ${typeof suggestion === 'object' ? (suggestion.title || 'Improvement suggestion') : suggestion.substring(0, 50) + '...'}
                            </div>
                        `).join('')}
                        ${data.suggestions.length > 2 ? `<div style="font-size: 0.9em; opacity: 0.6;">... and ${data.suggestions.length - 2} more</div>` : ''}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    private formatDetailedContent(data: any): string {
        let html = '';

        if (data.vulnerabilities && data.vulnerabilities.length > 0) {
            html += `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: var(--error-color); margin-bottom: 20px;">🚨 Security Vulnerabilities</h3>
                    ${data.vulnerabilities.map((vuln: any, index: number) => `
                        <div class="issue-item vulnerability">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <span style="background: var(--error-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                    ${index + 1}
                                </span>
                                <strong>${typeof vuln === 'object' ? (vuln.type || 'Security Issue') : 'Security Issue'}</strong>
                            </div>
                            <div style="color: var(--vscode-descriptionForeground); margin-left: 30px;">
                                ${typeof vuln === 'object' ? (vuln.description || vuln.message || 'Security vulnerability detected') : vuln}
                            </div>
                            ${typeof vuln === 'object' && vuln.line ? `
                                <div style="margin-left: 30px; margin-top: 5px; font-size: 0.9em; opacity: 0.7;">
                                    📍 Line ${vuln.line}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.secrets && data.secrets.length > 0) {
            html += `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: var(--warning-color); margin-bottom: 20px;">🔐 Detected Secrets</h3>
                    ${data.secrets.map((secret: any, index: number) => `
                        <div class="issue-item secret">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <span style="background: var(--warning-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                    ${index + 1}
                                </span>
                                <strong>${typeof secret === 'object' ? (secret.type || 'Secret Detected') : 'Secret Detected'}</strong>
                            </div>
                            <div style="color: var(--vscode-descriptionForeground); margin-left: 30px;">
                                ${typeof secret === 'object' ? (secret.description || secret.message || 'Secret detected') : secret}
                            </div>
                            <div style="margin-left: 30px; margin-top: 8px; font-size: 0.9em; color: var(--warning-color);">
                                ⚠️ Move to environment variables or secure storage
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.suggestions && data.suggestions.length > 0) {
            html += `
                <div style="margin-bottom: 30px;">
                    <h3 style="color: var(--info-color); margin-bottom: 20px;">💡 AI Suggestions</h3>
                    ${data.suggestions.map((suggestion: any, index: number) => `
                        <div class="issue-item suggestion">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                                <span style="background: var(--info-color); color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                                    ${index + 1}
                                </span>
                                <strong>${typeof suggestion === 'object' ? (suggestion.title || 'Improvement Suggestion') : 'Improvement Suggestion'}</strong>
                            </div>
                            <div style="color: var(--vscode-descriptionForeground); margin-left: 30px;">
                                ${typeof suggestion === 'object' ? (suggestion.description || suggestion.message || 'AI suggestion') : suggestion}
                            </div>
                            ${typeof suggestion === 'object' && suggestion.code ? `
                                <pre style="margin-left: 30px; margin-top: 10px; background: var(--vscode-textCodeBlock-background); padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;">
${suggestion.code}</pre>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return html || '<div class="empty-state"><div class="empty-state-icon">📋</div><p>No detailed analysis data available</p></div>';
    }

    private formatHistoryContent(): string {
        if (this.analysisHistory.length === 0) {
            return '<div class="empty-state"><div class="empty-state-icon">📈</div><p>No analysis history available</p></div>';
        }

        return `
            <div>
                <h3 style="margin-bottom: 20px;">📈 Analysis History</h3>
                ${this.analysisHistory.map((item, index) => `
                    <div class="history-item" onclick="showHistoryItem(${index})">
                        <div class="history-timestamp">
                            ${new Date(item.timestamp).toLocaleString()}
                        </div>
                        <div style="font-weight: 500; margin-bottom: 5px;">
                            Analysis #${this.analysisHistory.length - index}
                        </div>
                        <div style="font-size: 0.9em; color: var(--vscode-descriptionForeground);">
                            ${item.summary}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    private getEnhancedDefaultContent(): string {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">🛡️</div>
                <h2>Welcome to Guardian Security Enhanced Dashboard</h2>
                <p>Your comprehensive AI-powered code security and quality analysis platform</p>
            </div>

            <div class="welcome-grid">
                <div class="feature-card" onclick="runAnalysis('analyzeSecurity')">
                    <div class="feature-icon">🚨</div>
                    <div class="feature-title">Security Analysis</div>
                    <div class="feature-description">
                        Advanced vulnerability detection using AI-powered pattern recognition to identify security risks, injection vulnerabilities, and unsafe coding practices.
                    </div>
                </div>

                <div class="feature-card" onclick="runAnalysis('analyzeQuality')">
                    <div class="feature-icon">📊</div>
                    <div class="feature-title">Code Quality Assessment</div>
                    <div class="feature-description">
                        Comprehensive code quality analysis including maintainability scores, complexity metrics, and technical debt assessment.
                    </div>
                </div>

                <div class="feature-card" onclick="runAnalysis('detectSecrets')">
                    <div class="feature-icon">🔐</div>
                    <div class="feature-title">Secret Detection</div>
                    <div class="feature-description">
                        Intelligent detection of exposed secrets, API keys, passwords, and sensitive information using advanced pattern matching.
                    </div>
                </div>

                <div class="feature-card" onclick="runAnalysis('getAiSuggestions')">
                    <div class="feature-icon">💡</div>
                    <div class="feature-title">AI-Powered Suggestions</div>
                    <div class="feature-description">
                        Get intelligent recommendations for code improvements, best practices, and optimization opportunities.
                    </div>
                </div>

                <div class="feature-card" onclick="runAnalysis('runAllAnalysis')">
                    <div class="feature-icon">🔄</div>
                    <div class="feature-title">Comprehensive Analysis</div>
                    <div class="feature-description">
                        Run all analysis tools simultaneously for a complete security and quality assessment of your code.
                    </div>
                </div>

                <div class="feature-card" onclick="exportReport()">
                    <div class="feature-icon">📄</div>
                    <div class="feature-title">Export Reports</div>
                    <div class="feature-description">
                        Generate detailed reports in multiple formats for documentation, compliance, and team collaboration.
                    </div>
                </div>
            </div>

            <div class="section" style="margin-top: 40px;">
                <div class="section-content">
                    <h3 style="color: var(--info-color); margin-bottom: 20px;">🚀 Quick Start Guide</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                        <div style="padding: 20px; background: var(--vscode-panel-background); border-radius: var(--border-radius); border: 1px solid var(--vscode-panel-border);">
                            <h4 style="margin-top: 0; color: var(--primary-color);">1. Open Your Code</h4>
                            <p style="margin: 0; font-size: 14px;">Open any code file in VS Code editor to begin analysis</p>
                        </div>
                        <div style="padding: 20px; background: var(--vscode-panel-background); border-radius: var(--border-radius); border: 1px solid var(--vscode-panel-border);">
                            <h4 style="margin-top: 0; color: var(--primary-color);">2. Choose Analysis</h4>
                            <p style="margin: 0; font-size: 14px;">Select specific analysis or run comprehensive scan</p>
                        </div>
                        <div style="padding: 20px; background: var(--vscode-panel-background); border-radius: var(--border-radius); border: 1px solid var(--vscode-panel-border);">
                            <h4 style="margin-top: 0; color: var(--primary-color);">3. Review Results</h4>
                            <p style="margin: 0; font-size: 14px;">Get detailed insights and actionable recommendations</p>
                        </div>
                        <div style="padding: 20px; background: var(--vscode-panel-background); border-radius: var(--border-radius); border: 1px solid var(--vscode-panel-border);">
                            <h4 style="margin-top: 0; color: var(--primary-color);">4. Export & Share</h4>
                            <p style="margin: 0; font-size: 14px;">Generate reports for documentation and team collaboration</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}