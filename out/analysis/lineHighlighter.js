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
exports.LineHighlighter = void 0;
const vscode = __importStar(require("vscode"));
class LineHighlighter {
    constructor() {
        this.decorationTypes = new Map();
        this.activeHighlights = new Map();
        this.initializeDecorationTypes();
        this.setupEventListeners();
    }
    initializeDecorationTypes() {
        // Critical security issues - Red background with error icon
        this.decorationTypes.set('security-critical', vscode.window.createTextEditorDecorationType({
            backgroundColor: new vscode.ThemeColor('inputValidation.errorBackground'),
            border: '2px solid',
            borderColor: new vscode.ThemeColor('inputValidation.errorBorder'),
            borderRadius: '3px',
            overviewRulerColor: new vscode.ThemeColor('inputValidation.errorBorder'),
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            gutterIconSize: 'contain',
            after: {
                contentText: ' 🚨',
                color: new vscode.ThemeColor('inputValidation.errorForeground')
            }
        }));
        // High security issues - Orange/red background
        this.decorationTypes.set('security-high', vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            border: '1px solid red',
            borderRadius: '2px',
            overviewRulerColor: 'red',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            after: {
                contentText: ' ⚠️',
                color: 'red'
            }
        }));
        // Medium security issues - Yellow background
        this.decorationTypes.set('security-medium', vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 165, 0, 0.2)',
            border: '1px solid orange',
            borderRadius: '2px',
            overviewRulerColor: 'orange',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            after: {
                contentText: ' ⚠️',
                color: 'orange'
            }
        }));
        // Secret detection - Purple background
        this.decorationTypes.set('secret', vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(128, 0, 128, 0.2)',
            border: '1px solid purple',
            borderRadius: '2px',
            overviewRulerColor: 'purple',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
            after: {
                contentText: ' 🔐',
                color: 'purple'
            }
        }));
        // Quality issues - Blue background
        this.decorationTypes.set('quality', vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 0, 255, 0.1)',
            border: '1px solid blue',
            borderRadius: '2px',
            overviewRulerColor: 'blue',
            overviewRulerLane: vscode.OverviewRulerLane.Left,
            after: {
                contentText: ' 💡',
                color: 'blue'
            }
        }));
    }
    setupEventListeners() {
        // Update highlights when active editor changes
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                this.updateHighlights(editor);
            }
        });
        // Update highlights when document content changes
        vscode.workspace.onDidChangeTextDocument((event) => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === event.document) {
                // Debounce the highlight update
                setTimeout(() => this.updateHighlights(editor), 500);
            }
        });
    }
    highlightSecurityIssues(document, vulnerabilities) {
        const highlights = [];
        const text = document.getText();
        const lines = text.split('\n');
        vulnerabilities.forEach(vuln => {
            const severity = this.getSecuritySeverity(vuln);
            // Find lines containing security issues
            lines.forEach((line, lineIndex) => {
                const issues = this.findSecurityIssuesInLine(line, vuln);
                issues.forEach(issue => {
                    highlights.push({
                        line: lineIndex,
                        column: issue.column,
                        length: issue.length,
                        message: vuln,
                        severity,
                        type: 'security'
                    });
                });
            });
        });
        return highlights;
    }
    highlightSecrets(document, secrets) {
        const highlights = [];
        const text = document.getText();
        const lines = text.split('\n');
        secrets.forEach(secret => {
            // Extract the actual secret pattern from the description
            const secretPattern = this.extractSecretPattern(secret);
            if (!secretPattern) {
                return;
            }
            lines.forEach((line, lineIndex) => {
                const matches = this.findSecretsInLine(line, secretPattern);
                matches.forEach(match => {
                    highlights.push({
                        line: lineIndex,
                        column: match.column,
                        length: match.length,
                        message: secret,
                        severity: 'warning',
                        type: 'secret'
                    });
                });
            });
        });
        return highlights;
    }
    highlightQualityIssues(document, qualityIssues) {
        const highlights = [];
        const text = document.getText();
        const lines = text.split('\n');
        qualityIssues.forEach(issue => {
            lines.forEach((line, lineIndex) => {
                const matches = this.findQualityIssuesInLine(line, issue);
                matches.forEach(match => {
                    highlights.push({
                        line: lineIndex,
                        column: match.column,
                        length: match.length,
                        message: issue,
                        severity: 'info',
                        type: 'quality'
                    });
                });
            });
        });
        return highlights;
    }
    findSecurityIssuesInLine(line, vulnerability) {
        const matches = [];
        // Define patterns for different security issues
        const patterns = [
            { regex: /eval\s*\(/gi, keywords: ['eval', 'injection'] },
            { regex: /innerHTML\s*=/gi, keywords: ['innerHTML', 'XSS'] },
            { regex: /document\.write\s*\(/gi, keywords: ['document.write', 'XSS'] },
            { regex: /setTimeout\s*\(\s*["']/gi, keywords: ['setTimeout', 'injection'] },
            { regex: /http:\/\//gi, keywords: ['http://', 'insecure'] },
            { regex: /password.*console\.log/gi, keywords: ['password', 'console.log'] },
            { regex: /\.innerHTML\s*\+=/gi, keywords: ['innerHTML', 'XSS'] },
            { regex: /dangerouslySetInnerHTML/gi, keywords: ['dangerouslySetInnerHTML', 'XSS'] }
        ];
        patterns.forEach(pattern => {
            if (pattern.keywords.some(keyword => vulnerability.toLowerCase().includes(keyword.toLowerCase()))) {
                let match;
                while ((match = pattern.regex.exec(line)) !== null) {
                    matches.push({
                        column: match.index,
                        length: match[0].length
                    });
                }
            }
        });
        return matches;
    }
    findSecretsInLine(line, _secretPattern) {
        const matches = [];
        // Common secret patterns
        const patterns = [
            /AKIA[0-9A-Z]{16}/g,
            /ghp_[a-zA-Z0-9]{36}/g,
            /[aA][pP][iI][_]?[kK][eE][yY]['"]\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]/g,
            /[pP][aA][sS][sS][wW][oO][rR][dD]['"]\s*[:=]\s*['"][^'"]{8,}['"]/g,
            /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
            /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
            /(mongodb|mysql|postgresql):\/\/[^\s'"]+/g // Database URL
        ];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(line)) !== null) {
                matches.push({
                    column: match.index,
                    length: match[0].length
                });
            }
        });
        return matches;
    }
    findQualityIssuesInLine(line, issue) {
        const matches = [];
        // Quality issue patterns
        const patterns = [
            { regex: /TODO/gi, keywords: ['TODO'] },
            { regex: /FIXME/gi, keywords: ['FIXME'] },
            { regex: /console\.log/gi, keywords: ['console.log', 'debug'] },
            { regex: /\b\d{2,}\b/g, keywords: ['magic', 'numbers'] }
        ];
        patterns.forEach(pattern => {
            if (pattern.keywords.some(keyword => issue.toLowerCase().includes(keyword.toLowerCase()))) {
                let match;
                while ((match = pattern.regex.exec(line)) !== null) {
                    matches.push({
                        column: match.index,
                        length: match[0].length
                    });
                }
            }
        });
        return matches;
    }
    extractSecretPattern(secret) {
        // Extract the actual pattern from secret description
        const match = secret.match(/:\s*(.+?)\s*\(/);
        return match ? match[1] : null;
    }
    getSecuritySeverity(vulnerability) {
        const criticalKeywords = ['injection', 'XSS', 'eval', 'private key'];
        const highKeywords = ['insecure', 'password', 'console.log'];
        const vulnLower = vulnerability.toLowerCase();
        if (criticalKeywords.some(keyword => vulnLower.includes(keyword))) {
            return 'error';
        }
        else if (highKeywords.some(keyword => vulnLower.includes(keyword))) {
            return 'warning';
        }
        return 'info';
    }
    updateHighlights(editor) {
        const filePath = editor.document.fileName;
        const highlights = this.activeHighlights.get(filePath) || [];
        // Clear existing decorations
        this.decorationTypes.forEach(decorationType => {
            editor.setDecorations(decorationType, []);
        });
        // Group highlights by type and severity
        const decorationMap = new Map();
        highlights.forEach(highlight => {
            let decorationKey = '';
            if (highlight.type === 'security') {
                decorationKey = `security-${highlight.severity === 'error' ? 'critical' : highlight.severity === 'warning' ? 'high' : 'medium'}`;
            }
            else {
                decorationKey = highlight.type;
            }
            if (!decorationMap.has(decorationKey)) {
                decorationMap.set(decorationKey, []);
            }
            const range = new vscode.Range(highlight.line, highlight.column, highlight.line, highlight.column + highlight.length);
            decorationMap.get(decorationKey).push({
                range,
                hoverMessage: new vscode.MarkdownString(`**Guardian Security**: ${highlight.message}`)
            });
        });
        // Apply decorations
        decorationMap.forEach((decorations, decorationKey) => {
            const decorationType = this.decorationTypes.get(decorationKey);
            if (decorationType) {
                editor.setDecorations(decorationType, decorations);
            }
        });
    }
    setHighlights(filePath, highlights) {
        this.activeHighlights.set(filePath, highlights);
        // Update highlights if this file is currently active
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.fileName === filePath) {
            this.updateHighlights(activeEditor);
        }
    }
    clearHighlights(filePath) {
        this.activeHighlights.delete(filePath);
        // Clear decorations if this file is currently active
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && activeEditor.document.fileName === filePath) {
            this.decorationTypes.forEach(decorationType => {
                activeEditor.setDecorations(decorationType, []);
            });
        }
    }
    dispose() {
        this.decorationTypes.forEach(decorationType => {
            decorationType.dispose();
        });
        this.decorationTypes.clear();
        this.activeHighlights.clear();
    }
}
exports.LineHighlighter = LineHighlighter;
//# sourceMappingURL=lineHighlighter.js.map