export const modernCSS = `
:root {
    --primary: #6366f1;
    --primary-dark: #4f46e5;
    --secondary: #8b5cf6;
    --success: #10b981;
    --warning: #f59e0b;
    --error: #ef4444;
    --info: #3b82f6;
    --background: #0f172a;
    --surface: #1e293b;
    --surface-light: #334155;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --border: #475569;
    --shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    --radius: 12px;
    --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.light {
    --background: #ffffff;
    --surface: #f8fafc;
    --surface-light: #e2e8f0;
    --text: #1e293b;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--background);
    color: var(--text);
    line-height: 1.6;
    overflow-x: hidden;
}

#app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    padding: 2rem;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.header::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    animation: shimmer 3s infinite;
}

@keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
}

.header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    color: white;
}

.header p {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.9);
}

.main-content {
    flex: 1;
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
}

.toolbar {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
}

.btn-group {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    overflow: hidden;
    text-decoration: none;
    font-size: 0.9rem;
}

.btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
}

.btn:hover::before {
    left: 100%;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.btn-primary { background: var(--primary); color: white; }
.btn-secondary { background: var(--secondary); color: white; }
.btn-success { background: var(--success); color: white; }
.btn-warning { background: var(--warning); color: white; }
.btn-error { background: var(--error); color: white; }
.btn-info { background: var(--info); color: white; }

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: var(--surface);
    padding: 2rem;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    text-align: center;
    transition: var(--transition);
    position: relative;
    overflow: hidden;
    cursor: pointer;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary), var(--secondary));
    transform: scaleX(0);
    transition: transform 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}

.stat-card:hover::before {
    transform: scaleX(1);
}

.stat-number {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-label {
    color: var(--text-muted);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
}

.main-panel {
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
}

.side-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.panel-header {
    padding: 1.5rem;
    background: var(--surface-light);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: between;
}

.panel-title {
    font-size: 1.2rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.panel-content {
    padding: 1.5rem;
    flex: 1;
}

.tabs {
    display: flex;
    background: var(--surface-light);
    border-radius: var(--radius) var(--radius) 0 0;
}

.tab {
    flex: 1;
    padding: 1rem;
    text-align: center;
    cursor: pointer;
    transition: var(--transition);
    border-bottom: 3px solid transparent;
    font-weight: 600;
}

.tab:hover {
    background: var(--surface);
}

.tab.active {
    background: var(--surface);
    border-bottom-color: var(--primary);
    color: var(--primary);
}

.tab-content {
    display: none;
    padding: 1.5rem;
}

.tab-content.active {
    display: block;
}

.issue-list {
    max-height: 400px;
    overflow-y: auto;
}

.issue-item {
    padding: 1rem;
    margin-bottom: 0.5rem;
    border-radius: var(--radius);
    border-left: 4px solid;
    transition: var(--transition);
    cursor: pointer;
    position: relative;
}

.issue-item:hover {
    transform: translateX(4px);
    box-shadow: var(--shadow);
}

.issue-critical {
    background: rgba(239, 68, 68, 0.1);
    border-left-color: var(--error);
}

.issue-high {
    background: rgba(245, 158, 11, 0.1);
    border-left-color: var(--warning);
}

.issue-medium {
    background: rgba(59, 130, 246, 0.1);
    border-left-color: var(--info);
}

.issue-low {
    background: rgba(16, 185, 129, 0.1);
    border-left-color: var(--success);
}

.issue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.issue-title {
    font-weight: 600;
    font-size: 0.9rem;
}

.issue-severity {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.severity-critical { background: var(--error); color: white; }
.severity-high { background: var(--warning); color: white; }
.severity-medium { background: var(--info); color: white; }
.severity-low { background: var(--success); color: white; }

.issue-description {
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.4;
}

.issue-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.btn-small {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    border-radius: 4px;
}

.progress-ring {
    width: 120px;
    height: 120px;
    margin: 0 auto;
}

.progress-ring circle {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
}

.progress-ring .background {
    stroke: var(--border);
}

.progress-ring .progress {
    stroke: var(--primary);
    stroke-dasharray: 283;
    stroke-dashoffset: 283;
    transition: stroke-dashoffset 1s ease-in-out;
}

.loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-muted);
}

.empty-state i {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.history-item {
    padding: 1rem;
    margin-bottom: 0.5rem;
    background: var(--surface-light);
    border-radius: var(--radius);
    cursor: pointer;
    transition: var(--transition);
}

.history-item:hover {
    background: var(--surface);
    transform: translateX(4px);
}

.history-timestamp {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
}

.history-summary {
    font-size: 0.9rem;
    font-weight: 500;
}

@media (max-width: 768px) {
    .dashboard-grid {
        grid-template-columns: 1fr;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .toolbar {
        flex-direction: column;
        align-items: stretch;
    }
    
    .btn-group {
        justify-content: center;
    }
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    border-left: 4px solid var(--primary);
    z-index: 1000;
    transform: translateX(400px);
    transition: transform 0.3s ease;
}

.notification.show {
    transform: translateX(0);
}

.real-time-indicator {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 0.5rem 1rem;
    background: var(--success);
    color: white;
    border-radius: 20px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.pulse {
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}
`;