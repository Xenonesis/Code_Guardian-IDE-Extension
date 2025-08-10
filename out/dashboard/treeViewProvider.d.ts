import * as vscode from 'vscode';
export declare class CodeGuardianTreeItem extends vscode.TreeItem {
    readonly label: string;
    readonly collapsibleState: vscode.TreeItemCollapsibleState;
    readonly command?: vscode.Command | undefined;
    readonly iconPath?: vscode.ThemeIcon | undefined;
    readonly contextValue?: string | undefined;
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, command?: vscode.Command | undefined, iconPath?: vscode.ThemeIcon | undefined, contextValue?: string | undefined);
}
export declare class CodeGuardianTreeProvider implements vscode.TreeDataProvider<CodeGuardianTreeItem> {
    private _onDidChangeTreeData;
    readonly onDidChangeTreeData: vscode.Event<CodeGuardianTreeItem | undefined | null | void>;
    private analysisResults;
    constructor();
    refresh(): void;
    updateResults(results: any): void;
    getTreeItem(element: CodeGuardianTreeItem): vscode.TreeItem;
    getChildren(element?: CodeGuardianTreeItem): Thenable<CodeGuardianTreeItem[]>;
}
//# sourceMappingURL=treeViewProvider.d.ts.map