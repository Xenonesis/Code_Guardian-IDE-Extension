import * as vscode from 'vscode';
import { AiProvider } from './ai/aiProvider';
import { GuardianChatbot } from './ai/chatbot';
import { SecurityAnalysis } from './analysis/securityAnalysis';
import { CodeQuality } from './analysis/codeQuality';
import { SecretDetection } from './analysis/secretDetection';
import { WorkspaceScanner } from './analysis/workspaceScanner';
import { LineHighlighter } from './analysis/lineHighlighter';
import { EnhancedWebview } from './dashboard/enhancedWebview';
import { ChatbotWebview } from './dashboard/chatbotWebview';
import { EnhancedCodeGuardianTreeProvider } from './dashboard/enhancedTreeViewProvider';
import { StatusBarManager } from './dashboard/statusBarManager';
import { NotificationManager } from './dashboard/notificationManager';
import { SettingsPanel } from './dashboard/settingsPanel';
import { measureAnalysis, perfMonitor } from './utils/performanceMonitor';

let analysisData: any = {};
let treeProvider: EnhancedCodeGuardianTreeProvider;
let statusBarManager: StatusBarManager;
let notificationManager: NotificationManager;
let enhancedWebview: EnhancedWebview;
let settingsPanel: SettingsPanel;
let chatbot: GuardianChatbot;
let chatbotWebview: ChatbotWebview;
let workspaceScanner: WorkspaceScanner;
let lineHighlighter: LineHighlighter;

