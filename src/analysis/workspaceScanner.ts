import * as vscode from 'vscode';
import * as path from 'path';
import { SecurityAnalysis } from './securityAnalysis';
import { SecretDetection } from './secretDetection';
import { CodeQuality } from './codeQuality';

export interface ScanResult {
    filePath: string;
    vulnerabilities: string[];
    secrets: string[];
    qualityIssues: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface WorkspaceScanOptions {
    includePatterns?: string[];
    excludePatterns?: string[];
    maxFileSize?: number;
    enableRealTimeScanning?: boolean;
    scanDepth?: number;
}

export class WorkspaceScanner {
    private securityAnalysis: SecurityAnalysis;
    private secretDetection: SecretDetection;
    private codeQuality: CodeQuality;
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private scanResults: Map<string, ScanResult> = new Map();
    private diagnosticCollection: vscode.DiagnosticCollection;
    private isScanning: boolean = false;
    private scanProgress: vscode.Progress<{ message?: string; increment?: number }> | undefined;

    constructor() {
        this.securityAnalysis = new SecurityAnalysis();
        this.secretDetection = new SecretDetection();
        this.codeQuality = new CodeQuality();
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('guardianSecurity');
        this.setupFileWatcher();
    }

    private setupFileWatcher(): void {
        // Watch for file changes in the workspace
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(
            '**/*.{js,ts,jsx,tsx,py,java,cs,php,rb,go,rs,cpp,c,h,hpp}',
            false, // ignoreCreateEvents
            false, // ignoreChangeEvents
            false  // ignoreDeleteEvents
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

    public async scanWorkspace(options?: WorkspaceScanOptions): Promise<ScanResult[]> {
        if (this.isScanning) {
            vscode.window.showWarningMessage('Workspace scan already in progress');
            return Array.from(this.scanResults.values());
        }

        this.isScanning = true;
        const results: ScanResult[] = [];

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

                const defaultOptions: WorkspaceScanOptions = {
                    includePatterns: ['**/*.{js,ts,jsx,tsx,py,java,cs,php,rb,go,rs,cpp,c,h,hpp}'],
                    excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.min.js', '**/vendor/**'],
                    maxFileSize: 512 * 1024, // Reduced to 512KB for better performance
                    enableRealTimeScanning: true,
                    scanDepth: 8 // Reduced depth for better performance
                };

                const scanOptions = { ...defaultOptions, ...options };
                const config = vscode.workspace.getConfiguration('guardianSecurity');
                const userExcludePatterns = config.get<string[]>('excludePatterns') || [];
                scanOptions.excludePatterns = [...(scanOptions.excludePatterns || []), ...userExcludePatterns];

                // Process folders in parallel with limited concurrency
                const concurrencyLimit = 3;
                const folderPromises: Promise<ScanResult[]>[] = [];
                
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

        } catch (error) {
            vscode.window.showErrorMessage(`Workspace scan failed: ${error}`);
        } finally {
            this.isScanning = false;
            this.scanProgress = undefined;
        }

        return results;
    }

    private async scanFolder(
        folderPath: string, 
        options: WorkspaceScanOptions,
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        token: vscode.CancellationToken
    ): Promise<ScanResult[]> {
        const results: ScanResult[] = [];
        
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
                } catch (error) {
                    console.error(`Error scanning file ${file}:`, error);
                }

                // Small delay to prevent blocking the UI
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } catch (error) {
            console.error(`Error scanning folder ${folderPath}:`, error);
        }

        return results;
    }

    private async getFilesToScan(folderPath: string, options: WorkspaceScanOptions): Promise<string[]> {
        const files: string[] = [];
        const includePattern = options.includePatterns?.[0] || '**/*.{js,ts,jsx,tsx,py,java,cs,php,rb,go,rs,cpp,c,h,hpp}';
        
        const fileUris = await vscode.workspace.findFiles(
            new vscode.RelativePattern(folderPath, includePattern),
            `{${options.excludePatterns?.join(',') || ''}}`
        );

        for (const uri of fileUris) {
            try {
                const stat = await vscode.workspace.fs.stat(uri);
                if (stat.size <= (options.maxFileSize || 1024 * 1024)) {
                    files.push(uri.fsPath);
                }
            } catch (error) {
                console.error(`Error checking file ${uri.fsPath}:`, error);
            }
        }

        return files;
    }

    public async scanFile(filePath: string): Promise<ScanResult | null> {
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

            const result: ScanResult = {
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
        } catch (error) {
            console.error(`Error scanning file ${filePath}:`, error);
            return null;
        }
    }

    private calculateSeverity(vulnerabilities: string[], secrets: string[], qualityIssues: string[]): 'low' | 'medium' | 'high' | 'critical' {
        const criticalKeywords = ['injection', 'XSS', 'password', 'private key', 'eval'];
        const highKeywords = ['insecure', 'vulnerability', 'secret', 'API key'];
        
        // Check for critical issues
        const hasCritical = [...vulnerabilities, ...secrets].some(issue => 
            criticalKeywords.some(keyword => issue.toLowerCase().includes(keyword.toLowerCase()))
        );
        
        if (hasCritical) {
            return 'critical';
        }
        
        // Check for high severity issues
        const hasHigh = [...vulnerabilities, ...secrets].some(issue => 
            highKeywords.some(keyword => issue.toLowerCase().includes(keyword.toLowerCase()))
        );
        
        if (hasHigh || vulnerabilities.length > 3 || secrets.length > 2) {
            return 'high';
        }
        if (vulnerabilities.length > 0 || secrets.length > 0 || qualityIssues.length > 5) {
            return 'medium';
        }
        
        return 'low';
    }

    private updateFileDiagnostics(filePath: string, result: ScanResult): void {
        const uri = vscode.Uri.file(filePath);
        const diagnostics: vscode.Diagnostic[] = [];

        // Add security vulnerabilities as diagnostics
        result.vulnerabilities.forEach((vuln, index) => {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0), // We'll improve line detection later
                vuln,
                this.getSeverityLevel(result.severity)
            );
            diagnostic.source = 'Guardian Security';
            diagnostic.code = `security-${index}`;
            diagnostics.push(diagnostic);
        });

        // Add secrets as diagnostics
        result.secrets.forEach((secret, index) => {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0),
                secret,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'Guardian Security';
            diagnostic.code = `secret-${index}`;
            diagnostics.push(diagnostic);
        });

        // Add quality issues as diagnostics
        result.qualityIssues.forEach((issue, index) => {
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0),
                issue,
                vscode.DiagnosticSeverity.Information
            );
            diagnostic.source = 'Guardian Security';
            diagnostic.code = `quality-${index}`;
            diagnostics.push(diagnostic);
        });

        this.diagnosticCollection.set(uri, diagnostics);
    }

    private getSeverityLevel(severity: string): vscode.DiagnosticSeverity {
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

    private updateAllDiagnostics(): void {
        for (const [filePath, result] of this.scanResults) {
            this.updateFileDiagnostics(filePath, result);
        }
    }

    private updateAllDiagnosticsBatched(): void {
        // Process diagnostics in batches to avoid blocking the UI
        const entries = Array.from(this.scanResults.entries());
        const batchSize = 10;
        
        const processBatch = (startIndex: number) => {
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

    private hasIssues(result: ScanResult): boolean {
        return result.vulnerabilities.length > 0 || 
               result.secrets.length > 0 || 
               result.qualityIssues.length > 0;
    }

    private clearFileResults(filePath: string): void {
        this.scanResults.delete(filePath);
        const uri = vscode.Uri.file(filePath);
        this.diagnosticCollection.delete(uri);
    }

    public getScanResults(): Map<string, ScanResult> {
        return new Map(this.scanResults);
    }

    public clearAllResults(): void {
        this.scanResults.clear();
        this.diagnosticCollection.clear();
    }

    public dispose(): void {
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
        }
        this.diagnosticCollection.dispose();
    }
}