import * as vscode from 'vscode';
import { modernCSS } from './modernStyles';
import { modernHTML } from './modernHTML';
import { modernJavaScript } from './modernJS';

export class ModernDashboard {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private currentTheme: string = 'dark';
    private analysisHistory: any[] = [];
    private isAnalyzing: boolean = false;
    private realTimeData: any = {};

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.detectTheme();
        this.loadAnalysisHistory();
    }

    private detectTheme() {
        const config = vscode.workspace.getConfiguration();
        const theme = config.get('workbench.colorTheme', '');
        this.currentTheme = theme.toLowerCase().includes('light') ? 'light' : 'dark';
    }

    private loadAnalysisHistory() {
        try {
            const historyData = this.context.globalState.get('guardianAnalysisHistory', []);
            this.analysisHistory = Array.isArray(historyData) ? historyData : [];
        } catch (error) {
            this.analysisHistory = [];
        }
    }

    private saveAnalysisHistory() {
        try {
            this.context.globalState.update('guardianAnalysisHistory', this.analysisHistory);
        } catch (error) {
            console.error('Failed to save analysis history:', error);
        }
    }

    public createModernDashboard() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'guardianModernDashboard',
            '🛡️ Guardian Security - Modern Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')]
            }
        );

        this.panel.webview.html = this.getModernDashboardHTML();
        this.setupMessageHandling();

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        this.startRealTimeUpdates();
    }

    private setupMessageHandling() {
        if (!this.panel) {
            return;
        }

        this.panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'runAnalysis':
                        await this.handleAnalysisCommand(message.type);
                        break;
                    case 'exportReport':
                        await this.exportAdvancedReport(message.format, message.data);
                        break;
                    case 'clearHistory':
                        this.clearAnalysisHistory();
                        break;
                    case 'toggleTheme':
                        this.toggleTheme();
                        break;
                    case 'openFile':
                        await this.openFileAtLine(message.file, message.line);
                        break;
                    case 'fixIssue':
                        await this.autoFixIssue(message.issue);
                        break;
                    case 'ignoreIssue':
                        await this.ignoreIssue(message.issue);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    private async handleAnalysisCommand(type: string) {
        this.setAnalyzing(true);
        
        const commands: { [key: string]: string } = {
            'security': 'codeGuardian.analyzeSecurity',
            'quality': 'codeGuardian.analyzeQuality',
            'secrets': 'codeGuardian.detectSecrets',
            'devops': 'codeGuardian.analyzeDevOps',
            'database': 'codeGuardian.analyzeDatabase',
            'fullstack': 'codeGuardian.analyzeFullStack',
            'comprehensive': 'codeGuardian.comprehensiveAnalysis',
            'smart': 'codeGuardian.smartAnalysis'
        };

        if (commands[type]) {
            await vscode.commands.executeCommand(commands[type]);
        }
    }

    public updateDashboard(data?: any) {
        if (this.panel && data) {
            this.setAnalyzing(false);
            this.addToHistory(data);
            this.realTimeData = data;
            
            this.panel.webview.postMessage({
                command: 'updateData',
                data: data,
                timestamp: new Date().toISOString()
            });
        }
    }

    private setAnalyzing(analyzing: boolean) {
        this.isAnalyzing = analyzing;
        if (this.panel) {
            this.panel.webview.postMessage({ 
                command: 'setAnalyzing', 
                analyzing,
                timestamp: new Date().toISOString()
            });
        }
    }

    private addToHistory(data: any) {
        const historyEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            data: data,
            summary: this.generateSummary(data),
            fileInfo: data.metadata || {}
        };
        
        this.analysisHistory.unshift(historyEntry);
        if (this.analysisHistory.length > 50) {
            this.analysisHistory = this.analysisHistory.slice(0, 50);
        }
        
        this.saveAnalysisHistory();
    }

    private generateSummary(data: any): string {
        const vulnerabilities = data.vulnerabilities?.length || 0;
        const secrets = data.secrets?.length || 0;
        const devopsIssues = data.devopsResults?.vulnerabilities?.length || 0;
        const databaseIssues = data.databaseResults?.vulnerabilities?.length || 0;
        const fullStackIssues = data.fullStackResults?.vulnerabilities?.length || 0;
        const qualityScore = data.qualityMetrics?.maintainabilityScore || 0;
        const suggestions = data.suggestions?.length || 0;

        const totalIssues = vulnerabilities + secrets + devopsIssues + databaseIssues + fullStackIssues;

        return `${totalIssues} issues, ${qualityScore}% quality, ${suggestions} suggestions`;
    }

    private async exportAdvancedReport(format: string, data: any) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `guardian-security-report-${timestamp}`;
        
        let content = '';
        let extension = '';
        
        switch (format) {
            case 'json':
                content = JSON.stringify(data, null, 2);
                extension = 'json';
                break;
            case 'csv':
                content = this.generateCSVReport(data);
                extension = 'csv';
                break;
            default:
                content = this.generateHTMLReport(data);
                extension = 'html';
        }

        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`${fileName}.${extension}`),
            filters: {
                'HTML Files': ['html'],
                'JSON Files': ['json'],
                'CSV Files': ['csv']
            }
        });

        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
            vscode.window.showInformationMessage(`Report exported to ${uri.fsPath}`);
        }
    }

    private generateHTMLReport(data: any): string {
        const timestamp = new Date().toLocaleString();
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guardian Security Report - ${timestamp}</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .section { padding: 20px; border-bottom: 1px solid #eee; }
        .metric-card { display: inline-block; background: #f8f9fa; padding: 15px; margin: 10px; border-radius: 6px; min-width: 150px; text-align: center; }
        .issue { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .critical { border-left-color: #dc3545; background: #f8d7da; }
        .high { border-left-color: #fd7e14; background: #fff3cd; }
        .medium { border-left-color: #ffc107; background: #fff3cd; }
        .low { border-left-color: #28a745; background: #d4edda; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Guardian Security Report</h1>
            <p>Generated on: ${timestamp}</p>
        </div>
        ${this.formatAnalysisDataForReport(data)}
    </div>
</body>
</html>`;
    }

    private generateCSVReport(data: any): string {
        let csv = 'Type,Severity,Description,File,Line\n';
        
        if (data.vulnerabilities) {
            data.vulnerabilities.forEach((vuln: any) => {
                csv += `Security,${vuln.severity || 'Medium'},"${vuln.description || vuln}",${data.metadata?.fileName || ''},${vuln.line || ''}\n`;
            });
        }
        
        if (data.secrets) {
            data.secrets.forEach((secret: any) => {
                csv += `Secret,High,"${secret.description || secret}",${data.metadata?.fileName || ''},${secret.line || ''}\n`;
            });
        }
        
        return csv;
    }

    private formatAnalysisDataForReport(data: any): string {
        let html = '<div class="section">';
        
        html += '<h2>📊 Analysis Overview</h2>';
        html += '<div class="metrics">';
        html += `<div class="metric-card"><h3>${data.vulnerabilities?.length || 0}</h3><p>Security Issues</p></div>`;
        html += `<div class="metric-card"><h3>${data.secrets?.length || 0}</h3><p>Secrets Found</p></div>`;
        html += `<div class="metric-card"><h3>${data.qualityMetrics?.maintainabilityScore || 0}%</h3><p>Quality Score</p></div>`;
        html += `<div class="metric-card"><h3>${data.suggestions?.length || 0}</h3><p>AI Suggestions</p></div>`;
        html += '</div></div>';

        if (data.vulnerabilities?.length > 0) {
            html += '<div class="section"><h2>🚨 Security Vulnerabilities</h2>';
            data.vulnerabilities.forEach((vuln: any) => {
                const severity = (vuln.severity || 'medium').toLowerCase();
                html += `<div class="issue ${severity}"><strong>${vuln.type || 'Security Issue'}</strong><br>${vuln.description || vuln}</div>`;
            });
            html += '</div>';
        }

        if (data.secrets?.length > 0) {
            html += '<div class="section"><h2>🔐 Detected Secrets</h2>';
            data.secrets.forEach((secret: any) => {
                html += `<div class="issue high"><strong>Secret Detected</strong><br>${secret.description || secret}</div>`;
            });
            html += '</div>';
        }

        return html;
    }

    private async openFileAtLine(file: string, line: number) {
        try {
            const document = await vscode.workspace.openTextDocument(file);
            const editor = await vscode.window.showTextDocument(document);
            
            if (line > 0) {
                const position = new vscode.Position(line - 1, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position));
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Could not open file: ${error}`);
        }
    }

    private async autoFixIssue(issue: any) {
        vscode.window.showInformationMessage(`Auto-fixing issue: ${issue.type}`);
    }

    private async ignoreIssue(issue: any) {
        const ignoreList: string[] = this.context.globalState.get('guardianIgnoreList', []);
        ignoreList.push(issue.id);
        await this.context.globalState.update('guardianIgnoreList', ignoreList);
        
        vscode.window.showInformationMessage('Issue added to ignore list');
        this.updateDashboard();
    }

    private clearAnalysisHistory() {
        this.analysisHistory = [];
        this.saveAnalysisHistory();
        if (this.panel) {
            this.panel.webview.postMessage({ command: 'historyCleared' });
        }
    }

    private toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        if (this.panel) {
            this.panel.webview.html = this.getModernDashboardHTML();
        }
    }

    private startRealTimeUpdates() {
        setInterval(() => {
            if (this.panel && this.realTimeData) {
                this.panel.webview.postMessage({
                    command: 'heartbeat',
                    timestamp: new Date().toISOString(),
                    isAnalyzing: this.isAnalyzing
                });
            }
        }, 5000);
    }

    private getModernDashboardHTML(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guardian Security - Modern Dashboard</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        ${modernCSS}
    </style>
</head>
<body class="${this.currentTheme}">
    <div id="app">
        ${modernHTML}
    </div>
    <script>
        ${modernJavaScript}
    </script>
</body>
</html>`;
    }

    private getModernCSS(): string {
        return modernCSS;
    }

    private getModernHTML(): string {
        return modernHTML;
    }

    private getModernJavaScript(): string {
        return modernJavaScript;
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}