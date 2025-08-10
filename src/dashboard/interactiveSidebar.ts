import * as vscode from 'vscode';

export class InteractiveSidebarItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command,
        public readonly iconPath?: vscode.ThemeIcon,
        public readonly contextValue?: string,
        public readonly tooltip?: string,
        public readonly description?: string,
        public readonly severity?: 'low' | 'medium' | 'high' | 'critical',
        public readonly badge?: string,
        public readonly progress?: number
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip || this.label;
        this.description = description;
        
        // Enhanced icon styling based on severity and state
        if (severity && iconPath instanceof vscode.ThemeIcon) {
            const colorMap = {
                'critical': new vscode.ThemeColor('errorForeground'),
                'high': new vscode.ThemeColor('warningForeground'),
                'medium': new vscode.ThemeColor('notificationsWarningIcon.foreground'),
                'low': new vscode.ThemeColor('notificationsInfoIcon.foreground')
            };
            this.iconPath = new vscode.ThemeIcon(iconPath.id, colorMap[severity]);
        }

        // Add badge to description if provided
        if (badge && description) {
            this.description = `${description} ${badge}`;
        } else if (badge) {
            this.description = badge;
        }
    }
}

export class InteractiveSidebarProvider implements vscode.TreeDataProvider<InteractiveSidebarItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<InteractiveSidebarItem | undefined | null | void> = 
        new vscode.EventEmitter<InteractiveSidebarItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<InteractiveSidebarItem | undefined | null | void> = 
        this._onDidChangeTreeData.event;

    private analysisResults: any = {};
    private analysisHistory: any[] = [];
    private isAnalyzing: boolean = false;
    private realTimeStats: any = {};
    private quickActions: any[] = [];
    private favoriteActions: string[] = [];
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadFavoriteActions();
        this.initializeQuickActions();
    }

    private loadFavoriteActions() {
        this.favoriteActions = this.context.globalState.get('guardianFavoriteActions', [
            'smartAnalysis',
            'comprehensiveAnalysis',
            'modernDashboard'
        ]);
    }

    private saveFavoriteActions() {
        this.context.globalState.update('guardianFavoriteActions', this.favoriteActions);
    }

    private initializeQuickActions() {
        this.quickActions = [
            {
                id: 'smartAnalysis',
                label: 'Smart Analysis',
                icon: 'brain',
                command: 'codeGuardian.smartAnalysis',
                description: 'AI-powered contextual analysis',
                category: 'analysis'
            },
            {
                id: 'comprehensiveAnalysis',
                label: 'Comprehensive Scan',
                icon: 'search',
                command: 'codeGuardian.comprehensiveAnalysis',
                description: 'Complete security assessment',
                category: 'analysis'
            },
            {
                id: 'modernDashboard',
                label: 'Modern Dashboard',
                icon: 'dashboard',
                command: 'codeGuardian.showModernDashboard',
                description: 'Interactive analysis dashboard',
                category: 'dashboard'
            },
            {
                id: 'securityAnalysis',
                label: 'Security Analysis',
                icon: 'shield',
                command: 'codeGuardian.analyzeSecurity',
                description: 'Vulnerability detection',
                category: 'analysis'
            },
            {
                id: 'devopsAnalysis',
                label: 'DevOps Security',
                icon: 'server',
                command: 'codeGuardian.analyzeDevOps',
                description: 'Infrastructure security',
                category: 'analysis'
            },
            {
                id: 'databaseAnalysis',
                label: 'Database Security',
                icon: 'database',
                command: 'codeGuardian.analyzeDatabase',
                description: 'Database security analysis',
                category: 'analysis'
            },
            {
                id: 'fullstackAnalysis',
                label: 'Full-Stack Security',
                icon: 'layers',
                command: 'codeGuardian.analyzeFullStack',
                description: 'Web application security',
                category: 'analysis'
            }
        ];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    updateResults(results: any): void {
        this.analysisResults = results;
        this.addToHistory(results);
        this.isAnalyzing = false;
        this.updateRealTimeStats(results);
        this.refresh();
    }

    setAnalyzing(analyzing: boolean): void {
        this.isAnalyzing = analyzing;
        this.refresh();
    }

    private addToHistory(results: any): void {
        const historyEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            data: results,
            summary: this.generateSummary(results),
            fileInfo: results.metadata || {}
        };
        this.analysisHistory.unshift(historyEntry);
        if (this.analysisHistory.length > 20) {
            this.analysisHistory = this.analysisHistory.slice(0, 20);
        }
    }

    private updateRealTimeStats(results: any): void {
        const vulnerabilities = results.vulnerabilities?.length || 0;
        const secrets = results.secrets?.length || 0;
        const devopsIssues = results.devopsResults?.vulnerabilities?.length || 0;
        const databaseIssues = results.databaseResults?.vulnerabilities?.length || 0;
        const fullStackIssues = results.fullStackResults?.vulnerabilities?.length || 0;
        const qualityScore = results.qualityMetrics?.maintainabilityScore || 0;
        const suggestions = results.suggestions?.length || 0;

        this.realTimeStats = {
            totalIssues: vulnerabilities + secrets + devopsIssues + databaseIssues + fullStackIssues,
            securityIssues: vulnerabilities,
            secrets: secrets,
            devopsIssues: devopsIssues,
            databaseIssues: databaseIssues,
            fullStackIssues: fullStackIssues,
            qualityScore: qualityScore,
            suggestions: suggestions,
            lastAnalysis: new Date().toISOString()
        };
    }

    private generateSummary(data: any): string {
        const vulnerabilities = data.vulnerabilities?.length || 0;
        const secrets = data.secrets?.length || 0;
        const qualityScore = data.qualityMetrics?.maintainabilityScore || 0;
        const suggestions = data.suggestions?.length || 0;

        return `${vulnerabilities}V ${secrets}S ${qualityScore}%Q ${suggestions}AI`;
    }

    getTreeItem(element: InteractiveSidebarItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: InteractiveSidebarItem): Promise<InteractiveSidebarItem[]> {
        if (!element) {
            return Promise.resolve([
                new InteractiveSidebarItem(
                    'Quick Actions',
                    vscode.TreeItemCollapsibleState.Expanded,
                    undefined,
                    new vscode.ThemeIcon('zap'),
                    'quickActions',
                    'Fast access to common analysis tools',
                    undefined,
                    undefined,
                    '⚡'
                ),
                new InteractiveSidebarItem(
                    'Real-Time Overview',
                    vscode.TreeItemCollapsibleState.Expanded,
                    undefined,
                    new vscode.ThemeIcon('pulse'),
                    'realTimeOverview',
                    'Live analysis statistics and metrics',
                    this.getRealTimeDescription(),
                    this.getRealTimeSeverity(),
                    '📊'
                ),
                new InteractiveSidebarItem(
                    'Analysis Results',
                    vscode.TreeItemCollapsibleState.Expanded,
                    undefined,
                    new vscode.ThemeIcon('output'),
                    'results',
                    'Detailed analysis findings and recommendations',
                    this.getResultsDescription(),
                    undefined,
                    '🔍'
                ),
                new InteractiveSidebarItem(
                    'Analysis History',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined,
                    new vscode.ThemeIcon('history'),
                    'history',
                    `View past analysis results (${this.analysisHistory.length} entries)`,
                    `${this.analysisHistory.length} entries`,
                    undefined,
                    '📈'
                ),
                new InteractiveSidebarItem(
                    'Tools & Settings',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    undefined,
                    new vscode.ThemeIcon('tools'),
                    'tools',
                    'Configuration, export, and advanced tools',
                    undefined,
                    undefined,
                    '⚙️'
                )
            ]);
        }

        if (element.contextValue === 'quickActions') {
            const favoriteItems = this.quickActions
                .filter(action => this.favoriteActions.includes(action.id))
                .map(action => new InteractiveSidebarItem(
                    action.label,
                    vscode.TreeItemCollapsibleState.None,
                    this.isAnalyzing ? undefined : {
                        command: action.command,
                        title: action.label
                    },
                    new vscode.ThemeIcon(action.icon),
                    'favoriteAction',
                    action.description,
                    this.isAnalyzing ? 'Running...' : undefined,
                    undefined,
                    '⭐'
                ));

            const otherItems = this.quickActions
                .filter(action => !this.favoriteActions.includes(action.id))
                .map(action => new InteractiveSidebarItem(
                    action.label,
                    vscode.TreeItemCollapsibleState.None,
                    this.isAnalyzing ? undefined : {
                        command: action.command,
                        title: action.label
                    },
                    new vscode.ThemeIcon(action.icon),
                    'quickAction',
                    action.description,
                    this.isAnalyzing ? 'Running...' : undefined
                ));

            return Promise.resolve([...favoriteItems, ...otherItems]);
        }

        if (element.contextValue === 'realTimeOverview') {
            const items: InteractiveSidebarItem[] = [];

            if (this.realTimeStats.totalIssues !== undefined) {
                items.push(new InteractiveSidebarItem(
                    'Security Overview',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'codeGuardian.showModernDashboard',
                        title: 'Open Dashboard'
                    },
                    new vscode.ThemeIcon(this.realTimeStats.totalIssues === 0 ? 'check' : 'warning'),
                    'securityOverview',
                    `${this.realTimeStats.totalIssues} total issues found`,
                    `${this.realTimeStats.totalIssues} issues`,
                    this.realTimeStats.totalIssues === 0 ? 'low' : 
                        this.realTimeStats.totalIssues > 10 ? 'critical' :
                            this.realTimeStats.totalIssues > 5 ? 'high' : 'medium',
                    this.realTimeStats.totalIssues === 0 ? '✅' : '⚠️'
                ));

                items.push(new InteractiveSidebarItem(
                    'Code Quality',
                    vscode.TreeItemCollapsibleState.None,
                    undefined,
                    new vscode.ThemeIcon('graph'),
                    'qualityScore',
                    `Maintainability score: ${this.realTimeStats.qualityScore}%`,
                    `${this.realTimeStats.qualityScore}%`,
                    this.realTimeStats.qualityScore >= 80 ? 'low' :
                        this.realTimeStats.qualityScore >= 60 ? 'medium' : 'high',
                    '📊'
                ));

                if (this.realTimeStats.suggestions > 0) {
                    items.push(new InteractiveSidebarItem(
                        'AI Suggestions',
                        vscode.TreeItemCollapsibleState.None,
                        {
                            command: 'codeGuardian.showModernDashboard',
                            title: 'View Suggestions'
                        },
                        new vscode.ThemeIcon('lightbulb'),
                        'aiSuggestions',
                        `${this.realTimeStats.suggestions} improvement suggestions available`,
                        `${this.realTimeStats.suggestions} available`,
                        'low',
                        '💡'
                    ));
                }
            }

            if (items.length === 0) {
                items.push(new InteractiveSidebarItem(
                    'No Analysis Data',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'codeGuardian.smartAnalysis',
                        title: 'Run Analysis'
                    },
                    new vscode.ThemeIcon('info'),
                    'noData',
                    'Run an analysis to see real-time statistics',
                    'Click to analyze',
                    undefined,
                    '🚀'
                ));
            }

            return Promise.resolve(items);
        }

        if (element.contextValue === 'results') {
            const items: InteractiveSidebarItem[] = [];

            if (Object.keys(this.analysisResults).length > 0) {
                // Security vulnerabilities
                if (this.analysisResults.vulnerabilities !== undefined) {
                    const count = this.analysisResults.vulnerabilities.length;
                    const severity = count === 0 ? 'low' : count > 5 ? 'critical' : count > 2 ? 'high' : 'medium';
                    items.push(new InteractiveSidebarItem(
                        'Security Vulnerabilities',
                        count > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                        undefined,
                        new vscode.ThemeIcon(count > 0 ? 'error' : 'check'),
                        'securityResults',
                        `${count} security vulnerabilities detected`,
                        `${count} found`,
                        severity,
                        count > 0 ? '🚨' : '✅'
                    ));
                }

                // DevOps issues
                if (this.analysisResults.devopsResults?.vulnerabilities) {
                    const count = this.analysisResults.devopsResults.vulnerabilities.length;
                    if (count > 0) {
                        items.push(new InteractiveSidebarItem(
                            'DevOps Security',
                            vscode.TreeItemCollapsibleState.Collapsed,
                            undefined,
                            new vscode.ThemeIcon('server'),
                            'devopsResults',
                            `${count} DevOps security issues detected`,
                            `${count} found`,
                            count > 3 ? 'high' : 'medium',
                            '🔧'
                        ));
                    }
                }

                // Database issues
                if (this.analysisResults.databaseResults?.vulnerabilities) {
                    const count = this.analysisResults.databaseResults.vulnerabilities.length;
                    if (count > 0) {
                        items.push(new InteractiveSidebarItem(
                            'Database Security',
                            vscode.TreeItemCollapsibleState.Collapsed,
                            undefined,
                            new vscode.ThemeIcon('database'),
                            'databaseResults',
                            `${count} database security issues detected`,
                            `${count} found`,
                            count > 3 ? 'high' : 'medium',
                            '🗄️'
                        ));
                    }
                }

                // Full-stack issues
                if (this.analysisResults.fullStackResults?.vulnerabilities) {
                    const count = this.analysisResults.fullStackResults.vulnerabilities.length;
                    if (count > 0) {
                        items.push(new InteractiveSidebarItem(
                            'Full-Stack Security',
                            vscode.TreeItemCollapsibleState.Collapsed,
                            undefined,
                            new vscode.ThemeIcon('layers'),
                            'fullStackResults',
                            `${count} full-stack security issues detected`,
                            `${count} found`,
                            count > 3 ? 'high' : 'medium',
                            '🌐'
                        ));
                    }
                }

                // Secrets
                if (this.analysisResults.secrets !== undefined) {
                    const count = this.analysisResults.secrets.length;
                    if (count > 0) {
                        items.push(new InteractiveSidebarItem(
                            'Detected Secrets',
                            vscode.TreeItemCollapsibleState.Collapsed,
                            undefined,
                            new vscode.ThemeIcon('key'),
                            'secretResults',
                            `${count} potential secrets detected`,
                            `${count} found`,
                            count > 2 ? 'high' : 'medium',
                            '🔐'
                        ));
                    }
                }
            }

            if (items.length === 0) {
                items.push(new InteractiveSidebarItem(
                    'No Results Available',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'codeGuardian.smartAnalysis',
                        title: 'Run Analysis'
                    },
                    new vscode.ThemeIcon('info'),
                    'noResults',
                    'Run an analysis to see detailed results',
                    'Click to analyze',
                    undefined,
                    '🔍'
                ));
            }

            return Promise.resolve(items);
        }

        if (element.contextValue === 'history') {
            if (this.analysisHistory.length === 0) {
                return Promise.resolve([
                    new InteractiveSidebarItem(
                        'No History Available',
                        vscode.TreeItemCollapsibleState.None,
                        undefined,
                        new vscode.ThemeIcon('info'),
                        'noHistory',
                        'Analysis history will appear here after running analyses',
                        undefined,
                        undefined,
                        '📝'
                    )
                ]);
            }

            return Promise.resolve(
                this.analysisHistory.slice(0, 10).map((item, index) => 
                    new InteractiveSidebarItem(
                        `Analysis #${this.analysisHistory.length - index}`,
                        vscode.TreeItemCollapsibleState.None,
                        {
                            command: 'codeGuardian.showHistoryItem',
                            title: 'View Analysis',
                            arguments: [item]
                        },
                        new vscode.ThemeIcon('history'),
                        'historyItem',
                        `${new Date(item.timestamp).toLocaleString()}\n${item.summary}`,
                        new Date(item.timestamp).toLocaleDateString(),
                        undefined,
                        '📊'
                    )
                )
            );
        }

        if (element.contextValue === 'tools') {
            return Promise.resolve([
                new InteractiveSidebarItem(
                    'Modern Dashboard',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'codeGuardian.showModernDashboard',
                        title: 'Open Modern Dashboard'
                    },
                    new vscode.ThemeIcon('dashboard'),
                    'modernDashboard',
                    'Open the advanced interactive dashboard',
                    undefined,
                    undefined,
                    '🎨'
                ),
                new InteractiveSidebarItem(
                    'Export Reports',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'codeGuardian.exportReport',
                        title: 'Export Report'
                    },
                    new vscode.ThemeIcon('export'),
                    'exportReport',
                    'Export analysis results in various formats',
                    undefined,
                    undefined,
                    '📄'
                ),
                new InteractiveSidebarItem(
                    'Performance Monitor',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'codeGuardian.showPerformanceReport',
                        title: 'Show Performance Report'
                    },
                    new vscode.ThemeIcon('pulse'),
                    'performanceMonitor',
                    'View extension performance metrics',
                    undefined,
                    undefined,
                    '⚡'
                ),
                new InteractiveSidebarItem(
                    'Clear All Caches',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'codeGuardian.clearAllCaches',
                        title: 'Clear All Caches'
                    },
                    new vscode.ThemeIcon('refresh'),
                    'clearCaches',
                    'Clear all analysis caches for better performance',
                    undefined,
                    undefined,
                    '🧹'
                ),
                new InteractiveSidebarItem(
                    'Settings',
                    vscode.TreeItemCollapsibleState.None,
                    {
                        command: 'workbench.action.openSettings',
                        title: 'Open Settings',
                        arguments: ['guardianSecurity']
                    },
                    new vscode.ThemeIcon('settings'),
                    'openSettings',
                    'Configure Guardian Security settings',
                    undefined,
                    undefined,
                    '⚙️'
                )
            ]);
        }

        return Promise.resolve([]);
    }

    private getRealTimeDescription(): string {
        if (this.realTimeStats.totalIssues !== undefined) {
            return `${this.realTimeStats.totalIssues} issues, ${this.realTimeStats.qualityScore}% quality`;
        }
        return 'No analysis data available';
    }

    private getRealTimeSeverity(): 'low' | 'medium' | 'high' | 'critical' | undefined {
        if (this.realTimeStats.totalIssues === undefined) {
            return undefined;
        }
        if (this.realTimeStats.totalIssues === 0) {
            return 'low';
        }
        if (this.realTimeStats.totalIssues > 10) {
            return 'critical';
        }
        if (this.realTimeStats.totalIssues > 5) {
            return 'high';
        }
        return 'medium';
    }

    private getResultsDescription(): string {
        if (Object.keys(this.analysisResults).length === 0) {
            return 'No analysis results available';
        }
        const totalIssues = (this.analysisResults.vulnerabilities?.length || 0) + 
                           (this.analysisResults.secrets?.length || 0);
        return `${totalIssues} issues found`;
    }

    public addToFavorites(actionId: string): void {
        if (!this.favoriteActions.includes(actionId)) {
            this.favoriteActions.push(actionId);
            this.saveFavoriteActions();
            this.refresh();
        }
    }

    public removeFromFavorites(actionId: string): void {
        const index = this.favoriteActions.indexOf(actionId);
        if (index > -1) {
            this.favoriteActions.splice(index, 1);
            this.saveFavoriteActions();
            this.refresh();
        }
    }

    clearHistory(): void {
        this.analysisHistory = [];
        this.refresh();
    }
}