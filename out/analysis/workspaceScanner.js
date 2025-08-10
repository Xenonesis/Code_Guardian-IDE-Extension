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
exports.WorkspaceScanner = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const securityAnalysis_1 = require("./securityAnalysis");
const secretDetection_1 = require("./secretDetection");
const codeQuality_1 = require("./codeQuality");
class WorkspaceScanner {
    constructor() {
        this.scanResults = new Map();
        this.isScanning = false;
        this.securityAnalysis = new securityAnalysis_1.SecurityAnalysis();
        this.secretDetection = new secretDetection_1.SecretDetection();
        this.codeQuality = new codeQuality_1.CodeQuality();
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('guardianSecurity');
        this.setupFileWatcher();
    }
    setupFileWatcher() {
        // Watch for file changes in the workspace
        this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{js,ts,jsx,tsx,py,java,cs,php,rb,go,rs,cpp,c,h,hpp}', false, // ignoreCreateEvents
        false, // ignoreChangeEvents
        false // ignoreDeleteEvents
        );
        // Auto-scan on file changes if enabled
        this.fileWatcher.onDidChange(async (uri) => {
            const config = vscode.workspace.getConfiguration('guardianSecurity');
            if (config.get('autoAnalysis') || config.get('analysisOnSave')) {
                await this.scanFile(uri.fsPath);
            }
        });
        this.fileWatcher.onDidCreate(async (uri) => {
            const config = vscode.workspace.getConfiguration('guardianSecurity');
            if (config.get('autoAnalysis')) {
                await this.scanFile(uri.fsPath);
            }
        });
        this.fileWatcher.onDidDelete((uri) => {
            this.clearFileResults(uri.fsPath);
        });
        // Also listen to document save events
        vscode.workspace.onDidSaveTextDocument(async (document) => {
            const config = vscode.workspace.getConfiguration('guardianSecurity');
            if (config.get('analysisOnSave')) {
                await this.scanFile(document.fileName);
            }
        });
    }
    async scanWorkspace(options) {
        if (this.isScanning) {
            vscode.window.showWarningMessage('Workspace scan already in progress');
            return Array.from(this.scanResults.values());
        }
        this.isScanning = true;
        const results = [];
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Guardian Security: Scanning Workspace',
                cancellable: true
            }, async (progress, token) => {
                this.scanProgress = progress;
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) {
                    throw new Error('No workspace folder found');
                }
                const defaultOptions = {
                    includePatterns: ['**/*.{js,ts,jsx,tsx,py,java,cs,php,rb,go,rs,cpp,c,h,hpp}'],
                    excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.min.js', '**/vendor/**'],
                    maxFileSize: 512 * 1024,
                    enableRealTimeScanning: true,
                    scanDepth: 8 // Reduced depth for better performance
                };
                const scanOptions = { ...defaultOptions, ...options };
                const config = vscode.workspace.getConfiguration('guardianSecurity');
                const userExcludePatterns = config.get('excludePatterns') || [];
                scanOptions.excludePatterns = [...(scanOptions.excludePatterns || []), ...userExcludePatterns];
                // Process folders in parallel with limited concurrency
                const concurrencyLimit = 3;
                const folderPromises = [];
                for (let i = 0; i < workspaceFolders.length; i += concurrencyLimit) {
                    const batch = workspaceFolders.slice(i, i + concurrencyLimit);
                    for (const folder of batch) {
                        if (token.isCancellationRequested) {
                            break;
                        }
                        progress.report({ message: `Scanning ${folder.name}...` });
                        folderPromises.push(this.scanFolder(folder.uri.fsPath, scanOptions, progress, token));
                    }
                    // Wait for current batch to complete before starting next
                    const batchResults = await Promise.all(folderPromises.splice(0, batch.length));
                    results.push(...batchResults.flat());
                    if (token.isCancellationRequested) {
                        break;
                    }
                }
                // Update diagnostics for all scanned files (batched)
                this.updateAllDiagnosticsBatched();
                progress.report({ message: `Scan complete. Found ${results.length} files with issues.` });
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Workspace scan failed: ${error}`);
        }
        finally {
            this.isScanning = false;
            this.scanProgress = undefined;
        }
        return results;
    }
    async scanFolder(folderPath, options, progress, token) {
        const results = [];
        try {
            const files = await this.getFilesToScan(folderPath, options);
            const totalFiles = files.length;
            for (let i = 0; i < files.length; i++) {
                if (token.isCancellationRequested) {
                    break;
                }
                const file = files[i];
                const relativePath = path.relative(folderPath, file);
                progress.report({
                    message: `Scanning ${relativePath}...`,
                    increment: (1 / totalFiles) * 100
                });
                try {
                    const result = await this.scanFile(file);
                    if (result && this.hasIssues(result)) {
                        results.push(result);
                    }
                }
                catch (error) {
                    console.error(`Error scanning file ${file}:`, error);
                }
                // Small delay to prevent blocking the UI
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        catch (error) {
            console.error(`Error scanning folder ${folderPath}:`, error);
        }
        return results;
    }
    async getFilesToScan(folderPath, options) {
        const files = [];
        const includePattern = options.includePatterns?.[0] || '**/*.{js,ts,jsx,tsx,py,java,cs,php,rb,go,rs,cpp,c,h,hpp}';
        const fileUris = await vscode.workspace.findFiles(new vscode.RelativePattern(folderPath, includePattern), `{${options.excludePatterns?.join(',') || ''}}`);
        for (const uri of fileUris) {
            try {
                const stat = await vscode.workspace.fs.stat(uri);
                if (stat.size <= (options.maxFileSize || 1024 * 1024)) {
                    files.push(uri.fsPath);
                }
            }
            catch (error) {
                console.error(`Error checking file ${uri.fsPath}:`, error);
            }
        }
        return files;
    }
    async scanFile(filePath) {
        try {
            const uri = vscode.Uri.file(filePath);
            const document = await vscode.workspace.openTextDocument(uri);
            const code = document.getText();
            if (!code.trim()) {
                return null;
            }
            // Run all analyses
            const [vulnerabilities, secrets, qualityMetrics] = await Promise.all([
                this.securityAnalysis.analyzeSecurity(code),
                this.secretDetection.detectSecrets(code),
                this.codeQuality.getQualityMetrics(code)
            ]);
            const result = {
                filePath,
                vulnerabilities,
                secrets,
                qualityIssues: qualityMetrics.issues,
                severity: this.calculateSeverity(vulnerabilities, secrets, qualityMetrics.issues)
            };
            // Store result and update diagnostics
            this.scanResults.set(filePath, result);
            this.updateFileDiagnostics(filePath, result);
            return result;
        }
        catch (error) {
            console.error(`Error scanning file ${filePath}:`, error);
            return null;
        }
    }
    calculateSeverity(vulnerabilities, secrets, qualityIssues) {
        const criticalKeywords = ['injection', 'XSS', 'password', 'private key', 'eval'];
        const highKeywords = ['insecure', 'vulnerability', 'secret', 'API key'];
        // Check for critical issues
        const hasCritical = [...vulnerabilities, ...secrets].some(issue => criticalKeywords.some(keyword => issue.toLowerCase().includes(keyword.toLowerCase())));
        if (hasCritical) {
            return 'critical';
        }
        // Check for high severity issues
        const hasHigh = [...vulnerabilities, ...secrets].some(issue => highKeywords.some(keyword => issue.toLowerCase().includes(keyword.toLowerCase())));
        if (hasHigh || vulnerabilities.length > 3 || secrets.length > 2) {
            return 'high';
        }
        if (vulnerabilities.length > 0 || secrets.length > 0 || qualityIssues.length > 5) {
            return 'medium';
        }
        return 'low';
    }
    updateFileDiagnostics(filePath, result) {
        const uri = vscode.Uri.file(filePath);
        const diagnostics = [];
        // Add security vulnerabilities as diagnostics
        result.vulnerabilities.forEach((vuln, index) => {
            const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), // We'll improve line detection later
            vuln, this.getSeverityLevel(result.severity));
            diagnostic.source = 'Guardian Security';
            diagnostic.code = `security-${index}`;
            diagnostics.push(diagnostic);
        });
        // Add secrets as diagnostics
        result.secrets.forEach((secret, index) => {
            const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), secret, vscode.DiagnosticSeverity.Warning);
            diagnostic.source = 'Guardian Security';
            diagnostic.code = `secret-${index}`;
            diagnostics.push(diagnostic);
        });
        // Add quality issues as diagnostics
        result.qualityIssues.forEach((issue, index) => {
            const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), issue, vscode.DiagnosticSeverity.Information);
            diagnostic.source = 'Guardian Security';
            diagnostic.code = `quality-${index}`;
            diagnostics.push(diagnostic);
        });
        this.diagnosticCollection.set(uri, diagnostics);
    }
    getSeverityLevel(severity) {
        switch (severity) {
            case 'critical':
                return vscode.DiagnosticSeverity.Error;
            case 'high':
                return vscode.DiagnosticSeverity.Error;
            case 'medium':
                return vscode.DiagnosticSeverity.Warning;
            default:
                return vscode.DiagnosticSeverity.Information;
        }
    }
    updateAllDiagnostics() {
        for (const [filePath, result] of this.scanResults) {
            this.updateFileDiagnostics(filePath, result);
        }
    }
    updateAllDiagnosticsBatched() {
        // Process diagnostics in batches to avoid blocking the UI
        const entries = Array.from(this.scanResults.entries());
        const batchSize = 10;
        const processBatch = (startIndex) => {
            const endIndex = Math.min(startIndex + batchSize, entries.length);
            for (let i = startIndex; i < endIndex; i++) {
                const [filePath, result] = entries[i];
                this.updateFileDiagnostics(filePath, result);
            }
            if (endIndex < entries.length) {
                // Schedule next batch
                setTimeout(() => processBatch(endIndex), 0);
            }
        };
        if (entries.length > 0) {
            processBatch(0);
        }
    }
    hasIssues(result) {
        return result.vulnerabilities.length > 0 ||
            result.secrets.length > 0 ||
            result.qualityIssues.length > 0;
    }
    clearFileResults(filePath) {
        this.scanResults.delete(filePath);
        const uri = vscode.Uri.file(filePath);
        this.diagnosticCollection.delete(uri);
    }
    getScanResults() {
        return new Map(this.scanResults);
    }
    clearAllResults() {
        this.scanResults.clear();
        this.diagnosticCollection.clear();
    }
    dispose() {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
        this.diagnosticCollection.dispose();
    }
}
exports.WorkspaceScanner = WorkspaceScanner;
//# sourceMappingURL=workspaceScanner.js.map