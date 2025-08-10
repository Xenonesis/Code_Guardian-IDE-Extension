import * as vscode from 'vscode';
export declare class Webview {
    private panel;
    private context;
    private currentTheme;
    constructor(context: vscode.ExtensionContext);
    private detectTheme;
    createWebview(): void;
    updateWebview(data: any): void;
    private getWebviewContent;
    private formatAnalysisData;
    private getDefaultContent;
}
//# sourceMappingURL=webview.d.ts.map