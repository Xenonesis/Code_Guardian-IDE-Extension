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
export declare class SettingsPanel {
    private panel;
    private context;
    private settings;
    constructor(context: vscode.ExtensionContext);
    createSettingsPanel(): void;
    private loadSettings;
    private updateSettings;
    private resetSettings;
    private exportSettings;
    private importSettings;
    getSettings(): GuardianSettings;
    private getSettingsWebviewContent;
    private getSecurityLevelDescription;
    dispose(): void;
}
//# sourceMappingURL=settingsPanel.d.ts.map