import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Register a simple command to test
    const disposable = vscode.commands.registerCommand('codeGuardian.test', () => {
        vscode.window.showInformationMessage('Code Guardian is working!');
    });
    
    context.subscriptions.push(disposable);
}

export function deactivate() {
    // Extension cleanup
}