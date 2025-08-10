import * as vscode from 'vscode';
export declare class EnhancedCodeGuardianTreeItem extends vscode.TreeItem {
    readonly label: string;
    readonly collapsibleState: vscode.TreeItemCollapsibleState;
    readonly command?: vscode.Command | undefined;
    readonly iconPath?: vscode.ThemeIcon | undefined;
    readonly contextValue?: string | undefined;
    readonly tooltip?: string | undefined;
    readonly description?: string | undefined;
    readonly severity?: "low" | "medium" | "high" | "critical" | undefined;
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, command?: vscode.Command | undefined, iconPath?: vscode.ThemeIcon | undefined, contextValue?: string | undefined, tooltip?: string | undefined, description?: string | undefined, severity?: "low" | "medium" | "high" | "critical" | undefined);
}
export declare class EnhancedCodeGuardianTreeProvider implements vscode.TreeDataProvider<EnhancedCodeGuardianTreeItem> {
    private _onDidChangeTreeData;
    readonly onDidChangeTreeData: vscode.Event<EnhancedCodeGuardianTreeItem | undefined | null | void>;
    private analysisResults;
    private analysisHistory;
    private isAnalyzing;
    constructor();
    refresh(): void;
    updateResults(results: any): void;
    setAnalyzing(analyzing: boolean): void;
    updateWorkspaceResults(workspaceResults: any[]): void;
    private addToHistory;
    private generateSummary;
    getTreeItem(element: EnhancedCodeGuardianTreeItem): vscode.TreeItem;
    getChildren(element?: EnhancedCodeGuardianTreeItem): Thenable<EnhancedCodeGuardianTreeItem[]>;
    private determineSeverity;
    clearHistory(): void;
}
//# sourceMappingURL=enhancedTreeViewProvider.d.ts.map