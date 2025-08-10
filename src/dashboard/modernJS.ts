export const modernJavaScript = `
const vscode = acquireVsCodeApi();
let currentData = {};
let isAnalyzing = false;

// Message handling
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.command) {
        case 'updateData':
            updateDashboard(message.data);
            break;
        case 'setAnalyzing':
            setAnalyzing(message.analyzing);
            break;
        case 'historyCleared':
            clearHistory();
            break;
        case 'heartbeat':
            updateRealTimeIndicator(message.timestamp);
            break;
    }
});

function runAnalysis(type) {
    if (isAnalyzing) return;
    
    vscode.postMessage({
        command: 'runAnalysis',
        type: type
    });
    
    setAnalyzing(true);
    showNotification(\`Starting \${type} analysis...\`, 'info');
}

function setAnalyzing(analyzing) {
    isAnalyzing = analyzing;
    
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        if (analyzing) {
            btn.disabled = true;
            btn.style.opacity = '0.6';
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    });

    if (analyzing) {
        document.getElementById('realTimeIndicator').style.display = 'flex';
    }
}

function updateDashboard(data) {
    currentData = data;
    setAnalyzing(false);
    
    // Update stats
    document.getElementById('securityCount').textContent = data.vulnerabilities?.length || 0;
    document.getElementById('secretsCount').textContent = data.secrets?.length || 0;
    document.getElementById('qualityScore').textContent = (data.qualityMetrics?.maintainabilityScore || 0) + '%';
    document.getElementById('suggestionsCount').textContent = data.suggestions?.length || 0;
    
    // Update quality ring
    updateQualityRing(data.qualityMetrics?.maintainabilityScore || 0);
    
    // Update content areas
    updateOverviewContent(data);
    updateIssuesContent(data);
    updateSuggestionsContent(data);
    
    showNotification('Analysis completed successfully!', 'success');
    
    setTimeout(() => {
        document.getElementById('realTimeIndicator').style.display = 'none';
    }, 2000);
}

function updateQualityRing(score) {
    const ring = document.getElementById('qualityRing');
    const percentage = document.getElementById('qualityPercentage');
    
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (score / 100) * circumference;
    
    ring.style.strokeDashoffset = offset;
    percentage.textContent = score + '%';
    
    // Color based on score
    if (score >= 80) {
        ring.style.stroke = 'var(--success)';
    } else if (score >= 60) {
        ring.style.stroke = 'var(--warning)';
    } else {
        ring.style.stroke = 'var(--error)';
    }
}

function updateOverviewContent(data) {
    const content = document.getElementById('overviewContent');
    const totalIssues = (data.vulnerabilities?.length || 0) + (data.secrets?.length || 0);
    
    if (totalIssues === 0) {
        content.innerHTML = \`
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: var(--success); margin-bottom: 1rem;"></i>
                <h3>All Clear! 🎉</h3>
                <p>No security issues detected in your code.</p>
                <div style="margin-top: 1rem;">
                    <div class="stat-card" style="display: inline-block; margin: 0.5rem;">
                        <div class="stat-number">\${data.qualityMetrics?.maintainabilityScore || 0}%</div>
                        <div class="stat-label">Quality Score</div>
                    </div>
                </div>
            </div>
        \`;
    } else {
        content.innerHTML = \`
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--warning); margin-bottom: 1rem;"></i>
                <h3>Issues Found</h3>
                <p>\${totalIssues} security issue\${totalIssues > 1 ? 's' : ''} require attention.</p>
                <button class="btn btn-primary" onclick="switchTab('issues')" style="margin-top: 1rem;">
                    <i class="fas fa-arrow-right"></i> View Details
                </button>
            </div>
        \`;
    }
}

function updateIssuesContent(data) {
    const content = document.getElementById('issuesContent');
    let html = '';
    
    // Security issues
    if (data.vulnerabilities?.length > 0) {
        html += '<h4><i class="fas fa-shield-alt"></i> Security Vulnerabilities</h4>';
        html += '<div class="issue-list">';
        data.vulnerabilities.forEach((vuln, index) => {
            const severity = getSeverity(vuln);
            html += \`
                <div class="issue-item issue-\${severity}">
                    <div class="issue-header">
                        <div class="issue-title">\${vuln.type || 'Security Issue'}</div>
                        <div class="issue-severity severity-\${severity}">\${severity}</div>
                    </div>
                    <div class="issue-description">\${vuln.description || vuln}</div>
                    <div class="issue-actions">
                        <button class="btn btn-small btn-primary" onclick="fixIssue(\${index}, 'security')">
                            <i class="fas fa-wrench"></i> Fix
                        </button>
                        <button class="btn btn-small btn-secondary" onclick="ignoreIssue(\${index}, 'security')">
                            <i class="fas fa-eye-slash"></i> Ignore
                        </button>
                    </div>
                </div>
            \`;
        });
        html += '</div>';
    }
    
    // Secrets
    if (data.secrets?.length > 0) {
        html += '<h4 style="margin-top: 2rem;"><i class="fas fa-key"></i> Detected Secrets</h4>';
        html += '<div class="issue-list">';
        data.secrets.forEach((secret, index) => {
            html += \`
                <div class="issue-item issue-high">
                    <div class="issue-header">
                        <div class="issue-title">Secret Detected</div>
                        <div class="issue-severity severity-high">HIGH</div>
                    </div>
                    <div class="issue-description">\${secret.description || secret}</div>
                    <div class="issue-actions">
                        <button class="btn btn-small btn-primary" onclick="fixIssue(\${index}, 'secret')">
                            <i class="fas fa-wrench"></i> Secure
                        </button>
                        <button class="btn btn-small btn-secondary" onclick="ignoreIssue(\${index}, 'secret')">
                            <i class="fas fa-eye-slash"></i> Ignore
                        </button>
                    </div>
                </div>
            \`;
        });
        html += '</div>';
    }
    
    if (html === '') {
        html = \`
            <div class="empty-state">
                <i class="fas fa-shield-alt"></i>
                <h3>No Issues Found</h3>
                <p>Your code looks secure!</p>
            </div>
        \`;
    }
    
    content.innerHTML = html;
}

function updateSuggestionsContent(data) {
    const content = document.getElementById('suggestionsContent');
    let html = '';
    
    if (data.suggestions?.length > 0) {
        html += '<div class="issue-list">';
        data.suggestions.forEach((suggestion, index) => {
            html += \`
                <div class="issue-item issue-low">
                    <div class="issue-header">
                        <div class="issue-title">AI Suggestion #\${index + 1}</div>
                        <div class="issue-severity severity-low">SUGGESTION</div>
                    </div>
                    <div class="issue-description">\${suggestion.description || suggestion}</div>
                    <div class="issue-actions">
                        <button class="btn btn-small btn-success" onclick="applySuggestion(\${index})">
                            <i class="fas fa-check"></i> Apply
                        </button>
                    </div>
                </div>
            \`;
        });
        html += '</div>';
    } else {
        html = \`
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <h3>No Suggestions Available</h3>
                <p>Run an analysis to get AI-powered recommendations</p>
            </div>
        \`;
    }
    
    content.innerHTML = html;
}

function getSeverity(issue) {
    if (typeof issue === 'object' && issue.severity) {
        return issue.severity.toLowerCase();
    }
    
    const text = (issue.description || issue || '').toLowerCase();
    if (text.includes('critical') || text.includes('injection') || text.includes('xss')) {
        return 'critical';
    }
    if (text.includes('high') || text.includes('password') || text.includes('secret')) {
        return 'high';
    }
    if (text.includes('medium') || text.includes('warning')) {
        return 'medium';
    }
    return 'low';
}

function switchTab(tabName) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function exportReport(format) {
    vscode.postMessage({
        command: 'exportReport',
        format: format,
        data: currentData
    });
    
    showNotification(\`Exporting report as \${format.toUpperCase()}...\`, 'info');
}

function toggleTheme() {
    vscode.postMessage({
        command: 'toggleTheme'
    });
}

function fixIssue(index, type) {
    vscode.postMessage({
        command: 'fixIssue',
        issue: { index, type, data: currentData }
    });
    
    showNotification('Attempting to fix issue...', 'info');
}

function ignoreIssue(index, type) {
    vscode.postMessage({
        command: 'ignoreIssue',
        issue: { index, type, id: \`\${type}_\${index}\` }
    });
    
    showNotification('Issue added to ignore list', 'success');
}

function applySuggestion(index) {
    showNotification('AI suggestion noted for review', 'info');
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const content = document.getElementById('notificationContent');
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    content.innerHTML = \`
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="\${icons[type] || icons.info}"></i>
            <span>\${message}</span>
        </div>
    \`;
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function updateRealTimeIndicator(timestamp) {
    const indicator = document.getElementById('realTimeIndicator');
    if (indicator.style.display !== 'none') {
        indicator.title = \`Last update: \${new Date(timestamp).toLocaleTimeString()}\`;
    }
}

function clearHistory() {
    document.getElementById('historyContent').innerHTML = \`
        <div class="empty-state">
            <i class="fas fa-history"></i>
            <p>History cleared</p>
        </div>
    \`;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    showNotification('Guardian Security Dashboard loaded', 'success');
});
`;