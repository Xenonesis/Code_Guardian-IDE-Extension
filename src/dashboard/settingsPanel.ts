import * as vscode from 'vscode';

export interface GuardianSettings {
    autoAnalysis: boolean;
    analysisOnSave: boolean;
    showNotifications: boolean;
    securityLevel: 'basic' | 'standard' | 'strict';
    excludePatterns: string[];
    aiSuggestionsEnabled: boolean;
    reportFormat: 'html' | 'json' | 'markdown';
    theme: 'auto' | 'light' | 'dark';
}

export class SettingsPanel {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private settings: GuardianSettings;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.settings = this.loadSettings();
    }

    public createSettingsPanel() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'guardianSettings',
            '⚙️ Guardian Security Settings',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getSettingsWebviewContent();

        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'updateSettings':
                        this.updateSettings(message.settings);
                        break;
                    case 'resetSettings':
                        this.resetSettings();
                        break;
                    case 'exportSettings':
                        this.exportSettings();
                        break;
                    case 'importSettings':
                        this.importSettings();
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

    private loadSettings(): GuardianSettings {
        const config = vscode.workspace.getConfiguration('guardianSecurity');
        
        return {
            autoAnalysis: config.get('autoAnalysis', false),
            analysisOnSave: config.get('analysisOnSave', true),
            showNotifications: config.get('showNotifications', true),
            securityLevel: config.get('securityLevel', 'standard'),
            excludePatterns: config.get('excludePatterns', ['node_modules/**', '*.min.js', 'dist/**']),
            aiSuggestionsEnabled: config.get('aiSuggestionsEnabled', true),
            reportFormat: config.get('reportFormat', 'html'),
            theme: config.get('theme', 'auto')
        };
    }

    private async updateSettings(newSettings: Partial<GuardianSettings>) {
        const config = vscode.workspace.getConfiguration('guardianSecurity');
        
        for (const [key, value] of Object.entries(newSettings)) {
            await config.update(key, value, vscode.ConfigurationTarget.Global);
        }

        this.settings = { ...this.settings, ...newSettings };
        
        vscode.window.showInformationMessage('Guardian Security settings updated successfully!');
        
        // Refresh the webview
        if (this.panel) {
            this.panel.webview.html = this.getSettingsWebviewContent();
        }
    }

    private async resetSettings() {
        const config = vscode.workspace.getConfiguration('guardianSecurity');
        const defaultSettings: GuardianSettings = {
            autoAnalysis: false,
            analysisOnSave: true,
            showNotifications: true,
            securityLevel: 'standard',
            excludePatterns: ['node_modules/**', '*.min.js', 'dist/**'],
            aiSuggestionsEnabled: true,
            reportFormat: 'html',
            theme: 'auto'
        };

        for (const [key, value] of Object.entries(defaultSettings)) {
            await config.update(key, value, vscode.ConfigurationTarget.Global);
        }

        this.settings = defaultSettings;
        
        vscode.window.showInformationMessage('Guardian Security settings reset to defaults!');
        
        if (this.panel) {
            this.panel.webview.html = this.getSettingsWebviewContent();
        }
    }

    private async exportSettings() {
        const settingsJson = JSON.stringify(this.settings, null, 2);
        
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file('guardian-security-settings.json'),
            filters: {
                'JSON Files': ['json']
            }
        });

        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(settingsJson, 'utf8'));
            vscode.window.showInformationMessage(`Settings exported to ${uri.fsPath}`);
        }
    }

    private async importSettings() {
        const uris = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'JSON Files': ['json']
            }
        });

        if (uris && uris.length > 0) {
            try {
                const fileContent = await vscode.workspace.fs.readFile(uris[0]);
                const importedSettings = JSON.parse(fileContent.toString());
                
                await this.updateSettings(importedSettings);
                vscode.window.showInformationMessage('Settings imported successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to import settings: ${error}`);
            }
        }
    }

    public getSettings(): GuardianSettings {
        return this.settings;
    }

    private getSettingsWebviewContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Guardian Security Settings</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        line-height: 1.6;
                    }

                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }

                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }

                    .header h1 {
                        margin: 0;
                        color: var(--vscode-textLink-foreground);
                        font-size: 2.5em;
                        font-weight: 300;
                    }

                    .settings-section {
                        background: var(--vscode-sideBar-background);
                        margin-bottom: 30px;
                        padding: 25px;
                        border-radius: 8px;
                        border: 1px solid var(--vscode-panel-border);
                    }

                    .section-title {
                        font-size: 1.3em;
                        font-weight: 600;
                        margin-bottom: 20px;
                        color: var(--vscode-textLink-foreground);
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .setting-item {
                        margin-bottom: 20px;
                        padding: 15px;
                        background: var(--vscode-panel-background);
                        border-radius: 6px;
                        border: 1px solid var(--vscode-panel-border);
                    }

                    .setting-label {
                        font-weight: 500;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .setting-description {
                        font-size: 0.9em;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 10px;
                    }

                    .setting-control {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    input[type="checkbox"] {
                        width: 18px;
                        height: 18px;
                        accent-color: var(--vscode-button-background);
                    }

                    select, input[type="text"] {
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        padding: 8px 12px;
                        font-size: 14px;
                        min-width: 200px;
                    }

                    select:focus, input[type="text"]:focus {
                        outline: none;
                        border-color: var(--vscode-focusBorder);
                    }

                    .btn {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: background-color 0.2s;
                        margin-right: 10px;
                    }

                    .btn:hover {
                        background: var(--vscode-button-hoverBackground);
                    }

                    .btn-secondary {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }

                    .btn-secondary:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }

                    .btn-danger {
                        background: var(--vscode-inputValidation-errorBackground);
                        color: var(--vscode-inputValidation-errorForeground);
                    }

                    .actions {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid var(--vscode-panel-border);
                    }

                    .exclude-patterns {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .pattern-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .pattern-item input {
                        flex: 1;
                    }

                    .remove-pattern {
                        background: var(--vscode-inputValidation-errorBackground);
                        color: var(--vscode-inputValidation-errorForeground);
                        border: none;
                        padding: 5px 10px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                    }

                    .add-pattern {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 13px;
                        margin-top: 10px;
                    }

                    .security-level-info {
                        margin-top: 10px;
                        padding: 10px;
                        background: var(--vscode-textCodeBlock-background);
                        border-radius: 4px;
                        font-size: 0.9em;
                    }

                    @media (max-width: 600px) {
                        .container {
                            padding: 10px;
                        }
                        
                        .setting-control {
                            flex-direction: column;
                            align-items: stretch;
                        }
                        
                        select, input[type="text"] {
                            min-width: auto;
                            width: 100%;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚙️ Guardian Security Settings</h1>
                        <p>Configure Guardian Security to match your workflow and preferences</p>
                    </div>

                    <div class="settings-section">
                        <div class="section-title">
                            <span>🔄</span> Analysis Behavior
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-label">
                                <span>🚀</span> Auto Analysis
                            </div>
                            <div class="setting-description">
                                Automatically run analysis when files are opened or changed
                            </div>
                            <div class="setting-control">
                                <input type="checkbox" id="autoAnalysis" ${this.settings.autoAnalysis ? 'checked' : ''}>
                                <label for="autoAnalysis">Enable automatic analysis</label>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-label">
                                <span>💾</span> Analysis on Save
                            </div>
                            <div class="setting-description">
                                Run analysis automatically when you save a file
                            </div>
                            <div class="setting-control">
                                <input type="checkbox" id="analysisOnSave" ${this.settings.analysisOnSave ? 'checked' : ''}>
                                <label for="analysisOnSave">Analyze on file save</label>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-label">
                                <span>🔒</span> Security Level
                            </div>
                            <div class="setting-description">
                                Choose the strictness level for security analysis
                            </div>
                            <div class="setting-control">
                                <select id="securityLevel">
                                    <option value="basic" ${this.settings.securityLevel === 'basic' ? 'selected' : ''}>Basic - Essential checks only</option>
                                    <option value="standard" ${this.settings.securityLevel === 'standard' ? 'selected' : ''}>Standard - Balanced approach</option>
                                    <option value="strict" ${this.settings.securityLevel === 'strict' ? 'selected' : ''}>Strict - Comprehensive analysis</option>
                                </select>
                            </div>
                            <div class="security-level-info" id="securityLevelInfo">
                                ${this.getSecurityLevelDescription(this.settings.securityLevel)}
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="section-title">
                            <span>🔔</span> Notifications & UI
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-label">
                                <span>📢</span> Show Notifications
                            </div>
                            <div class="setting-description">
                                Display notifications for analysis results and alerts
                            </div>
                            <div class="setting-control">
                                <input type="checkbox" id="showNotifications" ${this.settings.showNotifications ? 'checked' : ''}>
                                <label for="showNotifications">Enable notifications</label>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-label">
                                <span>🎨</span> Theme
                            </div>
                            <div class="setting-description">
                                Choose the theme for Guardian Security interface
                            </div>
                            <div class="setting-control">
                                <select id="theme">
                                    <option value="auto" ${this.settings.theme === 'auto' ? 'selected' : ''}>Auto (Follow VS Code)</option>
                                    <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Light Theme</option>
                                    <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Dark Theme</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="section-title">
                            <span>🤖</span> AI Features
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-label">
                                <span>💡</span> AI Suggestions
                            </div>
                            <div class="setting-description">
                                Enable AI-powered code improvement suggestions
                            </div>
                            <div class="setting-control">
                                <input type="checkbox" id="aiSuggestionsEnabled" ${this.settings.aiSuggestionsEnabled ? 'checked' : ''}>
                                <label for="aiSuggestionsEnabled">Enable AI suggestions</label>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="section-title">
                            <span>📄</span> Reports & Export
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-label">
                                <span>📋</span> Report Format
                            </div>
                            <div class="setting-description">
                                Default format for exported analysis reports
                            </div>
                            <div class="setting-control">
                                <select id="reportFormat">
                                    <option value="html" ${this.settings.reportFormat === 'html' ? 'selected' : ''}>HTML Report</option>
                                    <option value="json" ${this.settings.reportFormat === 'json' ? 'selected' : ''}>JSON Data</option>
                                    <option value="markdown" ${this.settings.reportFormat === 'markdown' ? 'selected' : ''}>Markdown</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="settings-section">
                        <div class="section-title">
                            <span>🚫</span> Exclude Patterns
                        </div>
                        
                        <div class="setting-item">
                            <div class="setting-label">
                                <span>📁</span> File Exclusions
                            </div>
                            <div class="setting-description">
                                Specify file patterns to exclude from analysis (glob patterns supported)
                            </div>
                            <div class="exclude-patterns" id="excludePatterns">
                                ${this.settings.excludePatterns.map((pattern, index) => `
                                    <div class="pattern-item">
                                        <input type="text" value="${pattern}" data-index="${index}">
                                        <button class="remove-pattern" onclick="removePattern(${index})">Remove</button>
                                    </div>
                                `).join('')}
                            </div>
                            <button class="add-pattern" onclick="addPattern()">+ Add Pattern</button>
                        </div>
                    </div>

                    <div class="actions">
                        <button class="btn" onclick="saveSettings()">💾 Save Settings</button>
                        <button class="btn btn-secondary" onclick="exportSettings()">📤 Export Settings</button>
                        <button class="btn btn-secondary" onclick="importSettings()">📥 Import Settings</button>
                        <button class="btn btn-danger" onclick="resetSettings()">🔄 Reset to Defaults</button>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function saveSettings() {
                        const settings = {
                            autoAnalysis: document.getElementById('autoAnalysis').checked,
                            analysisOnSave: document.getElementById('analysisOnSave').checked,
                            showNotifications: document.getElementById('showNotifications').checked,
                            securityLevel: document.getElementById('securityLevel').value,
                            aiSuggestionsEnabled: document.getElementById('aiSuggestionsEnabled').checked,
                            reportFormat: document.getElementById('reportFormat').value,
                            theme: document.getElementById('theme').value,
                            excludePatterns: Array.from(document.querySelectorAll('#excludePatterns input')).map(input => input.value).filter(v => v.trim())
                        };

                        vscode.postMessage({
                            command: 'updateSettings',
                            settings: settings
                        });
                    }

                    function resetSettings() {
                        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
                            vscode.postMessage({ command: 'resetSettings' });
                        }
                    }

                    function exportSettings() {
                        vscode.postMessage({ command: 'exportSettings' });
                    }

                    function importSettings() {
                        vscode.postMessage({ command: 'importSettings' });
                    }

                    function addPattern() {
                        const container = document.getElementById('excludePatterns');
                        const index = container.children.length;
                        const patternDiv = document.createElement('div');
                        patternDiv.className = 'pattern-item';
                        patternDiv.innerHTML = \`
                            <input type="text" placeholder="e.g., *.min.js" data-index="\${index}">
                            <button class="remove-pattern" onclick="removePattern(\${index})">Remove</button>
                        \`;
                        container.appendChild(patternDiv);
                    }

                    function removePattern(index) {
                        const container = document.getElementById('excludePatterns');
                        const items = container.querySelectorAll('.pattern-item');
                        if (items[index]) {
                            items[index].remove();
                        }
                    }

                    // Update security level description
                    document.getElementById('securityLevel').addEventListener('change', function() {
                        const level = this.value;
                        const descriptions = {
                            'basic': 'Basic level performs essential security checks with minimal false positives. Suitable for quick scans.',
                            'standard': 'Standard level provides balanced security analysis with good coverage and reasonable performance.',
                            'strict': 'Strict level performs comprehensive analysis with maximum security coverage. May have more false positives.'
                        };
                        document.getElementById('securityLevelInfo').textContent = descriptions[level];
                    });

                    // Auto-save on certain changes
                    document.addEventListener('change', function(e) {
                        if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') {
                            // Auto-save for immediate feedback
                            setTimeout(saveSettings, 500);
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }

    private getSecurityLevelDescription(level: string): string {
        const descriptions = {
            'basic': 'Basic level performs essential security checks with minimal false positives. Suitable for quick scans.',
            'standard': 'Standard level provides balanced security analysis with good coverage and reasonable performance.',
            'strict': 'Strict level performs comprehensive analysis with maximum security coverage. May have more false positives.'
        };
        return descriptions[level as keyof typeof descriptions] || descriptions.standard;
    }

    public dispose(): void {
        if (this.panel) {
            this.panel.dispose();
        }
    }
}