export function activate(context: vscode.ExtensionContext) {
    console.log('Code Guardian extension is now active!');

    // Lazy initialization - only create instances when needed
    let aiProvider: AiProvider | undefined;
    let securityAnalysis: SecurityAnalysis | undefined;
    let codeQuality: CodeQuality | undefined;
    let secretDetection: SecretDetection | undefined;

    // Helper function for lazy initialization
    function getAiProvider() {
        if (!aiProvider) aiProvider = new AiProvider();
        return aiProvider;
    }

    function getSecurityAnalysis() {
        if (!securityAnalysis) securityAnalysis = new SecurityAnalysis();
        return securityAnalysis;
    }

    function getCodeQuality() {
        if (!codeQuality) codeQuality = new CodeQuality();
        return codeQuality;
    }

    function getSecretDetection() {
        if (!secretDetection) secretDetection = new SecretDetection();
        return secretDetection;
    }

    // Initialize core components only
    treeProvider = new EnhancedCodeGuardianTreeProvider();
    statusBarManager = new StatusBarManager();
    notificationManager = NotificationManager.getInstance();
    
    // Lazy initialize heavy components
    function getEnhancedWebview() {
        if (!enhancedWebview) enhancedWebview = new EnhancedWebview(context);
        return enhancedWebview;
    }

    function getSettingsPanel() {
        if (!settingsPanel) settingsPanel = new SettingsPanel(context);
        return settingsPanel;
    }

    function getChatbot() {
        if (!chatbot) chatbot = new GuardianChatbot(context);
        return chatbot;
    }

    function getChatbotWebview() {
        if (!chatbotWebview) chatbotWebview = new ChatbotWebview(context, getChatbot());
        return chatbotWebview;
    }

    function getWorkspaceScanner() {
        if (!workspaceScanner) {
            workspaceScanner = new WorkspaceScanner();
            context.subscriptions.push(workspaceScanner);
        }
        return workspaceScanner;
    }

    function getLineHighlighter() {
        if (!lineHighlighter) {
            lineHighlighter = new LineHighlighter();
            context.subscriptions.push(lineHighlighter);
        }
        return lineHighlighter;
    }

    // Initialize enhanced tree view
    vscode.window.createTreeView('codeGuardian.view', {
        treeDataProvider: treeProvider,
        showCollapseAll: true
    });

    // Add status bar manager to subscriptions
    context.subscriptions.push(statusBarManager);

    // Enhanced Auto-Detection System
    let analysisTimeout: NodeJS.Timeout | undefined;
    let lastAnalyzedContent = '';
    
    // Auto-analyze when active editor changes
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        if (editor && isSupportedLanguage(editor.document.languageId)) {
            const config = vscode.workspace.getConfiguration('guardianSecurity');
            if (config.get('autoAnalysis', false)) {
                // Delay analysis to avoid rapid switching
                setTimeout(() => runAutoAnalysis(editor), 1000);
            }
        }
    });

    // Auto-analyze when document content changes (with debouncing)
    vscode.workspace.onDidChangeTextDocument(async (event) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || event.document !== editor.document) return;
        
        const config = vscode.workspace.getConfiguration('guardianSecurity');
        if (!config.get('autoAnalysis', false)) return;
        
        if (!isSupportedLanguage(event.document.languageId)) return;

        // Clear existing timeout
        if (analysisTimeout) {
            clearTimeout(analysisTimeout);
        }

        // Debounce analysis - wait for user to stop typing
        analysisTimeout = setTimeout(() => {
            const currentContent = event.document.getText();
            // Only analyze if content has significantly changed
            if (hasSignificantChanges(lastAnalyzedContent, currentContent)) {
                lastAnalyzedContent = currentContent;
                runAutoAnalysis(editor);
            }
        }, 2000); // 2 second delay after user stops typing
    });

    // Auto-analyze on file save (immediate)
    vscode.workspace.onDidSaveTextDocument(async (document) => {
        const config = vscode.workspace.getConfiguration('guardianSecurity');
        if (!config.get('analysisOnSave', true)) return;
        
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === document && isSupportedLanguage(document.languageId)) {
            await runAutoAnalysis(editor);
        }
    });

    // Helper function to check if language is supported
    function isSupportedLanguage(languageId: string): boolean {
        const supportedLanguages = [
            'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
            'python', 'java', 'csharp', 'php', 'ruby', 'go', 'rust',
            'cpp', 'c', 'html', 'css', 'json', 'yaml', 'xml'
        ];
        return supportedLanguages.includes(languageId);
    }

    // Helper function to detect significant changes
    function hasSignificantChanges(oldContent: string, newContent: string): boolean {
        if (!oldContent) return true;
        
        // Calculate change percentage
        const oldLines = oldContent.split('\n').length;
        const newLines = newContent.split('\n').length;
        const lineDiff = Math.abs(oldLines - newLines);
        
        // Significant if more than 5 lines changed or 10% of content changed
        return lineDiff > 5 || Math.abs(oldContent.length - newContent.length) > oldContent.length * 0.1;
    }

    // Enhanced auto-analysis function
    async function runAutoAnalysis(editor: vscode.TextEditor) {
        try {
            setAnalyzing(true);
            
            const code = editor.document.getText();
            const languageId = editor.document.languageId;
            
            // Show subtle progress in status bar
            statusBarManager.showAutoAnalysisProgress();
            
            // Run analyses in parallel for speed
            const [vulnerabilities, qualityMetrics, secrets, suggestions] = await Promise.all([
                measureAnalysis('auto-security', () => getSecurityAnalysis().analyzeSecurity(code)),
                measureAnalysis('auto-quality', () => getCodeQuality().analyzeQuality(code)),
                measureAnalysis('auto-secrets', () => getSecretDetection().detectSecrets(code)),
                measureAnalysis('auto-ai', () => getAiProvider().getSuggestions(code))
            ]);

            // Update analysis data with metadata
            analysisData = {
                vulnerabilities,
                qualityMetrics,
                secrets,
                suggestions,
                metadata: {
                    fileName: editor.document.fileName,
                    languageId,
                    lineCount: editor.document.lineCount,
                    analyzedAt: new Date().toISOString(),
                    autoAnalysis: true
                }
            };

            setAnalyzing(false);
            updateAllGUI();
            
            // Show non-intrusive notifications for critical issues only
            const criticalIssues = vulnerabilities.filter((v: string) => 
                v.includes('[CRITICAL]') || v.includes('[HIGH]')
            ).length + secrets.filter((s: string) => 
                s.includes('[CRITICAL]') || s.includes('[HIGH]')
            ).length;
            
            if (criticalIssues > 0) {
                statusBarManager.showCriticalIssuesFound(criticalIssues);
            }
            
        } catch (error) {
            console.error('Auto-analysis failed:', error);
            setAnalyzing(false);
        }
    }

    // Show welcome message on first activation (only if no file is open)
    setTimeout(() => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            notificationManager.showContextualHelp('no-file-open');
        } else if (isSupportedLanguage(editor.document.languageId)) {
            // Auto-run analysis on supported files when extension first loads
            const config = vscode.workspace.getConfiguration('guardianSecurity');
            if (config.get('autoAnalysis', false)) {
                runAutoAnalysis(editor);
            }
        }
    }, 2000); // Delay to let VS Code finish loading

    // Helper function to update all GUI components
    function updateAllGUI() {
        // Update enhanced webview (only if it exists)
        if (enhancedWebview) {
            enhancedWebview.updateWebview(analysisData);
        }
        
        // Update tree provider
        treeProvider.updateResults(analysisData);
        
        // Update status bar with enhanced manager
        statusBarManager.updateStatus(analysisData);
        
        // Update line highlights for current file (only if line highlighter exists)
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && analysisData && lineHighlighter) {
            updateLineHighlights(activeEditor.document, analysisData);
        }
    }

    // Helper function to update line highlights
    function updateLineHighlights(document: vscode.TextDocument, data: any) {
        const highlights: any[] = [];
        
        if (data.vulnerabilities) {
            highlights.push(...lineHighlighter.highlightSecurityIssues(document, data.vulnerabilities));
        }
        
        if (data.secrets) {
            highlights.push(...lineHighlighter.highlightSecrets(document, data.secrets));
        }
        
        if (data.qualityMetrics?.issues) {
            highlights.push(...lineHighlighter.highlightQualityIssues(document, data.qualityMetrics.issues));
        }
        
        lineHighlighter.setHighlights(document.fileName, highlights);
    }

    // Helper function to set analyzing state
    function setAnalyzing(analyzing: boolean) {
        treeProvider.setAnalyzing(analyzing);
        statusBarManager.setAnalyzing(analyzing);
        
        if (analyzing) {
            statusBarManager.simulateProgress();
        } else {
            // Ensure progress is properly cleared when analysis completes
            statusBarManager.setAnalyzing(false);
        }
    }



    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('codeGuardian.analyzeSecurity', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                await notificationManager.showContextualHelp('no-file-open');
                return;
            }

            try {
                setAnalyzing(true);
                await notificationManager.showAnalysisStarted('security', { showProgress: true });
                
                const code = editor.document.getText();
                const vulnerabilities = await measureAnalysis('security', () => 
                    getSecurityAnalysis().analyzeSecurity(code)
                );

                analysisData.vulnerabilities = vulnerabilities;

                await notificationManager.showAnalysisCompleted('security', { vulnerabilities });
                
                // Show security alerts for critical issues
                if (vulnerabilities.length > 0) {
                    const criticalVulns = vulnerabilities.filter((v: any) => 
                        typeof v === 'string' && (v.includes('injection') || v.includes('XSS'))
                    );
                    if (criticalVulns.length > 0) {
                        await notificationManager.showSecurityAlert({ type: 'Critical Security Issue' });
                    }
                }

                setAnalyzing(false);
                updateAllGUI();
                
                // Auto-open dashboard if significant issues found
                if (vulnerabilities.length > 0) {
                    getEnhancedWebview().createWebview();
                }
            } catch (error) {
                setAnalyzing(false);
                await notificationManager.showAnalysisError('security', error as string);
            }
        }),

        vscode.commands.registerCommand('codeGuardian.analyzeQuality', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                await notificationManager.showContextualHelp('no-file-open');
                return;
            }

            try {
                setAnalyzing(true);
                await notificationManager.showAnalysisStarted('quality', { showProgress: true });
                
                const code = editor.document.getText();
                const qualityMetrics = await measureAnalysis('quality', () => 
                    getCodeQuality().analyzeQuality(code)
                );

                analysisData.qualityMetrics = qualityMetrics;

                await notificationManager.showAnalysisCompleted('quality', { qualityMetrics });

                // Show contextual help based on quality score
                if (qualityMetrics.maintainabilityScore < 60) {
                    await notificationManager.showContextualHelp('quality-low');
                }

                setAnalyzing(false);
                updateAllGUI();
            } catch (error) {
                setAnalyzing(false);
                await notificationManager.showAnalysisError('quality', error as string);
            }
        }),

        vscode.commands.registerCommand('codeGuardian.detectSecrets', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                await notificationManager.showContextualHelp('no-file-open');
                return;
            }

            try {
                setAnalyzing(true);
                await notificationManager.showAnalysisStarted('secrets', { showProgress: true });
                
                const code = editor.document.getText();
                const secrets = await measureAnalysis('secrets', () => 
                    getSecretDetection().detectSecrets(code)
                );

                analysisData.secrets = secrets;

                await notificationManager.showAnalysisCompleted('secrets', { secrets });

                // Show secret alerts for detected secrets
                if (secrets.length > 0) {
                    for (const _secret of secrets.slice(0, 3)) { // Show alerts for first 3 secrets
                        await notificationManager.showSecretAlert({ type: 'Secret Detected' });
                    }
                    await notificationManager.showContextualHelp('secrets-found');
                }

                setAnalyzing(false);
                updateAllGUI();
                
                // Auto-open dashboard if secrets found
                if (secrets.length > 0) {
                    getEnhancedWebview().createWebview();
                }
            } catch (error) {
                setAnalyzing(false);
                await notificationManager.showAnalysisError('secrets', error as string);
            }
        }),

        vscode.commands.registerCommand('codeGuardian.showWebview', () => {
            getEnhancedWebview().createWebview();
            if (Object.keys(analysisData).length > 0) {
                updateAllGUI();
            }
        }),

        vscode.commands.registerCommand('codeGuardian.getAiSuggestions', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                await notificationManager.showContextualHelp('no-file-open');
                return;
            }

            try {
                setAnalyzing(true);
                await notificationManager.showAnalysisStarted('ai', { showProgress: true });
                
                const code = editor.document.getText();
                const suggestions = await getAiProvider().getSuggestions(code);

                analysisData.suggestions = suggestions;

                await notificationManager.showAnalysisCompleted('ai', { suggestions });

                setAnalyzing(false);
                updateAllGUI();
            } catch (error) {
                setAnalyzing(false);
                await notificationManager.showAnalysisError('ai', error as string);
            }
        }),

        vscode.commands.registerCommand('codeGuardian.runAllAnalysis', async () => {
            // Check if workspace is open
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showWarningMessage('No workspace folder is open. Please open a folder to analyze.');
                return;
            }

            try {
                // Show workspace scanning message
                vscode.window.showInformationMessage(`🔍 Starting comprehensive workspace analysis...`);
                setAnalyzing(true);
                
                // Use workspace scanner for comprehensive analysis
                const workspaceResults = await getWorkspaceScanner().scanWorkspace({
                    includePatterns: ['**/*.{js,ts,jsx,tsx,py,java,cs,php,rb,go,rs,cpp,c,h,hpp,json,yaml,yml}'],
                    excludePatterns: [
                        '**/node_modules/**', 
                        '**/dist/**', 
                        '**/build/**', 
                        '**/*.min.js', 
                        '**/vendor/**',
                        '**/coverage/**',
                        '**/.git/**',
                        '**/bin/**',
                        '**/obj/**'
                    ],
                    maxFileSize: 1024 * 1024, // 1MB max file size
                    scanDepth: 10
                });

                // Aggregate results from all files
                let totalVulnerabilities: string[] = [];
                let totalSecrets: string[] = [];
                let totalQualityIssues: string[] = [];
                let filesScanned = 0;
                let filesWithIssues = 0;

                workspaceResults.forEach(result => {
                    filesScanned++;
                    if (result.vulnerabilities.length > 0 || result.secrets.length > 0 || result.qualityIssues.length > 0) {
                        filesWithIssues++;
                    }
                    
                    // Add file path context to issues
                    const fileName = result.filePath.split(/[/\\]/).pop() || result.filePath;
                    
                    totalVulnerabilities.push(...result.vulnerabilities.map(v => `${fileName}: ${v}`));
                    totalSecrets.push(...result.secrets.map(s => `${fileName}: ${s}`));
                    totalQualityIssues.push(...result.qualityIssues.map(q => `${fileName}: ${q}`));
                });

                // Calculate overall quality metrics
                const avgQualityScore = workspaceResults.length > 0 
                    ? Math.round(workspaceResults.reduce((sum, r) => sum + (r.severity === 'low' ? 90 : r.severity === 'medium' ? 70 : r.severity === 'high' ? 50 : 30), 0) / workspaceResults.length)
                    : 100;

                // Generate AI suggestions for workspace
                const workspaceSuggestions = [
                    `Scanned ${filesScanned} files in workspace`,
                    `Found issues in ${filesWithIssues} files`,
                    totalVulnerabilities.length > 0 ? `Security: Review ${totalVulnerabilities.length} vulnerabilities across files` : 'Security: No vulnerabilities found',
                    totalSecrets.length > 0 ? `Secrets: Secure ${totalSecrets.length} potential secrets` : 'Secrets: No secrets detected',
                    totalQualityIssues.length > 0 ? `Quality: Address ${totalQualityIssues.length} code quality issues` : 'Quality: Code quality looks good',
                    `Overall workspace quality score: ${avgQualityScore}%`
                ];

                // Update analysis data with workspace results
                analysisData = {
                    vulnerabilities: totalVulnerabilities,
                    qualityMetrics: {
                        maintainabilityScore: avgQualityScore,
                        complexityScore: Math.max(1, Math.ceil(totalVulnerabilities.length / 10)),
                        technicalDebt: totalQualityIssues.length * 5
                    },
                    secrets: totalSecrets,
                    suggestions: workspaceSuggestions,
                    workspaceResults: workspaceResults, // Store detailed results
                    metadata: {
                        filesScanned,
                        filesWithIssues,
                        workspacePath: workspaceFolders[0].uri.fsPath,
                        analyzedAt: new Date().toISOString(),
                        analysisType: 'workspace'
                    }
                };

                // Ensure analyzing state is cleared first
                setAnalyzing(false);
                updateAllGUI();

                // Show completion message with workspace stats
                const totalIssues = totalVulnerabilities.length + totalSecrets.length;
                
                // Auto-open enhanced dashboard with workspace results immediately
                setTimeout(() => {
                    getEnhancedWebview().createWebview();
                }, 500); // Small delay to ensure UI is ready
                
                if (totalIssues === 0) {
                    vscode.window.showInformationMessage(
                        `✅ Workspace analysis complete! Scanned ${filesScanned} files - No security issues found. Quality: ${avgQualityScore}%\n\n📊 Results dashboard opened automatically.`
                    );
                } else {
                    vscode.window.showWarningMessage(
                        `⚠️ Workspace analysis complete! Scanned ${filesScanned} files - Found ${totalIssues} issues in ${filesWithIssues} files. Quality: ${avgQualityScore}%\n\n📊 Results dashboard opened automatically.`
                    );
                }
                
            } catch (error) {
                setAnalyzing(false);
                vscode.window.showErrorMessage(`Workspace analysis failed: ${error}`);
                console.error('Workspace analysis error:', error);
            }
        }),

        // Add a separate command for single file analysis
        vscode.commands.registerCommand('codeGuardian.analyzeCurrentFile', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('No file is open. Please open a file to analyze.');
                return;
            }

            try {
                // Show file analysis message
                const fileName = editor.document.fileName.split(/[/\\]/).pop() || 'current file';
                vscode.window.showInformationMessage(`🔍 Analyzing ${fileName}...`);
                setAnalyzing(true);
                
                const code = editor.document.getText();

                // Run analyses with individual timeouts for current file
                const analysisResults = await Promise.allSettled([
                    Promise.race([
                        getSecurityAnalysis().analyzeSecurity(code),
                        new Promise<string[]>((_, reject) => 
                            setTimeout(() => reject(new Error('Security analysis timeout')), 10000)
                        )
                    ]),
                    Promise.race([
                        getCodeQuality().analyzeQuality(code),
                        new Promise<any>((_, reject) => 
                            setTimeout(() => reject(new Error('Quality analysis timeout')), 10000)
                        )
                    ]),
                    Promise.race([
                        getSecretDetection().detectSecrets(code),
                        new Promise<string[]>((_, reject) => 
                            setTimeout(() => reject(new Error('Secret detection timeout')), 10000)
                        )
                    ]),
                    Promise.race([
                        getAiProvider().getSuggestions(code),
                        new Promise<string[]>((_, reject) => 
                            setTimeout(() => reject(new Error('AI suggestions timeout')), 10000)
                        )
                    ])
                ]);

                // Extract results or use defaults for failed analyses
                const vulnerabilities = analysisResults[0].status === 'fulfilled' ? analysisResults[0].value : [];
                const qualityMetrics = analysisResults[1].status === 'fulfilled' ? analysisResults[1].value : { maintainabilityScore: 0, complexityScore: 1, technicalDebt: 0 };
                const secrets = analysisResults[2].status === 'fulfilled' ? analysisResults[2].value : [];
                const suggestions = analysisResults[3].status === 'fulfilled' ? analysisResults[3].value : [];

                // Update analysis data for current file
                analysisData = {
                    vulnerabilities,
                    qualityMetrics,
                    secrets,
                    suggestions,
                    metadata: {
                        fileName: editor.document.fileName,
                        languageId: editor.document.languageId,
                        lineCount: editor.document.lineCount,
                        analyzedAt: new Date().toISOString(),
                        analysisType: 'single-file'
                    }
                };

                // Ensure analyzing state is cleared first
                setAnalyzing(false);
                updateAllGUI();

                // Show completion message
                const totalIssues = vulnerabilities.length + secrets.length;
                const qualityScore = qualityMetrics.maintainabilityScore || 0;
                
                // Auto-open enhanced dashboard after analysis immediately
                setTimeout(() => {
                    getEnhancedWebview().createWebview();
                }, 500); // Small delay to ensure UI is ready
                
                if (totalIssues === 0) {
                    vscode.window.showInformationMessage(`✅ File analysis complete! No issues found in ${fileName}. Quality score: ${qualityScore}%\n\n📊 Results dashboard opened automatically.`);
                } else {
                    vscode.window.showWarningMessage(`⚠️ File analysis complete! Found ${totalIssues} issues in ${fileName}. Quality: ${qualityScore}%\n\n📊 Results dashboard opened automatically.`);
                }
                
            } catch (error) {
                setAnalyzing(false);
                vscode.window.showErrorMessage(`File analysis failed: ${error}`);
                console.error('File analysis error:', error);
            }
        }),

        // Enhanced webview command
        vscode.commands.registerCommand('codeGuardian.showEnhancedWebview', () => {
            getEnhancedWebview().createWebview();
            if (Object.keys(analysisData).length > 0) {
                updateAllGUI();
            }
        }),

        // Settings panel command
        vscode.commands.registerCommand('codeGuardian.openSettings', () => {
            getSettingsPanel().createSettingsPanel();
        }),

        // Export report command
        vscode.commands.registerCommand('codeGuardian.exportReport', async () => {
            if (Object.keys(analysisData).length === 0) {
                vscode.window.showWarningMessage('No analysis data to export. Run an analysis first.');
                return;
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`guardian-security-report-${timestamp}.html`),
                filters: {
                    'HTML Files': ['html'],
                    'JSON Files': ['json'],
                    'Markdown Files': ['md']
                }
            });

            if (uri) {
                try {
                    const format = uri.fsPath.split('.').pop()?.toLowerCase() || 'html';
                    let content = '';

                    switch (format) {
                        case 'json':
                            content = JSON.stringify(analysisData, null, 2);
                            break;
                        case 'md':
                            content = generateMarkdownReport(analysisData);
                            break;
                        default:
                            content = generateHtmlReport(analysisData);
                    }

                    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
                    vscode.window.showInformationMessage(`Report exported to ${uri.fsPath}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to export report: ${error}`);
                }
            }
        }),

        // Clear history command
        vscode.commands.registerCommand('codeGuardian.clearHistory', () => {
            treeProvider.clearHistory();
            vscode.window.showInformationMessage('Analysis history cleared');
        }),

        // Quick tips command
        vscode.commands.registerCommand('codeGuardian.showQuickTips', async () => {
            const tips = [
                'Run analysis regularly to catch issues early',
                'Use the enhanced dashboard for detailed insights',
                'Configure settings to match your workflow',
                'Export reports for documentation and compliance',
                'Check the tree view for quick access to results'
            ];
            
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            await notificationManager.showQuickTip(randomTip, 'general');
        }),

        // Chatbot commands
        vscode.commands.registerCommand('codeGuardian.openChatbot', () => {
            getChatbotWebview().createChatbotPanel(analysisData);
        }),

        vscode.commands.registerCommand('codeGuardian.chatWithAnalysis', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                await notificationManager.showContextualHelp('no-file-open');
                return;
            }

            // Run comprehensive analysis first if no data exists
            if (Object.keys(analysisData).length === 0) {
                try {
                    setAnalyzing(true);
                    await notificationManager.showAnalysisStarted('comprehensive', { showProgress: true });
                    
                    const code = editor.document.getText();

                    // Run all analyses in parallel
                    const [vulnerabilities, qualityMetrics, secrets, suggestions] = await Promise.all([
                        getSecurityAnalysis().analyzeSecurity(code),
                        getCodeQuality().analyzeQuality(code),
                        getSecretDetection().detectSecrets(code),
                        getAiProvider().getSuggestions(code)
                    ]);

                    // Update analysis data
                    analysisData = {
                        vulnerabilities,
                        qualityMetrics,
                        secrets,
                        suggestions
                    };

                    setAnalyzing(false);
                    updateAllGUI();
                } catch (error) {
                    setAnalyzing(false);
                    await notificationManager.showAnalysisError('comprehensive', error as string);
                    return;
                }
            }

            // Open chatbot with analysis context
            getChatbotWebview().createChatbotPanel(analysisData);
            
            // Send initial context message
            if (Object.keys(analysisData).length > 0) {
                getChatbotWebview().updateAnalysisContext(analysisData);
            }
        }),

        vscode.commands.registerCommand('codeGuardian.askChatbot', async () => {
            const question = await vscode.window.showInputBox({
                prompt: 'Ask Guardian Security Assistant',
                placeHolder: 'e.g., "How can I fix the security issues in my code?"'
            });

            if (question) {
                getChatbotWebview().createChatbotPanel(analysisData);
                // The question will be handled by the webview interface
            }
        }),

        // Workspace scanning commands
        vscode.commands.registerCommand('codeGuardian.scanWorkspace', async () => {
            try {
                await notificationManager.showAnalysisStarted('workspace', { showProgress: true });
                
                const results = await getWorkspaceScanner().scanWorkspace();
                const totalIssues = results.reduce((sum, result) => 
                    sum + result.vulnerabilities.length + result.secrets.length + result.qualityIssues.length, 0
                );

                await notificationManager.showAnalysisCompleted('workspace', { 
                    totalFiles: results.length,
                    totalIssues 
                });

                // Update tree view with workspace results
                treeProvider.updateWorkspaceResults(results);
                
                vscode.window.showInformationMessage(
                    `Workspace scan complete! Found issues in ${results.length} files (${totalIssues} total issues).`,
                    'View Results'
                ).then(selection => {
                    if (selection === 'View Results') {
                        vscode.commands.executeCommand('codeGuardian.showEnhancedWebview');
                    }
                });

            } catch (error) {
                await notificationManager.showAnalysisError('workspace', error as string);
            }
        }),

        vscode.commands.registerCommand('codeGuardian.toggleAutoScan', async () => {
            const config = vscode.workspace.getConfiguration('guardianSecurity');
            const currentValue = config.get('autoAnalysis', false);
            
            await config.update('autoAnalysis', !currentValue, vscode.ConfigurationTarget.Global);
            
            const status = !currentValue ? 'enabled' : 'disabled';
            vscode.window.showInformationMessage(`Auto-scanning ${status}`);
            
            if (!currentValue) {
                // If enabling auto-scan, run a workspace scan
                vscode.commands.executeCommand('codeGuardian.scanWorkspace');
            }
        }),

        vscode.commands.registerCommand('codeGuardian.clearHighlights', () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && lineHighlighter) {
                lineHighlighter.clearHighlights(activeEditor.document.fileName);
                vscode.window.showInformationMessage('Security highlights cleared for current file');
            }
        }),

        vscode.commands.registerCommand('codeGuardian.showWorkspaceReport', async () => {
            const results = Array.from(getWorkspaceScanner().getScanResults().values());
            
            if (results.length === 0) {
                vscode.window.showInformationMessage('No workspace scan results available. Run a workspace scan first.');
                return;
            }

            // Generate workspace report
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(`guardian-workspace-report-${timestamp}.html`),
                filters: {
                    'HTML Files': ['html'],
                    'JSON Files': ['json'],
                    'Markdown Files': ['md']
                }
            });

            if (uri) {
                try {
                    const format = uri.fsPath.split('.').pop()?.toLowerCase() || 'html';
                    const content = generateWorkspaceReport(results, format);
                    
                    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
                    vscode.window.showInformationMessage(`Workspace report exported to ${uri.fsPath}`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to export workspace report: ${error}`);
                }
            }
        }),



        // Clear all caches command
        vscode.commands.registerCommand('codeGuardian.clearAllCaches', () => {
            try {
                // Clear caches from all analysis components
                if (securityAnalysis) {
                    securityAnalysis.clearCache();
                }
                if (codeQuality) {
                    codeQuality.clearCache();
                }
                if (secretDetection) {
                    secretDetection.clearCache();
                }
                if (aiProvider) {
                    aiProvider.clearCache();
                }
                
                // Clear performance monitor metrics
                perfMonitor.clearMetrics();
                
                vscode.window.showInformationMessage('🧹 All caches cleared successfully!');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to clear caches: ${error}`);
            }
        }),

        // Smart analysis command - handles cases when no file is open
        vscode.commands.registerCommand('codeGuardian.smartAnalysis', async () => {
            const editor = vscode.window.activeTextEditor;
            
            if (!editor) {
                // No file is open, let's help the user
                const action = await vscode.window.showInformationMessage(
                    '🛡️ Guardian Security: No file is currently open for analysis.',
                    'Open File',
                    'Open Recent',
                    'Scan Workspace',
                    'Cancel'
                );

                switch (action) {
                    case 'Open File':
                        // Open file dialog
                        const fileUri = await vscode.window.showOpenDialog({
                            canSelectFiles: true,
                            canSelectFolders: false,
                            canSelectMany: false,
                            filters: {
                                'Code Files': ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cs', 'php', 'rb', 'go', 'rs', 'cpp', 'c', 'h', 'hpp'],
                                'All Files': ['*']
                            },
                            openLabel: 'Open and Analyze'
                        });

                        if (fileUri && fileUri[0]) {
                            // Open the file
                            const document = await vscode.workspace.openTextDocument(fileUri[0]);
                            await vscode.window.showTextDocument(document);
                            
                            // Wait a moment for the editor to be ready, then run analysis
                            setTimeout(() => {
                                vscode.commands.executeCommand('codeGuardian.runAllAnalysis');
                            }, 500);
                        }
                        break;

                    case 'Open Recent':
                        // Open recent files command
                        await vscode.commands.executeCommand('workbench.action.openRecent');
                        
                        // Show a follow-up message
                        setTimeout(() => {
                            vscode.window.showInformationMessage(
                                '💡 After opening a file, run "Guardian Security: Run All Analysis" to analyze it.',
                                'Got it!'
                            );
                        }, 1000);
                        break;

                    case 'Scan Workspace':
                        // Run workspace scan if workspace is available
                        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                            await vscode.commands.executeCommand('codeGuardian.scanWorkspace');
                        } else {
                            vscode.window.showWarningMessage('No workspace is currently open. Please open a folder first.');
                        }
                        break;

                    default:
                        // User cancelled or closed the dialog
                        break;
                }
            } else {
                // File is open, run normal analysis
                await vscode.commands.executeCommand('codeGuardian.runAllAnalysis');
            }
        })
    );

    // Extension is now ready - no automatic welcome message
}

