export const modernHTML = `
<div class="header">
    <h1><i class="fas fa-shield-alt"></i> Guardian Security</h1>
    <p>Advanced AI-Powered Security Analysis Platform</p>
</div>

<div class="main-content">
    <div class="toolbar">
        <div class="btn-group">
            <button class="btn btn-primary" onclick="runAnalysis('smart')">
                <i class="fas fa-brain"></i> Smart Analysis
            </button>
            <button class="btn btn-secondary" onclick="runAnalysis('comprehensive')">
                <i class="fas fa-search"></i> Comprehensive Scan
            </button>
            <button class="btn btn-info" onclick="runAnalysis('security')">
                <i class="fas fa-shield-alt"></i> Security
            </button>
            <button class="btn btn-warning" onclick="runAnalysis('devops')">
                <i class="fas fa-server"></i> DevOps
            </button>
            <button class="btn btn-success" onclick="runAnalysis('database')">
                <i class="fas fa-database"></i> Database
            </button>
        </div>
        <div class="btn-group">
            <button class="btn btn-info" onclick="exportReport('html')">
                <i class="fas fa-download"></i> Export
            </button>
            <button class="btn btn-secondary" onclick="toggleTheme()">
                <i class="fas fa-palette"></i> Theme
            </button>
        </div>
    </div>

    <div class="stats-grid" id="statsGrid">
        <div class="stat-card" onclick="showDetails('security')">
            <div class="stat-number" id="securityCount">0</div>
            <div class="stat-label">Security Issues</div>
        </div>
        <div class="stat-card" onclick="showDetails('secrets')">
            <div class="stat-number" id="secretsCount">0</div>
            <div class="stat-label">Secrets Found</div>
        </div>
        <div class="stat-card" onclick="showDetails('quality')">
            <div class="stat-number" id="qualityScore">0%</div>
            <div class="stat-label">Quality Score</div>
        </div>
        <div class="stat-card" onclick="showDetails('suggestions')">
            <div class="stat-number" id="suggestionsCount">0</div>
            <div class="stat-label">AI Suggestions</div>
        </div>
    </div>

    <div class="dashboard-grid">
        <div class="main-panel">
            <div class="tabs">
                <div class="tab active" onclick="switchTab('overview')">
                    <i class="fas fa-chart-pie"></i> Overview
                </div>
                <div class="tab" onclick="switchTab('issues')">
                    <i class="fas fa-exclamation-triangle"></i> Issues
                </div>
                <div class="tab" onclick="switchTab('suggestions')">
                    <i class="fas fa-lightbulb"></i> Suggestions
                </div>
                <div class="tab" onclick="switchTab('reports')">
                    <i class="fas fa-file-alt"></i> Reports
                </div>
            </div>
            
            <div class="tab-content active" id="overview">
                <div id="overviewContent">
                    <div class="empty-state">
                        <i class="fas fa-chart-line"></i>
                        <h3>Welcome to Guardian Security</h3>
                        <p>Run an analysis to see detailed security insights</p>
                        <button class="btn btn-primary" onclick="runAnalysis('smart')">
                            <i class="fas fa-play"></i> Start Smart Analysis
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="issues">
                <div id="issuesContent">
                    <div class="empty-state">
                        <i class="fas fa-shield-alt"></i>
                        <h3>No Issues Found</h3>
                        <p>Your code looks secure! Run an analysis to verify.</p>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="suggestions">
                <div id="suggestionsContent">
                    <div class="empty-state">
                        <i class="fas fa-lightbulb"></i>
                        <h3>AI Suggestions</h3>
                        <p>Get intelligent recommendations to improve your code</p>
                    </div>
                </div>
            </div>
            
            <div class="tab-content" id="reports">
                <div id="reportsContent">
                    <div class="empty-state">
                        <i class="fas fa-file-alt"></i>
                        <h3>Analysis Reports</h3>
                        <p>Export detailed reports in multiple formats</p>
                        <div class="btn-group" style="margin-top: 1rem;">
                            <button class="btn btn-info" onclick="exportReport('html')">
                                <i class="fas fa-file-code"></i> HTML
                            </button>
                            <button class="btn btn-success" onclick="exportReport('json')">
                                <i class="fas fa-file-code"></i> JSON
                            </button>
                            <button class="btn btn-warning" onclick="exportReport('csv')">
                                <i class="fas fa-file-csv"></i> CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="side-panel">
            <div class="main-panel">
                <div class="panel-header">
                    <div class="panel-title">
                        <i class="fas fa-history"></i> Analysis History
                    </div>
                </div>
                <div class="panel-content">
                    <div id="historyContent">
                        <div class="empty-state">
                            <i class="fas fa-history"></i>
                            <p>No analysis history yet</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="main-panel">
                <div class="panel-header">
                    <div class="panel-title">
                        <i class="fas fa-tachometer-alt"></i> Performance
                    </div>
                </div>
                <div class="panel-content">
                    <div style="text-align: center;">
                        <svg class="progress-ring" width="120" height="120">
                            <circle class="background" cx="60" cy="60" r="45"></circle>
                            <circle class="progress" cx="60" cy="60" r="45" id="qualityRing"></circle>
                        </svg>
                        <div style="margin-top: 1rem;">
                            <div style="font-size: 1.5rem; font-weight: 700;" id="qualityPercentage">0%</div>
                            <div style="color: var(--text-muted); font-size: 0.9rem;">Code Quality</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="real-time-indicator" id="realTimeIndicator" style="display: none;">
    <div class="pulse"></div>
    <span>Live Updates</span>
</div>

<div class="notification" id="notification">
    <div id="notificationContent"></div>
</div>
`;