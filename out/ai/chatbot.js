"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardianChatbot = void 0;
class GuardianChatbot {
    constructor(context) {
        this.sessions = new Map();
        this.currentSessionId = null;
        this.context = context;
        this.loadSessions();
    }
    createNewSession() {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            messages: [{
                    id: this.generateMessageId(),
                    role: 'system',
                    content: 'Hello! I\'m Guardian Security Assistant. I can help you with security analysis, code quality questions, and provide guidance on best practices. How can I assist you today?',
                    timestamp: new Date()
                }],
            createdAt: new Date(),
            lastActivity: new Date()
        };
        this.sessions.set(sessionId, session);
        this.currentSessionId = sessionId;
        this.saveSessions();
        return sessionId;
    }
    async sendMessage(message, analysisContext) {
        try {
            if (!this.currentSessionId) {
                this.createNewSession();
            }
            const session = this.sessions.get(this.currentSessionId);
            if (!session) {
                throw new Error('No active chat session');
            }
            // Validate message
            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                throw new Error('Invalid message: Message cannot be empty');
            }
            // Add user message
            const userMessage = {
                id: this.generateMessageId(),
                role: 'user',
                content: message.trim(),
                timestamp: new Date(),
                analysisContext
            };
            session.messages.push(userMessage);
            session.lastActivity = new Date();
            // Generate AI response with timeout
            const assistantMessage = await Promise.race([
                this.generateResponse(message.trim(), session, analysisContext),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Response timeout')), 10000))
            ]);
            session.messages.push(assistantMessage);
            this.saveSessions();
            return assistantMessage;
        }
        catch (error) {
            console.error('Error in sendMessage:', error);
            // Create error response
            const errorMessage = {
                id: this.generateMessageId(),
                role: 'assistant',
                content: `I apologize, but I encountered an error while processing your message. ${error instanceof Error ? error.message : 'Please try again.'}`,
                timestamp: new Date(),
                analysisContext
            };
            // Try to save error message to session
            try {
                const session = this.sessions.get(this.currentSessionId);
                if (session) {
                    session.messages.push(errorMessage);
                    this.saveSessions();
                }
            }
            catch (saveError) {
                console.error('Error saving error message:', saveError);
            }
            return errorMessage;
        }
    }
    async generateResponse(userMessage, session, analysisContext) {
        const response = await this.processUserQuery(userMessage, analysisContext);
        return {
            id: this.generateMessageId(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
            analysisContext
        };
    }
    async processUserQuery(query, analysisContext) {
        try {
            // Input validation
            if (!query || typeof query !== 'string') {
                return "I didn't receive a valid question. Please try asking again with a specific question about your code's security, quality, or best practices.";
            }
            const trimmedQuery = query.trim();
            if (trimmedQuery.length === 0) {
                return "Please ask me a question about your code's security, quality, or best practices. For example: 'What security issues do I have?' or 'How can I improve my code quality?'";
            }
            if (trimmedQuery.length > 1000) {
                return 'Your question is quite long. Please try to keep questions under 1000 characters for better processing.';
            }
            const lowerQuery = trimmedQuery.toLowerCase();
            // Enhanced query categorization with better pattern matching
            const queryPatterns = {
                security: ['security', 'vulnerability', 'exploit', 'attack', 'xss', 'injection', 'breach', 'secure', 'unsafe'],
                quality: ['quality', 'maintainability', 'complexity', 'refactor', 'clean', 'readable', 'maintainable'],
                secrets: ['secret', 'password', 'api key', 'token', 'credential', 'key', 'auth', 'private'],
                analysis: ['analyze', 'scan', 'check', 'review', 'examine', 'inspect', 'run'],
                practices: ['best practice', 'recommendation', 'improve', 'optimize', 'enhance', 'better'],
                help: ['help', 'how to', 'what is', 'explain', 'tutorial', 'guide', 'learn'],
                fix: ['fix', 'solve', 'resolve', 'repair', 'correct', 'address']
            };
            // Determine query category with confidence scoring
            let bestMatch = { category: 'general', confidence: 0 };
            for (const [category, patterns] of Object.entries(queryPatterns)) {
                const matches = patterns.filter(pattern => lowerQuery.includes(pattern)).length;
                const confidence = matches / patterns.length;
                if (confidence > bestMatch.confidence) {
                    bestMatch = { category, confidence };
                }
            }
            // Route to appropriate handler based on best match
            switch (bestMatch.category) {
                case 'security':
                    return this.handleSecurityQuery(trimmedQuery, analysisContext);
                case 'quality':
                    return this.handleQualityQuery(trimmedQuery, analysisContext);
                case 'secrets':
                    return this.handleSecretQuery(trimmedQuery, analysisContext);
                case 'analysis':
                    return this.handleAnalysisQuery(trimmedQuery, analysisContext);
                case 'practices':
                    return this.handleBestPracticesQuery(trimmedQuery, analysisContext);
                case 'help':
                    return this.handleHelpQuery(trimmedQuery, analysisContext);
                case 'fix':
                    return this.handleFixQuery(trimmedQuery, analysisContext);
                default:
                    return this.handleGeneralQuery(trimmedQuery, analysisContext);
            }
        }
        catch (error) {
            console.error('Error processing user query:', error);
            return 'I encountered an error while processing your question. Please try rephrasing your question or contact support if the issue persists.';
        }
    }
    handleSecurityQuery(query, analysisContext) {
        if (analysisContext?.vulnerabilities) {
            const vulnCount = analysisContext.vulnerabilities.length;
            if (vulnCount > 0) {
                return `I found ${vulnCount} security issue(s) in your code. Here are the main concerns:\n\n${analysisContext.vulnerabilities.slice(0, 3).map((v, i) => `${i + 1}. ${typeof v === 'string' ? v : v.description || 'Security vulnerability detected'}`).join('\n')}\n\nWould you like me to explain any specific vulnerability or provide remediation steps?`;
            }
            else {
                return 'Great news! No security vulnerabilities were detected in your current code. However, I recommend running regular security scans and following these best practices:\n\n• Validate all user inputs\n• Use parameterized queries to prevent SQL injection\n• Implement proper authentication and authorization\n• Keep dependencies updated\n• Use HTTPS for all communications';
            }
        }
        return "I can help you with security analysis! Here's what I can do:\n\n• **Vulnerability Detection**: Scan for common security issues like injection attacks, XSS, and insecure configurations\n• **Security Best Practices**: Provide recommendations for secure coding\n• **Threat Assessment**: Analyze potential security risks in your code\n\nTo get started, run a security analysis on your current file, and I'll provide detailed insights about any issues found.";
    }
    handleQualityQuery(query, analysisContext) {
        if (analysisContext?.qualityMetrics) {
            const metrics = analysisContext.qualityMetrics;
            const score = metrics.maintainabilityScore || 0;
            let assessment = '';
            if (score >= 80) {
                assessment = 'Excellent! Your code has high maintainability.';
            }
            else if (score >= 60) {
                assessment = 'Good code quality, but there\'s room for improvement.';
            }
            else {
                assessment = 'Your code needs attention to improve maintainability.';
            }
            return `**Code Quality Assessment**\n\n${assessment}\n\n• **Maintainability Score**: ${score}/100\n• **Complexity**: ${metrics.complexityScore || 'Not assessed'}\n• **Technical Debt**: ${metrics.technicalDebt || 'Low'}\n\n**Recommendations**:\n• Refactor complex functions into smaller, focused methods\n• Add comprehensive documentation\n• Implement consistent naming conventions\n• Remove duplicate code patterns`;
        }
        return "I can help you improve your code quality! Here's what I analyze:\n\n• **Maintainability Score**: How easy your code is to maintain and modify\n• **Complexity Metrics**: Identify overly complex functions and methods\n• **Technical Debt**: Areas that need refactoring for long-term health\n• **Code Smells**: Common patterns that indicate potential issues\n\nRun a quality analysis to get specific insights about your code!";
    }
    handleSecretQuery(query, analysisContext) {
        if (analysisContext?.secrets) {
            const secretCount = analysisContext.secrets.length;
            if (secretCount > 0) {
                return `⚠️ **Security Alert**: I detected ${secretCount} potential secret(s) in your code!\n\n${analysisContext.secrets.slice(0, 3).map((s, i) => `${i + 1}. ${typeof s === 'string' ? s : s.description || 'Potential secret detected'}`).join('\n')}\n\n**Immediate Actions**:\n• Remove these secrets from your code\n• Use environment variables or secure vaults\n• Rotate any exposed credentials\n• Add these patterns to .gitignore\n\nWould you like guidance on secure secret management?`;
            }
            else {
                return '✅ No secrets detected in your current code! Here are best practices for secret management:\n\n• **Environment Variables**: Store secrets in .env files (never commit these!)\n• **Secret Managers**: Use AWS Secrets Manager, Azure Key Vault, or similar\n• **Configuration Files**: Keep sensitive config separate from code\n• **Access Controls**: Limit who can access production secrets\n• **Rotation**: Regularly rotate API keys and passwords';
            }
        }
        return "I can help you detect and manage secrets securely! Here's what I look for:\n\n• **API Keys**: AWS, Google Cloud, third-party services\n• **Database Credentials**: Connection strings and passwords\n• **Authentication Tokens**: JWT tokens, OAuth secrets\n• **Private Keys**: SSH keys, certificates, encryption keys\n\nRun a secret detection scan to check your code for exposed credentials!";
    }
    handleAnalysisQuery(query, analysisContext) {
        if (analysisContext) {
            const hasVulns = analysisContext.vulnerabilities?.length > 0;
            const hasSecrets = analysisContext.secrets?.length > 0;
            const qualityScore = analysisContext.qualityMetrics?.maintainabilityScore || 0;
            const hasSuggestions = analysisContext.suggestions?.length > 0;
            let summary = '**Analysis Summary**\n\n';
            summary += `• **Security**: ${hasVulns ? `${analysisContext.vulnerabilities.length} issue(s) found` : 'No vulnerabilities detected'}\n`;
            summary += `• **Secrets**: ${hasSecrets ? `${analysisContext.secrets.length} secret(s) detected` : 'No secrets found'}\n`;
            summary += `• **Quality**: ${qualityScore}/100 maintainability score\n`;
            summary += `• **AI Suggestions**: ${hasSuggestions ? `${analysisContext.suggestions.length} improvement(s)` : 'No suggestions available'}\n\n`;
            if (hasVulns || hasSecrets || qualityScore < 70) {
                summary += '**Priority Actions**:\n';
                if (hasSecrets) {
                    summary += '1. 🚨 Address exposed secrets immediately\n';
                }
                if (hasVulns) {
                    summary += '2. 🛡️ Fix security vulnerabilities\n';
                }
                if (qualityScore < 70) {
                    summary += '3. 📊 Improve code maintainability\n';
                }
            }
            else {
                summary += '✅ Your code looks good! Keep following security best practices.';
            }
            return summary;
        }
        return "I can perform comprehensive code analysis! Here's what I can do:\n\n• **🛡️ Security Analysis**: Detect vulnerabilities and security risks\n• **🔐 Secret Detection**: Find exposed credentials and sensitive data\n• **📊 Quality Assessment**: Evaluate maintainability and complexity\n• **💡 AI Suggestions**: Get intelligent improvement recommendations\n\n**Quick Start**:\n1. Open a code file\n2. Run 'Guardian Security: Run All Analysis'\n3. Chat with me about the results!\n\nWhat would you like to analyze first?";
    }
    handleBestPracticesQuery(_query, _analysisContext) {
        const practices = [
            '**Security Best Practices**:',
            '• Always validate and sanitize user inputs',
            '• Use parameterized queries to prevent SQL injection',
            '• Implement proper authentication and authorization',
            '• Keep dependencies updated and scan for vulnerabilities',
            '• Use HTTPS for all data transmission',
            '• Store secrets securely (environment variables, vaults)',
            '',
            '**Code Quality Best Practices**:',
            '• Write clear, self-documenting code',
            '• Keep functions small and focused (single responsibility)',
            '• Use consistent naming conventions',
            '• Add comprehensive error handling',
            '• Write unit tests for critical functionality',
            '• Refactor regularly to reduce technical debt',
            '',
            '**Development Workflow**:',
            '• Use version control effectively',
            '• Implement code reviews',
            '• Automate testing and deployment',
            '• Monitor application performance and security'
        ];
        return practices.join('\n');
    }
    handleHelpQuery(_query, _analysisContext) {
        return "**Guardian Security Assistant Help**\n\nI'm here to help you with:\n\n**🔍 Analysis & Scanning**\n• Security vulnerability detection\n• Code quality assessment\n• Secret and credential detection\n• AI-powered improvement suggestions\n\n**💬 Questions I Can Answer**\n• \"How do I fix this security issue?\"\n• \"What does this vulnerability mean?\"\n• \"How can I improve my code quality?\"\n• \"What are the best practices for [topic]?\"\n• \"How do I secure my API keys?\"\n\n**🚀 Getting Started**\n1. Open any code file in VS Code\n2. Run an analysis using the command palette\n3. Ask me about the results!\n\n**💡 Pro Tips**\n• I can provide context-aware help based on your analysis results\n• Ask specific questions about vulnerabilities or code issues\n• Request explanations for any security or quality metrics\n\nWhat would you like to know more about?";
    }
    handleFixQuery(_query, analysisContext) {
        try {
            if (analysisContext) {
                const hasVulns = analysisContext.vulnerabilities?.length > 0;
                const hasSecrets = analysisContext.secrets?.length > 0;
                const qualityScore = analysisContext.qualityMetrics?.maintainabilityScore || 0;
                let fixGuide = '**🔧 Fix Recommendations**\n\n';
                if (hasSecrets) {
                    fixGuide += '**🚨 PRIORITY 1: Exposed Secrets**\n';
                    fixGuide += '• Remove secrets from code immediately\n';
                    fixGuide += '• Use environment variables or secure vaults\n';
                    fixGuide += '• Rotate any exposed credentials\n';
                    fixGuide += '• Add .env to .gitignore\n\n';
                }
                if (hasVulns) {
                    fixGuide += '**🛡️ PRIORITY 2: Security Vulnerabilities**\n';
                    const vulns = analysisContext.vulnerabilities.slice(0, 3);
                    vulns.forEach((vuln, i) => {
                        const vulnText = typeof vuln === 'string' ? vuln : vuln.description || 'Security issue';
                        if (vulnText.includes('XSS') || vulnText.includes('innerHTML')) {
                            fixGuide += `• ${i + 1}. Use textContent instead of innerHTML\n`;
                        }
                        else if (vulnText.includes('eval')) {
                            fixGuide += `• ${i + 1}. Replace eval() with JSON.parse() or safe alternatives\n`;
                        }
                        else if (vulnText.includes('HTTP')) {
                            fixGuide += `• ${i + 1}. Change HTTP URLs to HTTPS\n`;
                        }
                        else {
                            fixGuide += `• ${i + 1}. ${vulnText}\n`;
                        }
                    });
                    fixGuide += '\n';
                }
                if (qualityScore < 70) {
                    fixGuide += '**📊 PRIORITY 3: Code Quality**\n';
                    fixGuide += '• Break down large functions (< 20 lines each)\n';
                    fixGuide += '• Remove console.log statements\n';
                    fixGuide += '• Replace magic numbers with named constants\n';
                    fixGuide += '• Add proper error handling\n';
                    fixGuide += '• Resolve TODO and FIXME comments\n\n';
                }
                fixGuide += '**💡 Need specific help?** Ask me about any particular issue!';
                return fixGuide;
            }
            return "To provide specific fix recommendations, I need to analyze your code first. Run 'Guardian Security: Chat with Analysis Context' or ask me to 'analyze my code' to get detailed fix suggestions.";
        }
        catch (error) {
            console.error('Error in handleFixQuery:', error);
            return 'I encountered an error while generating fix recommendations. Please try running an analysis first and then ask for specific fix guidance.';
        }
    }
    handleGeneralQuery(query, analysisContext) {
        try {
            // Try to provide a helpful response based on keywords and context
            if (analysisContext && Object.keys(analysisContext).length > 0) {
                return "I can see you have analysis results available. Try asking me:\n\n• 'What issues should I fix first?'\n• 'How do I fix the security problems?'\n• 'What's my code quality score?'\n• 'Are there any secrets in my code?'\n\nWhat would you like to know about your analysis results?";
            }
            const responses = [
                "I'm here to help with your security and code quality questions! Could you be more specific about what you'd like to know?",
                'I can assist with security analysis, code quality assessment, and best practices. What specific area would you like help with?',
                'Feel free to ask me about:\n• Security vulnerabilities and how to fix them\n• Code quality improvements\n• Secret management best practices\n• Analysis results interpretation',
                "I'm your Guardian Security assistant! I can help explain analysis results, provide security guidance, and suggest code improvements. What's on your mind?"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }
        catch (error) {
            console.error('Error in handleGeneralQuery:', error);
            return "I'm here to help with security and code quality questions. Please try asking about specific topics like security issues, code quality, or best practices.";
        }
    }
    getCurrentSession() {
        if (!this.currentSessionId) {
            return null;
        }
        return this.sessions.get(this.currentSessionId) || null;
    }
    getAllSessions() {
        return Array.from(this.sessions.values()).sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    }
    switchToSession(sessionId) {
        if (this.sessions.has(sessionId)) {
            this.currentSessionId = sessionId;
            return true;
        }
        return false;
    }
    deleteSession(sessionId) {
        if (this.sessions.delete(sessionId)) {
            if (this.currentSessionId === sessionId) {
                this.currentSessionId = null;
            }
            this.saveSessions();
            return true;
        }
        return false;
    }
    clearAllSessions() {
        this.sessions.clear();
        this.currentSessionId = null;
        this.saveSessions();
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    saveSessions() {
        try {
            // Limit session storage to prevent memory issues
            const maxSessions = 10;
            const maxMessagesPerSession = 50;
            // Clean up old sessions if we have too many
            if (this.sessions.size > maxSessions) {
                const sortedSessions = Array.from(this.sessions.entries())
                    .sort(([, a], [, b]) => b.lastActivity.getTime() - a.lastActivity.getTime());
                // Keep only the most recent sessions
                this.sessions.clear();
                sortedSessions.slice(0, maxSessions).forEach(([id, session]) => {
                    // Limit messages per session
                    if (session.messages.length > maxMessagesPerSession) {
                        session.messages = session.messages.slice(-maxMessagesPerSession);
                    }
                    this.sessions.set(id, session);
                });
            }
            const sessionsData = Array.from(this.sessions.entries()).map(([_id, session]) => ({
                ...session,
                messages: session.messages.map(msg => ({
                    ...msg,
                    timestamp: msg.timestamp.toISOString(),
                    // Sanitize analysis context to prevent large storage
                    analysisContext: msg.analysisContext ? {
                        hasVulnerabilities: !!msg.analysisContext.vulnerabilities?.length,
                        vulnerabilityCount: msg.analysisContext.vulnerabilities?.length || 0,
                        hasSecrets: !!msg.analysisContext.secrets?.length,
                        secretCount: msg.analysisContext.secrets?.length || 0,
                        qualityScore: msg.analysisContext.qualityMetrics?.maintainabilityScore || 0
                    } : undefined
                })),
                createdAt: session.createdAt.toISOString(),
                lastActivity: session.lastActivity.toISOString()
            }));
            this.context.globalState.update('guardianChatSessions', sessionsData);
            this.context.globalState.update('guardianCurrentSessionId', this.currentSessionId);
        }
        catch (error) {
            console.error('Failed to save chat sessions:', error);
            // Try to save minimal data as fallback
            try {
                this.context.globalState.update('guardianCurrentSessionId', this.currentSessionId);
            }
            catch (fallbackError) {
                console.error('Failed to save even minimal session data:', fallbackError);
            }
        }
    }
    loadSessions() {
        try {
            const sessionsData = this.context.globalState.get('guardianChatSessions', []);
            const currentSessionId = this.context.globalState.get('guardianCurrentSessionId');
            this.sessions.clear();
            for (const sessionData of sessionsData) {
                const session = {
                    id: sessionData.id,
                    messages: sessionData.messages.map((msg) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    })),
                    createdAt: new Date(sessionData.createdAt),
                    lastActivity: new Date(sessionData.lastActivity)
                };
                this.sessions.set(session.id, session);
            }
            if (currentSessionId && this.sessions.has(currentSessionId)) {
                this.currentSessionId = currentSessionId;
            }
        }
        catch (error) {
            console.error('Failed to load chat sessions:', error);
        }
    }
}
exports.GuardianChatbot = GuardianChatbot;
//# sourceMappingURL=chatbot.js.map