// Helper functions for report generation
function generateHtmlReport(data: any): string {
    const timestamp = new Date().toLocaleString();
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Guardian Security Report - ${timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .vulnerability { background: #ffebee; padding: 10px; margin: 5px 0; border-left: 4px solid #f44336; }
        .secret { background: #fff3e0; padding: 10px; margin: 5px 0; border-left: 4px solid #ff9800; }
        .suggestion { background: #e3f2fd; padding: 10px; margin: 5px 0; border-left: 4px solid #2196f3; }
        .quality-score { font-size: 24px; font-weight: bold; color: #4caf50; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Guardian Security Report</h1>
        <p>Generated on: ${timestamp}</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <h3>Security Issues</h3>
            <div style="font-size: 24px; color: ${(data.vulnerabilities?.length || 0) > 0 ? '#f44336' : '#4caf50'}">
                ${data.vulnerabilities?.length || 0}
            </div>
        </div>
        <div class="stat">
            <h3>Secrets Found</h3>
            <div style="font-size: 24px; color: ${(data.secrets?.length || 0) > 0 ? '#ff9800' : '#4caf50'}">
                ${data.secrets?.length || 0}
            </div>
        </div>
        <div class="stat">
            <h3>Quality Score</h3>
            <div class="quality-score">
                ${data.qualityMetrics?.maintainabilityScore || 0}%
            </div>
        </div>
        <div class="stat">
            <h3>AI Suggestions</h3>
            <div style="font-size: 24px; color: #2196f3">
                ${data.suggestions?.length || 0}
            </div>
        </div>
    </div>

    ${data.vulnerabilities && data.vulnerabilities.length > 0 ? `
        <div class="section">
            <h2>🚨 Security Vulnerabilities (${data.vulnerabilities.length})</h2>
            ${data.vulnerabilities.map((vuln: any) => `
                <div class="vulnerability">
                    <strong>${typeof vuln === 'object' ? (vuln.type || 'Security Issue') : 'Security Issue'}</strong><br>
                    ${typeof vuln === 'object' ? (vuln.description || vuln.message || 'Security vulnerability detected') : vuln}
                </div>
            `).join('')}
        </div>
    ` : ''}

    ${data.secrets && data.secrets.length > 0 ? `
        <div class="section">
            <h2>🔐 Detected Secrets (${data.secrets.length})</h2>
            ${data.secrets.map((secret: any) => `
                <div class="secret">
                    <strong>${typeof secret === 'object' ? (secret.type || 'Secret Detected') : 'Secret Detected'}</strong><br>
                    ${typeof secret === 'object' ? (secret.description || secret.message || 'Secret detected') : secret}
                </div>
            `).join('')}
        </div>
    ` : ''}

    ${data.qualityMetrics ? `
        <div class="section">
            <h2>📊 Code Quality Metrics</h2>
            <p><strong>Maintainability Score:</strong> ${data.qualityMetrics.maintainabilityScore}/100</p>
            <p><strong>Complexity Score:</strong> ${data.qualityMetrics.complexityScore}</p>
            <p><strong>Technical Debt:</strong> ${data.qualityMetrics.technicalDebt}</p>
        </div>
    ` : ''}

    ${data.suggestions && data.suggestions.length > 0 ? `
        <div class="section">
            <h2>💡 AI Suggestions (${data.suggestions.length})</h2>
            ${data.suggestions.map((suggestion: any, index: number) => `
                <div class="suggestion">
                    <strong>${index + 1}. ${typeof suggestion === 'object' ? (suggestion.title || 'Improvement Suggestion') : 'Improvement Suggestion'}</strong><br>
                    ${typeof suggestion === 'object' ? (suggestion.description || suggestion.message || 'AI suggestion') : suggestion}
                </div>
            `).join('')}
        </div>
    ` : ''}
</body>
</html>`;
}

function generateMarkdownReport(data: any): string {
    const timestamp = new Date().toLocaleString();
    let markdown = `# 🛡️ Guardian Security Report

Generated on: ${timestamp}

## 📊 Summary

| Metric | Count/Score |
|--------|-------------|
| Security Issues | ${data.vulnerabilities?.length || 0} |
| Secrets Found | ${data.secrets?.length || 0} |
| Quality Score | ${data.qualityMetrics?.maintainabilityScore || 0}% |
| AI Suggestions | ${data.suggestions?.length || 0} |

`;

    if (data.vulnerabilities && data.vulnerabilities.length > 0) {
        markdown += `## 🚨 Security Vulnerabilities (${data.vulnerabilities.length})

`;
        data.vulnerabilities.forEach((vuln: any, index: number) => {
            markdown += `### ${index + 1}. ${typeof vuln === 'object' ? (vuln.type || 'Security Issue') : 'Security Issue'}

${typeof vuln === 'object' ? (vuln.description || vuln.message || 'Security vulnerability detected') : vuln}

`;
        });
    }

    if (data.secrets && data.secrets.length > 0) {
        markdown += `## 🔐 Detected Secrets (${data.secrets.length})

`;
        data.secrets.forEach((secret: any, index: number) => {
            markdown += `### ${index + 1}. ${typeof secret === 'object' ? (secret.type || 'Secret Detected') : 'Secret Detected'}

${typeof secret === 'object' ? (secret.description || secret.message || 'Secret detected') : secret}

`;
        });
    }

    if (data.qualityMetrics) {
        markdown += `## 📊 Code Quality Metrics

- **Maintainability Score:** ${data.qualityMetrics.maintainabilityScore}/100
- **Complexity Score:** ${data.qualityMetrics.complexityScore}
- **Technical Debt:** ${data.qualityMetrics.technicalDebt}

`;
    }

    if (data.suggestions && data.suggestions.length > 0) {
        markdown += `## 💡 AI Suggestions (${data.suggestions.length})

`;
        data.suggestions.forEach((suggestion: any, index: number) => {
            markdown += `### ${index + 1}. ${typeof suggestion === 'object' ? (suggestion.title || 'Improvement Suggestion') : 'Improvement Suggestion'}

${typeof suggestion === 'object' ? (suggestion.description || suggestion.message || 'AI suggestion') : suggestion}

`;
        });
    }

    return markdown;
}

// Helper function for workspace report generation
function generateWorkspaceReport(results: any[], format: string): string {
    const timestamp = new Date().toLocaleString();
    const totalFiles = results.length;
    const totalIssues = results.reduce((sum: number, result: any) => 
        sum + result.vulnerabilities.length + result.secrets.length + result.qualityIssues.length, 0
    );

    if (format === 'json') {
        return JSON.stringify({
            timestamp,
            summary: { totalFiles, totalIssues },
            results
        }, null, 2);
    }

    if (format === 'md') {
        let markdown = '# 🛡️ Guardian Security Workspace Report\n\n';
        markdown += `Generated on: ${timestamp}\n\n`;
        markdown += '## 📊 Summary\n\n';
        markdown += `- **Total Files Scanned:** ${totalFiles}\n`;
        markdown += `- **Total Issues Found:** ${totalIssues}\n\n`;

        results.forEach((result, index) => {
            const fileName = result.filePath.split(/[/\\]/).pop();
            const issueCount = result.vulnerabilities.length + result.secrets.length + result.qualityIssues.length;
            
            markdown += `### ${index + 1}. ${fileName} (${issueCount} issues)\n\n`;
            markdown += `**File:** \`${result.filePath}\`\n`;
            markdown += `**Severity:** ${result.severity}\n\n`;

            if (result.vulnerabilities.length > 0) {
                markdown += `**🚨 Security Issues (${result.vulnerabilities.length}):**\n`;
                result.vulnerabilities.forEach((vuln: string) => {
                    markdown += `- ${vuln}\n`;
                });
                markdown += '\n';
            }

            if (result.secrets.length > 0) {
                markdown += `**🔐 Secrets Found (${result.secrets.length}):**\n`;
                result.secrets.forEach((secret: string) => {
                    markdown += `- ${secret}\n`;
                });
                markdown += '\n';
            }

            if (result.qualityIssues.length > 0) {
                markdown += `**💡 Quality Issues (${result.qualityIssues.length}):**\n`;
                result.qualityIssues.forEach((issue: string) => {
                    markdown += `- ${issue}\n`;
                });
                markdown += '\n';
            }
        });

        return markdown;
    }

    // HTML format
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>Guardian Security Workspace Report - ${timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .file-result { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .severity-critical { border-left: 5px solid #f44336; }
        .severity-high { border-left: 5px solid #ff9800; }
        .severity-medium { border-left: 5px solid #ffeb3b; }
        .severity-low { border-left: 5px solid #4caf50; }
        .vulnerability { background: #ffebee; padding: 8px; margin: 5px 0; border-radius: 3px; }
        .secret { background: #fff3e0; padding: 8px; margin: 5px 0; border-radius: 3px; }
        .quality { background: #e3f2fd; padding: 8px; margin: 5px 0; border-radius: 3px; }
        .file-path { font-family: monospace; background: #f0f0f0; padding: 2px 4px; border-radius: 2px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Guardian Security Workspace Report</h1>
        <p>Generated on: ${timestamp}</p>
    </div>
    
    <div class="summary">
        <h2>📊 Summary</h2>
        <p><strong>Total Files Scanned:</strong> ${totalFiles}</p>
        <p><strong>Total Issues Found:</strong> ${totalIssues}</p>
    </div>`;

    results.forEach((result, index) => {
        const fileName = result.filePath.split(/[/\\]/).pop();
        const issueCount = result.vulnerabilities.length + result.secrets.length + result.qualityIssues.length;
        
        html += `
    <div class="file-result severity-${result.severity}">
        <h3>${index + 1}. ${fileName} (${issueCount} issues)</h3>
        <p><strong>File:</strong> <span class="file-path">${result.filePath}</span></p>
        <p><strong>Severity:</strong> <span style="text-transform: uppercase; font-weight: bold;">${result.severity}</span></p>`;

        if (result.vulnerabilities.length > 0) {
            html += `<h4>🚨 Security Issues (${result.vulnerabilities.length})</h4>`;
            result.vulnerabilities.forEach((vuln: string) => {
                html += `<div class="vulnerability">${vuln}</div>`;
            });
        }

        if (result.secrets.length > 0) {
            html += `<h4>🔐 Secrets Found (${result.secrets.length})</h4>`;
            result.secrets.forEach((secret: string) => {
                html += `<div class="secret">${secret}</div>`;
            });
        }

        if (result.qualityIssues.length > 0) {
            html += `<h4>💡 Quality Issues (${result.qualityIssues.length})</h4>`;
            result.qualityIssues.forEach((issue: string) => {
                html += `<div class="quality">${issue}</div>`;
            });
        }

        html += '</div>';
    });

    html += '</body></html>';
    return html;
}

export function deactivate() {
    console.log('Code Guardian extension is now deactivated');
    
    // Clean up resources
    if (statusBarManager) {
        statusBarManager.dispose();
    }
    if (settingsPanel) {
        settingsPanel.dispose();
    }
}